"""
Webhook handlers for Stripe payment processing service.
"""
from flask import request, jsonify, current_app
import stripe
import os
from datetime import datetime

from ..models.payment import Payment
from ..models.invoice import Invoice
from ..models.user import User
from ..extensions import db
from ..utils.email_service import send_payment_receipt

# Initialize Stripe with API key
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

def register_stripe_webhooks(bp):
    """Register Stripe webhook routes with the provided blueprint"""
    
    @bp.route("/stripe", methods=["POST"])
    def stripe_webhook():
        payload = request.data
        sig_header = request.headers.get("Stripe-Signature")
        endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except ValueError:
            current_app.logger.error("Invalid payload in Stripe webhook")
            return jsonify({"error": "Invalid payload"}), 400
        except stripe.error.SignatureVerificationError:
            current_app.logger.error("Invalid signature in Stripe webhook")
            return jsonify({"error": "Invalid signature"}), 400

        # Process the event based on its type
        try:
            process_stripe_event(event)
            return jsonify({"status": "success", "event_type": event["type"]}), 200
        except Exception as e:
            current_app.logger.error(f"Error processing Stripe webhook: {str(e)}")
            return jsonify({"error": f"Error processing webhook: {str(e)}"}), 500


def process_stripe_event(event):
    """Process different types of Stripe webhook events"""
    event_type = event["type"]
    event_data = event["data"]["object"]
    
    current_app.logger.info(f"Processing Stripe event: {event_type}")
    
    # Payment succeeded event
    if event_type == "payment_intent.succeeded":
        handle_payment_success(event_data)
    
    # Payment failed event
    elif event_type == "payment_intent.payment_failed":
        handle_payment_failure(event_data)
    
    # Checkout session completed
    elif event_type == "checkout.session.completed":
        handle_checkout_completed(event_data)
    
    # Customer subscription updated
    elif event_type == "customer.subscription.updated":
        handle_subscription_updated(event_data)
    
    # Customer subscription deleted
    elif event_type == "customer.subscription.deleted":
        handle_subscription_deleted(event_data)
    
    # Invoice payment succeeded
    elif event_type == "invoice.payment_succeeded":
        handle_invoice_payment_succeeded(event_data)
    
    # Account updated (for connected accounts)
    elif event_type == "account.updated":
        handle_account_updated(event_data)
    
    # Log unhandled event types
    else:
        current_app.logger.info(f"Unhandled Stripe event type: {event_type}")


def handle_payment_success(payment_intent):
    """Handle successful payment intent"""
    # Extract metadata from the payment intent
    metadata = payment_intent.get("metadata", {})
    invoice_id = metadata.get("invoice_id")
    user_id = metadata.get("user_id")
    
    if not invoice_id or not user_id:
        current_app.logger.warning("Missing invoice_id or user_id in payment metadata")
        return
        
    # Update invoice status
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        current_app.logger.error(f"Invoice not found: {invoice_id}")
        return
    
    # Update or create payment record
    payment = Payment.query.filter_by(stripe_payment_id=payment_intent["id"]).first()
    if not payment:
        payment = Payment(
            tenant_id=user_id,
            landlord_id=invoice.landlord_id,
            property_id=invoice.property_id,
            invoice_id=invoice_id,
            amount=payment_intent["amount"] / 100,  # Convert from cents
            payment_method="card",
            stripe_payment_id=payment_intent["id"],
            status="completed",
            reference_number=payment_intent["id"][-8:].upper(),
            created_at=datetime.utcnow()
        )
        db.session.add(payment)
    else:
        payment.status = "completed"
    
    # Update invoice status
    invoice.status = "paid"
    invoice.paid_at = datetime.utcnow()
    
    try:
        db.session.commit()
        
        # Send receipt email to tenant
        user = User.query.get(user_id)
        if user:
            send_payment_receipt(user, payment)
            
        current_app.logger.info(f"Payment processed successfully: {payment_intent['id']}")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error saving payment details: {str(e)}")
        raise


def handle_payment_failure(payment_intent):
    """Handle failed payment intent"""
    # Extract metadata
    metadata = payment_intent.get("metadata", {})
    invoice_id = metadata.get("invoice_id")
    user_id = metadata.get("user_id")
    
    if not invoice_id or not user_id:
        current_app.logger.warning("Missing invoice_id or user_id in payment metadata")
        return
    
    # Update or create payment record to reflect failure
    payment = Payment.query.filter_by(stripe_payment_id=payment_intent["id"]).first()
    if not payment:
        payment = Payment(
            tenant_id=user_id,
            invoice_id=invoice_id,
            amount=payment_intent["amount"] / 100,  # Convert from cents
            payment_method="card",
            stripe_payment_id=payment_intent["id"],
            status="failed",
            created_at=datetime.utcnow()
        )
        db.session.add(payment)
    else:
        payment.status = "failed"
    
    # Get error information
    error_message = "Payment failed"
    if "last_payment_error" in payment_intent:
        error_message = payment_intent["last_payment_error"].get("message", error_message)
    
    payment.notes = error_message
    
    try:
        db.session.commit()
        current_app.logger.info(f"Payment failure recorded: {payment_intent['id']}")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error saving payment failure details: {str(e)}")


def handle_checkout_completed(session):
    """Handle completed checkout session"""
    # Extract metadata
    metadata = session.get("metadata", {})
    
    # Check if payment was successful
    if session.get("payment_status") != "paid":
        current_app.logger.info("Checkout completed but payment not paid")
        return
    
    # Handle based on checkout type (determined by metadata)
    checkout_type = metadata.get("type")
    
    if checkout_type == "rent":
        # Process rent payment
        invoice_id = metadata.get("invoice_id")
        if invoice_id:
            handle_rent_payment(session, invoice_id)
    
    elif checkout_type == "deposit":
        # Process security deposit
        lease_id = metadata.get("lease_id")
        if lease_id:
            handle_deposit_payment(session, lease_id)
    
    elif checkout_type == "fee":
        # Process fee payment
        fee_id = metadata.get("fee_id")
        if fee_id:
            handle_fee_payment(session, fee_id)
    
    else:
        current_app.logger.warning(f"Unknown checkout type: {checkout_type}")


def handle_rent_payment(session, invoice_id):
    """Process a rent payment from checkout session"""
    from ..services.payment_service import PaymentService
    
    customer_email = session.get("customer_details", {}).get("email")
    amount = session.get("amount_total") / 100  # Convert from cents
    
    # Find the user by email
    user = User.query.filter_by(email=customer_email).first()
    if not user:
        current_app.logger.error(f"User not found for email: {customer_email}")
        return
    
    # Process the payment
    PaymentService.process_stripe_payment(
        user_id=user.id,
        invoice_id=invoice_id,
        amount=amount,
        stripe_payment_id=session.get("payment_intent"),
        payment_method="card"
    )


def handle_deposit_payment(session, lease_id):
    """Process a security deposit payment"""
    from ..services.lease_service import LeaseService
    
    customer_email = session.get("customer_details", {}).get("email")
    amount = session.get("amount_total") / 100  # Convert from cents
    
    # Find the user by email
    user = User.query.filter_by(email=customer_email).first()
    if not user:
        current_app.logger.error(f"User not found for email: {customer_email}")
        return
    
    # Update lease with deposit paid
    LeaseService.record_security_deposit(
        lease_id=lease_id,
        amount=amount,
        payment_method="card",
        stripe_payment_id=session.get("payment_intent")
    )


def handle_fee_payment(session, fee_id):
    """Process a fee payment"""
    # Implementation depends on your fee model structure
    pass


def handle_subscription_updated(subscription):
    """Handle subscription update event"""
    # Implementation depends on your subscription model structure
    pass


def handle_subscription_deleted(subscription):
    """Handle subscription deletion event"""
    # Implementation depends on your subscription model structure
    pass


def handle_invoice_payment_succeeded(invoice):
    """Handle Stripe invoice payment success"""
    # This is for Stripe's invoice object, not your app's invoice
    # Implementation depends on your subscription handling
    pass


def handle_account_updated(account):
    """Handle connected account updates"""
    # For marketplace models with connected accounts
    account_id = account.get("id")
    
    # Update the landlord's account status if applicable
    landlord = User.query.filter_by(stripe_account_id=account_id).first()
    if landlord:
        # Update relevant fields
        landlord.stripe_account_enabled = account.get("charges_enabled", False)
        landlord.stripe_payouts_enabled = account.get("payouts_enabled", False)
        
        try:
            db.session.commit()
            current_app.logger.info(f"Updated Stripe account status for user {landlord.id}")
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error updating Stripe account status: {str(e)}")
