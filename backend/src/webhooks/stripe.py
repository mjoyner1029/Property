"""
Stripe webhook handlers for receiving and processing Stripe events
"""
import logging
import json
import stripe
from flask import Blueprint, request, jsonify, current_app
from ..models.payment import Payment
from ..models.invoice import Invoice
from ..models.stripe_event import StripeEvent
from ..extensions import db
from datetime import datetime

logger = logging.getLogger(__name__)

bp = Blueprint("stripe_webhook", __name__)

def register_stripe_webhooks(app=None):
    """Register the Stripe webhook blueprint with the app"""
    return bp

@bp.route("/", methods=["POST"])
def webhook():
    """Handle incoming Stripe webhook events"""
    payload = request.data.decode("utf-8")
    sig_header = request.headers.get("Stripe-Signature")
    
    # Get the webhook secret from config
    webhook_secret = current_app.config.get("STRIPE_WEBHOOK_SECRET")
    
    try:
        if not webhook_secret:
            # Dev mode: construct event from the payload without signature verification
            logger.warning("STRIPE_WEBHOOK_SECRET not set. Running in dev mode without signature verification.")
            event = stripe.Event.construct_from(
                json.loads(payload), stripe.api_key
            )
        else:
            # Verify the event came from Stripe
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        
        # Store the event in the database to prevent duplicates and allow audit
        existing_event = StripeEvent.query.filter_by(event_id=event.id).first()
        if existing_event:
            logger.info(f"Duplicate Stripe event received: {event.id}")
            return jsonify({"message": "Duplicate event"}), 200
        
        # Store new event
        # Convert event data to storable format
        event_data = None
        if current_app.config.get('DEBUG'):
            try:
                if hasattr(event, 'to_dict'):
                    event_data = json.dumps(event.to_dict())
                else:
                    # For tests with mocked events that don't have to_dict
                    event_data = json.dumps({
                        'id': event.id,
                        'type': event.type,
                        'created': event.created,
                        'data': {'object': {'id': event.data.object.get('id')}}
                    })
            except (TypeError, ValueError) as e:
                logger.warning(f"Could not serialize event for storage: {e}")
        
        # Handle api_version safely (especially for mocks)
        api_version = None
        if hasattr(event, 'api_version'):
            if isinstance(event.api_version, str):
                api_version = event.api_version
        
        stripe_event = StripeEvent(
            event_id=event.id,
            event_type=event.type,
            api_version=api_version,
            created_at=datetime.fromtimestamp(event.created),
            processed_at=datetime.utcnow(),
            payload=event_data  # Only store payload in DEBUG mode
        )
        db.session.add(stripe_event)
        db.session.commit()
        
        # Process different event types
        if event.type == "checkout.session.completed":
            return handle_checkout_completed(event)
        elif event.type == "payment_intent.succeeded":
            return handle_payment_succeeded(event)
        elif event.type == "invoice.payment_succeeded":
            return handle_invoice_payment_succeeded(event)
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
        payment.completed_at = datetime.utcnow()
        payment.payment_intent_id = session.get("payment_intent")
        db.session.commit()
        logger.info(f"Payment marked as paid: {payment.id}")
        
        # If this payment is linked to an invoice, update the invoice status too
        if payment.invoice_id:
            invoice = db.session.get(Invoice, payment.invoice_id)
            if invoice:
                invoice.status = "paid"
                invoice.paid_at = datetime.utcnow()
                db.session.commit()
                logger.info(f"Invoice marked as paid: {invoice.id}")
    else:
        logger.error(f"Payment record not found for session: {session_id}")
    
    return jsonify({"message": "Checkout session processed"}), 200

def handle_payment_succeeded(event):
    """Handle successful payment intent"""
    payment_intent = event.data.object
    payment_intent_id = payment_intent.get("id")
    
    # Find payment record by payment intent ID
    payment = Payment.query.filter_by(payment_intent_id=payment_intent_id).first()
    if payment:
        payment.status = "paid"
        payment.completed_at = datetime.utcnow()
        db.session.commit()
        logger.info(f"Payment intent succeeded for payment: {payment.id}")
        
        # If this payment is linked to an invoice, update the invoice status too
        if payment.invoice_id:
            invoice = db.session.get(Invoice, payment.invoice_id)
            if invoice:
                invoice.status = "paid"
                invoice.paid_at = datetime.utcnow()
                db.session.commit()
                logger.info(f"Invoice marked as paid: {invoice.id}")
    else:
        logger.warning(f"No payment record found for payment intent: {payment_intent_id}")
    
    return jsonify({"message": "Payment intent succeeded processed"}), 200

def handle_invoice_payment_succeeded(event):
    """Handle successful invoice payment"""
    invoice_object = event.data.object
    payment_intent_id = invoice_object.get("payment_intent")
    
    if payment_intent_id:
        # Find payment record by payment intent ID
        payment = Payment.query.filter_by(payment_intent_id=payment_intent_id).first()
        if payment and payment.invoice_id:
            invoice = db.session.get(Invoice, payment.invoice_id)
            if invoice:
                invoice.status = "paid"
                invoice.paid_at = datetime.utcnow()
                db.session.commit()
                logger.info(f"Invoice marked as paid from invoice event: {invoice.id}")
                return jsonify({"message": "Invoice payment succeeded processed"}), 200
    
    logger.warning(f"Couldn't process invoice.payment_succeeded: {event.id}")
    return jsonify({"message": "Invoice payment event processed but no action taken"}), 200

def handle_payment_failed(event):
    """Handle failed payment intent"""
    payment_intent = event.data.object
    payment_intent_id = payment_intent.get("id")
    
    # Find payment record by payment intent ID
    payment = Payment.query.filter_by(payment_intent_id=payment_intent_id).first()
    if payment:
        payment.status = "failed"
        db.session.commit()
        logger.info(f"Payment intent failed for payment: {payment.id}")
    else:
        logger.warning(f"No payment record found for payment intent: {payment_intent_id}")
    
    return jsonify({"message": "Payment intent failed processed"}), 200
