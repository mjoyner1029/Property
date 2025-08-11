from flask import Blueprint, request, jsonify, current_app
import stripe
import json
from functools import wraps
from flask_jwt_extended import jwt_required
import os

# Initialize Stripe with API key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Create webhook blueprint
bp = Blueprint('webhooks', __name__)

def verify_stripe_signature(f):
    """Decorator to verify Stripe webhook signatures."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        payload = request.get_data(as_text=True)
        sig_header = request.headers.get('Stripe-Signature')
        webhook_secret = current_app.config.get('STRIPE_WEBHOOK_SECRET')
        
        if not webhook_secret:
            current_app.logger.error("Stripe webhook secret not configured")
            return jsonify({"error": "Webhook secret not configured"}), 500
            
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError as e:
            current_app.logger.error(f"Invalid Stripe payload: {e}")
            return jsonify({"error": "Invalid payload"}), 400
        except stripe.error.SignatureVerificationError as e:
            current_app.logger.error(f"Invalid Stripe signature: {e}")
            return jsonify({"error": "Invalid signature"}), 400
            
        return f(event, *args, **kwargs)
    return decorated_function

# Process webhook events from Stripe
@bp.route('/stripe', methods=['POST'])
@verify_stripe_signature
def stripe_webhook(event):
    """Handle Stripe webhook events."""
    from ..services.stripe_service import StripeEventHandler
    
    try:
        # Check if we've already processed this event (idempotency)
        event_id = event.get('id')
        current_app.logger.info(f"Processing Stripe webhook: {event_id}, type: {event.get('type')}")
        
        # Process the event based on its type
        event_handler = StripeEventHandler()
        response = event_handler.handle_event(event)
        
        return jsonify(response), 200
        
    except Exception as e:
        current_app.logger.error(f"Error processing webhook: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
