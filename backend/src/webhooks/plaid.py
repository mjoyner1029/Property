"""
Webhook handlers for Plaid financial services.
"""
from flask import request, jsonify, current_app
import os
import hmac
import hashlib
from datetime import datetime

from ..models.user import User
from ..models.bank_account import BankAccount
from ..extensions import db

def register_plaid_webhooks(bp):
    """Register Plaid webhook routes with the provided blueprint"""
    
    @bp.route("/plaid", methods=["POST"])
    def plaid_webhook():
        # Verify webhook signature if Plaid webhook signing is enabled
        plaid_secret = os.getenv("PLAID_WEBHOOK_SECRET")
        if plaid_secret:
            if not verify_plaid_webhook(request, plaid_secret):
                current_app.logger.warning("Invalid Plaid webhook signature")
                return jsonify({"error": "Invalid signature"}), 401
        
        # Process the webhook
        try:
            webhook_data = request.json
            webhook_type = webhook_data.get("webhook_type")
            webhook_code = webhook_data.get("webhook_code")
            
            current_app.logger.info(f"Received Plaid webhook: {webhook_type}/{webhook_code}")
            
            # Process based on webhook type
            if webhook_type == "ITEM":
                process_item_webhook(webhook_code, webhook_data)
            elif webhook_type == "TRANSACTIONS":
                process_transactions_webhook(webhook_code, webhook_data)
            elif webhook_type == "AUTH":
                process_auth_webhook(webhook_code, webhook_data)
            elif webhook_type == "TRANSFER":
                process_transfer_webhook(webhook_code, webhook_data)
            else:
                current_app.logger.info(f"Unhandled Plaid webhook type: {webhook_type}")
            
            return jsonify({"status": "success"}), 200
            
        except Exception as e:
            current_app.logger.error(f"Error processing Plaid webhook: {str(e)}")
            return jsonify({"error": str(e)}), 500


def verify_plaid_webhook(request, webhook_secret):
    """Verify the Plaid webhook signature"""
    plaid_signature = request.headers.get("Plaid-Verification")
    if not plaid_signature:
        return False
    
    # Compute expected signature
    body = request.data.decode("utf-8")
    h = hmac.new(
        webhook_secret.encode("utf-8"),
        body.encode("utf-8"),
        hashlib.sha256
    )
    expected_signature = h.hexdigest()
    
    # Compare signatures using constant-time comparison
    return hmac.compare_digest(plaid_signature, expected_signature)


def process_item_webhook(webhook_code, webhook_data):
    """Process Plaid ITEM webhook"""
    item_id = webhook_data.get("item_id")
    
    if webhook_code == "ERROR":
        # Handle item error
        error_type = webhook_data.get("error", {}).get("error_type")
        error_code = webhook_data.get("error", {}).get("error_code")
        current_app.logger.error(f"Plaid item error: {error_type}/{error_code} for item {item_id}")
        
        # Update account status in database
        update_account_error_status(item_id, error_type, error_code)
        
    elif webhook_code == "PENDING_EXPIRATION":
        # Handle pending expiration
        days_until_expiration = webhook_data.get("consent_expiration_time")
        current_app.logger.info(f"Plaid item pending expiration in {days_until_expiration} days: {item_id}")
        
        # Notify user about expiring access
        notify_user_about_expiring_access(item_id, days_until_expiration)
        
    elif webhook_code == "USER_PERMISSION_REVOKED":
        # Handle user revoked permissions
        current_app.logger.info(f"Plaid user permission revoked for item {item_id}")
        
        # Disable account in database
        disable_bank_account(item_id)


def process_transactions_webhook(webhook_code, webhook_data):
    """Process Plaid TRANSACTIONS webhook"""
    item_id = webhook_data.get("item_id")
    
    if webhook_code == "INITIAL_UPDATE":
        # Initial transactions have loaded
        current_app.logger.info(f"Plaid initial transactions loaded for item {item_id}")
        
        # Update account status to active
        update_account_status(item_id, "active", "Transactions loaded")
        
    elif webhook_code == "HISTORICAL_UPDATE":
        # Historical transactions have loaded
        current_app.logger.info(f"Plaid historical transactions loaded for item {item_id}")
        
    elif webhook_code == "DEFAULT_UPDATE":
        # New transactions are available
        new_transactions = webhook_data.get("new_transactions")
        current_app.logger.info(f"Plaid {new_transactions} new transactions for item {item_id}")
        
        # Fetch new transactions
        fetch_new_transactions(item_id, new_transactions)
        
    elif webhook_code == "TRANSACTIONS_REMOVED":
        # Transactions have been removed
        removed_transactions = webhook_data.get("removed_transactions")
        current_app.logger.info(f"Plaid {len(removed_transactions)} transactions removed for item {item_id}")
        
        # Remove transactions from database
        remove_transactions(item_id, removed_transactions)


def process_auth_webhook(webhook_code, webhook_data):
    """Process Plaid AUTH webhook"""
    item_id = webhook_data.get("item_id")
    
    if webhook_code == "AUTOMATICALLY_VERIFIED":
        # Account numbers have been verified
        current_app.logger.info(f"Plaid account automatically verified for item {item_id}")
        
        # Update account verification status
        update_account_verification(item_id, True)
        
    elif webhook_code == "VERIFICATION_EXPIRED":
        # Verification has expired
        current_app.logger.info(f"Plaid verification expired for item {item_id}")
        
        # Update verification status
        update_account_verification(item_id, False)


def process_transfer_webhook(webhook_code, webhook_data):
    """Process Plaid TRANSFER webhook"""
    transfer_id = webhook_data.get("transfer_id")
    
    if webhook_code == "TRANSFER_CREATED":
        # Transfer has been created
        current_app.logger.info(f"Plaid transfer created: {transfer_id}")
        
    elif webhook_code == "TRANSFER_FAILED":
        # Transfer failed
        current_app.logger.error(f"Plaid transfer failed: {transfer_id}")
        failure_reason = webhook_data.get("failure_reason")
        
        # Update transfer status
        update_transfer_status(transfer_id, "failed", failure_reason)
        
    elif webhook_code == "TRANSFER_COMPLETED":
        # Transfer completed successfully
        current_app.logger.info(f"Plaid transfer completed: {transfer_id}")
        
        # Update transfer status
        update_transfer_status(transfer_id, "completed")


# Helper functions for database updates

def update_account_error_status(item_id, error_type, error_code):
    """Update account with error information"""
    try:
        account = BankAccount.query.filter_by(plaid_item_id=item_id).first()
        if account:
            account.status = "error"
            account.error_type = error_type
            account.error_code = error_code
            account.updated_at = datetime.utcnow()
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating account status: {str(e)}")


def notify_user_about_expiring_access(item_id, days_until_expiration):
    """Notify user about expiring bank account access"""
    try:
        account = BankAccount.query.filter_by(plaid_item_id=item_id).first()
        if account and account.user_id:
            user = db.session.get(User, account.user_id)
            if user:
                # Send notification
                from ..utils.email_service import send_email
                
                send_email(
                    to=user.email,
                    subject="Your Bank Account Connection Is Expiring",
                    body=f"Your connection to {account.institution_name} will expire in {days_until_expiration} days. " +
                         "Please log in to reconnect your account."
                )
    except Exception as e:
        current_app.logger.error(f"Error notifying user about expiring access: {str(e)}")


def disable_bank_account(item_id):
    """Disable a bank account when permissions are revoked"""
    try:
        account = BankAccount.query.filter_by(plaid_item_id=item_id).first()
        if account:
            account.status = "disabled"
            account.error_type = "permissions_revoked"
            account.updated_at = datetime.utcnow()
            db.session.commit()
            
            # Notify user if applicable
            if account.user_id:
                user = db.session.get(User, account.user_id)
                if user:
                    from ..utils.email_service import send_email
                    
                    send_email(
                        to=user.email,
                        subject="Bank Account Connection Disabled",
                        body=f"Your connection to {account.institution_name} has been disabled. " +
                             "Please log in to reconnect your account if needed."
                    )
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error disabling bank account: {str(e)}")


def update_account_status(item_id, status, message=None):
    """Update bank account status"""
    try:
        account = BankAccount.query.filter_by(plaid_item_id=item_id).first()
        if account:
            account.status = status
            if message:
                account.notes = message
            account.updated_at = datetime.utcnow()
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating account status: {str(e)}")


def fetch_new_transactions(item_id, count):
    """Fetch new transactions from Plaid"""
    # Implementation would depend on your Plaid client setup
    # This is a placeholder for the actual implementation
    current_app.logger.info(f"Would fetch {count} transactions for item {item_id}")


def remove_transactions(item_id, transaction_ids):
    """Remove transactions from database"""
    # Implementation would depend on your transaction model
    # This is a placeholder for the actual implementation
    current_app.logger.info(f"Would remove {len(transaction_ids)} transactions for item {item_id}")


def update_account_verification(item_id, verified):
    """Update account verification status"""
    try:
        account = BankAccount.query.filter_by(plaid_item_id=item_id).first()
        if account:
            account.is_verified = verified
            account.verified_at = datetime.utcnow() if verified else None
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating account verification: {str(e)}")


def update_transfer_status(transfer_id, status, failure_reason=None):
    """Update transfer status in database"""
    # Implementation would depend on your transfer model
    # This is a placeholder for the actual implementation
    current_app.logger.info(f"Would update transfer {transfer_id} to status {status}")