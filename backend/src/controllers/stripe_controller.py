import stripe
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from ..utils.role_required import role_required

from ..models.user import User
from ..models.payment import Payment
from ..models.stripe_account import StripeAccount
from ..extensions import db
import logging
import os

logger = logging.getLogger(__name__)

# Initialize Stripe with API key from environment variables
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
if not stripe.api_key:
    logger.warning("STRIPE_SECRET_KEY environment variable not set. Stripe integration will not work.")

stripe_bp = Blueprint('stripe', __name__)

@stripe_bp.route('/api/stripe/create-connect-link', methods=['POST'])
@jwt_required()
def create_connect_account():
    """Create a Stripe Connect account and return onboarding link for the user."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate input
    account_type = data.get("account_type", "express")  # or "standard"
    if account_type not in ["express", "standard"]:
        return jsonify({"error": "Invalid account type. Must be 'express' or 'standard'"}), 400
        
    email = data.get("email")
    if not email:
        return jsonify({"error": "Email is required"}), 400

    # Check if user already has a Stripe account
    existing_account = StripeAccount.query.filter_by(user_id=user_id).first()
    if existing_account:
        return jsonify({"error": "User already has a Stripe Connect account"}), 400

    try:
        # Create Stripe account
        account = stripe.Account.create(
            type=account_type,
            country="US",
            email=email,
            capabilities={"transfers": {"requested": True}},
        )
        
        # Save to database
        stripe_account = StripeAccount(
            user_id=user_id, 
            stripe_id=account.id, 
            account_type=account_type
        )
        db.session.add(stripe_account)
        db.session.commit()
        logger.info(f"Created Stripe Connect account for user {user_id}")

        # Create account onboarding link
        link = stripe.AccountLink.create(
            account=account.id,
            refresh_url=os.getenv("STRIPE_REFRESH_URL", "http://localhost:3000/stripe/refresh"),
            return_url=os.getenv("STRIPE_RETURN_URL", "http://localhost:3000/dashboard"),
            type="account_onboarding",
        )

        return jsonify({"url": link.url, "account_id": account.id})
    except stripe.error.StripeError as e:
        db.session.rollback()
        logger.error(f"Stripe error creating connect account: {str(e)}")
        return jsonify({"error": f"Stripe error: {str(e)}"}), 500
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating Stripe connect account: {str(e)}")
        return jsonify({"error": "Failed to create Stripe account"}), 500

@stripe_bp.route('/api/stripe/account-status', methods=['GET'])
@jwt_required()
def check_account_status():
    """Check the status of a user's Stripe Connect account."""
    user_id = get_jwt_identity()
    
    try:
        # Get user's Stripe account from database
        stripe_account = StripeAccount.query.filter_by(user_id=user_id).first()
        if not stripe_account:
            return jsonify({"error": "No Stripe account found"}), 404
            
        # Get account details from Stripe
        account = stripe.Account.retrieve(stripe_account.stripe_id)
        
        return jsonify({
            "id": account.id,
            "charges_enabled": account.charges_enabled,
            "payouts_enabled": account.payouts_enabled,
            "details_submitted": account.details_submitted
        })
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error checking account status: {str(e)}")
        return jsonify({"error": f"Stripe error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Error checking Stripe account status: {str(e)}")
        return jsonify({"error": "Failed to check account status"}), 500

@stripe_bp.route('/api/stripe/create-checkout-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    """Create a Stripe checkout session for payment"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        # Validate required fields
        if not data.get('amount'):
            return jsonify({"error": "Amount is required"}), 400
            
        # Get the amount in cents (Stripe uses smallest currency unit)
        amount = int(float(data.get('amount')) * 100)
        if amount <= 0:
            return jsonify({"error": "Amount must be greater than zero"}), 400
            
        # Get description and metadata
        description = data.get('description', 'Payment')
        invoice_id = data.get('invoice_id')
        
        metadata = {
            'user_id': current_user_id
        }
        
        if invoice_id:
            metadata['invoice_id'] = invoice_id
            
        # Initialize Stripe
        stripe.api_key = current_app.config['STRIPE_SECRET_KEY']
        
        # Create the checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': description,
                    },
                    'unit_amount': amount,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/payment/cancel",
            metadata=metadata,
        )
        
        return jsonify({
            'session_id': checkout_session.id,
            'checkout_url': checkout_session.url
        }), 200
        
    except stripe.error.StripeError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
