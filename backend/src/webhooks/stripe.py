"""
Stripe webhook handlers for receiving and processing Stripe events
"""
import logging
import stripe
from flask import Blueprint, request, jsonify, current_app
from ..models.payment import Payment
from ..models.stripe_event import StripeEvent
from ..extensions import db
from datetime import datetime

logger = logging.getLogger(__name__)

bp = Blueprint("stripe_webhook", __name__)

@bp.route("/", methods=["POST"])
def webhook():
    """Handle incoming Stripe webhook events"""
    payload = request.data.decode("utf-8")
    sig_header = request.headers.get("Stripe-Signature")
    
    # Get the webhook secret from config
    webhook_secret = current_app.config.get("STRIPE_WEBHOOK_SECRET")
    
    if not webhook_secret:
        logger.error("Stripe webhook secret not configured")
        return jsonify({"error": "Webhook secret not configured"}), 500
    
    try:
        # Verify the event came from Stripe
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
        
        # Store the event in the database to prevent duplicates and allow audit
        existing_event = StripeEvent.query.filter_by(stripe_id=event.id).first()
        if existing_event:
            logger.info(f"Duplicate Stripe event received: {event.id}")
            return jsonify({"message": "Duplicate event"}), 200
        
        # Store new event
        stripe_event = StripeEvent(
            stripe_id=event.id,
            type=event.type,
            data=event.data,
            created=datetime.fromtimestamp(event.created)
        )
        db.session.add(stripe_event)
        db.session.commit()
        
        # Process different event types
        if event.type == "checkout.session.completed":
            return handle_checkout_completed(event)
        elif event.type == "payment_intent.succeeded":
            return handle_payment_succeeded(event)
        elif event.type == "payment_intent.payment_failed":
            return handle_payment_failed(event)
        else:
            logger.info(f"Unhandled Stripe event type: {event.type}")
            return jsonify({"message": f"Unhandled event type: {event.type}"}), 200
            
    except stripe.error.SignatureVerificationError:
        logger.error("Invalid Stripe signature")
        return jsonify({"error": "Invalid signature"}), 400
    except Exception as e:
        logger.exception(f"Error handling Stripe webhook: {str(e)}")
        return jsonify({"error": "Internal error processing webhook"}), 500

def handle_checkout_completed(event):
    """Handle successful checkout session completion"""
    session = event.data.object
    session_id = session.get("id")
    
    # Find payment record by session ID
    payment = Payment.query.filter_by(session_id=session_id).first()
    if payment:
        payment.status = "paid"
        payment.paid_date = datetime.utcnow()
        payment.payment_id = session.get("payment_intent")
        db.session.commit()
        logger.info(f"Payment marked as paid: {payment.id}")
    else:
        logger.error(f"Payment record not found for session: {session_id}")
    
    return jsonify({"message": "Checkout session processed"}), 200

def handle_payment_succeeded(event):
    """Handle successful payment intent"""
    payment_intent = event.data.object
    payment_intent_id = payment_intent.get("id")
    
    # Find payment record by payment intent ID
    payment = Payment.query.filter_by(payment_id=payment_intent_id).first()
    if payment:
        payment.status = "paid"
        payment.paid_date = datetime.utcnow()
        db.session.commit()
        logger.info(f"Payment intent succeeded for payment: {payment.id}")
    else:
        logger.warning(f"No payment record found for payment intent: {payment_intent_id}")
    
    return jsonify({"message": "Payment intent succeeded processed"}), 200

def handle_payment_failed(event):
    """Handle failed payment intent"""
    payment_intent = event.data.object
    payment_intent_id = payment_intent.get("id")
    
    # Find payment record by payment intent ID
    payment = Payment.query.filter_by(payment_id=payment_intent_id).first()
    if payment:
        payment.status = "failed"
        db.session.commit()
        logger.info(f"Payment intent failed for payment: {payment.id}")
    else:
        logger.warning(f"No payment record found for payment intent: {payment_intent_id}")
    
    return jsonify({"message": "Payment intent failed processed"}), 200
