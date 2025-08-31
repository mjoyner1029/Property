"""
Stripe customer controller providing endpoints for customer management
"""
import stripe
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.user import User
from ..extensions import db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@jwt_required()
def create_customer():
    """
    Create a new Stripe customer for the authenticated user.
    If STRIPE_SECRET_KEY is unset, returns a simulated customer ID.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    # Get user information
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    # Use provided email/name or fall back to user data
    email = data.get('email', user.email)
    name = data.get('name', user.name)
    
    try:
        # If Stripe API key is not set, return a simulated customer ID
        stripe_key = current_app.config.get('STRIPE_SECRET_KEY')
        if not stripe_key:
            logger.warning("Creating simulated Stripe customer (STRIPE_SECRET_KEY not set)")
            simulated_id = f"cus_simulated{user_id}{int(datetime.utcnow().timestamp())}"
            return jsonify({"customer_id": simulated_id, "simulated": True}), 201
            
        # Create a customer in Stripe
        customer = stripe.Customer.create(
            email=email,
            name=name,
            metadata={"user_id": user_id}
        )
        
        # Update user record with Stripe customer ID
        user.stripe_customer_id = customer.id
        db.session.commit()
        
        logger.info(f"Created Stripe customer for user {user_id}")
        return jsonify({"customer_id": customer.id}), 201
        
    except stripe.error.StripeError as e:
        db.session.rollback()
        logger.error(f"Stripe error creating customer: {str(e)}")
        return jsonify({"error": f"Stripe error: {str(e)}"}), 500
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating Stripe customer: {str(e)}")
        return jsonify({"error": "Failed to create Stripe customer"}), 500
