# backend/src/controllers/webhook_controller.py

from flask import request, jsonify, current_app
import stripe
import os
import json
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from ..models.stripe_event import StripeEvent
from ..models.payment import Payment
from ..extensions import db
from ..services.stripe_service import StripeService

# Initialize Stripe service
stripe_service = StripeService()

def handle_stripe_webhook():
    """
    Handle Stripe webhook events with proper signature verification and idempotency
    
    Returns:
        Response indicating how the event was handled
    """
    sig_header = request.headers.get("Stripe-Signature")
    payload = request.data
    
    if not sig_header:
        current_app.logger.warning("Stripe webhook received without signature header")
        return jsonify({"error": "No Stripe signature header"}), 403
    
    # Verify signature
    try:
        event = stripe_service.verify_webhook_signature(payload, sig_header)
    except ValueError as e:
        current_app.logger.warning(f"Invalid Stripe webhook signature: {str(e)}")
        return jsonify({"error": "Invalid signature"}), 403
    
    # Check idempotency (has this event been processed before?)
    event_id = event.get('id')
    if not event_id:
        current_app.logger.error("Stripe webhook event missing ID")
        return jsonify({"error": "Event missing ID"}), 400
    
    existing_event = StripeEvent.query.filter_by(event_id=event_id).first()
    if existing_event:
        current_app.logger.info(f"Stripe event {event_id} already processed, skipping")
        return jsonify({"status": "success", "message": "Event already processed"}), 200
    
    # Process the event based on type
    event_type = event.get('type')
    event_data = event.get('data', {}).get('object', {})
    
    try:
        # Record this event for idempotency
        stripe_event = StripeEvent(
            event_id=event_id,
            event_type=event_type,
            api_version=event.get('api_version'),
            payload=json.dumps(event) if current_app.config.get('DEBUG') else None,
        )
        db.session.add(stripe_event)
        db.session.commit()
        
        # Handle specific event types
        if event_type == 'checkout.session.completed':
            return handle_checkout_completed(event_data)
        elif event_type == 'invoice.payment_succeeded':
            return handle_invoice_payment(event_data)
        elif event_type == 'customer.subscription.created':
            return handle_subscription_change(event_data, 'created')
        elif event_type == 'customer.subscription.updated':
            return handle_subscription_change(event_data, 'updated')
        elif event_type == 'customer.subscription.deleted':
            return handle_subscription_change(event_data, 'deleted')
        else:
            # Generic handling for unsupported event types
            current_app.logger.info(f"Unhandled Stripe event type: {event_type}")
            return jsonify({"status": "success", "message": f"Unhandled event type: {event_type}"}), 200
    
    except IntegrityError:
        db.session.rollback()
        # This can happen if two webhook calls arrive nearly simultaneously
        # Since we already have a record, this is not an error
        current_app.logger.info(f"Stripe event {event_id} already recorded (race condition)")
        return jsonify({"status": "success", "message": "Event already processed"}), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error processing Stripe webhook: {str(e)}")
        return jsonify({"error": f"Failed to process webhook: {str(e)}"}), 500

def handle_checkout_completed(session):
    """
    Handle checkout.session.completed event
    
    Args:
        session: Stripe Checkout Session object
        
    Returns:
        Response indicating how the event was handled
    """
    try:
        # Extract metadata from session
        session_id = session.get('id')
        metadata = session.get('metadata', {})
        
        # Find the payment record by session ID
        payment = Payment.query.filter_by(session_id=session_id).first()
        if not payment:
            current_app.logger.warning(f"No payment record found for session {session_id}")
            return jsonify({"warning": "No matching payment record found"}), 200
        
        # Update payment status and save payment details
        payment.status = 'paid'
        payment.paid_date = datetime.utcnow()
        payment.payment_intent_id = session.get('payment_intent')
        payment.last_error = None
        
        db.session.commit()
        current_app.logger.info(f"Payment {payment.id} marked as paid from session {session_id}")
        
        # TODO: Trigger any additional processing (emails, notifications, etc.)
        
        return jsonify({
            "status": "success", 
            "message": "Payment completed", 
            "payment_id": payment.id
        }), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error handling checkout completion: {str(e)}")
        return jsonify({"error": f"Failed to process checkout completion: {str(e)}"}), 500

def handle_invoice_payment(invoice):
    """
    Handle invoice.payment_succeeded event
    
    Args:
        invoice: Stripe Invoice object
        
    Returns:
        Response indicating how the event was handled
    """
    try:
        # Extract metadata
        customer_id = invoice.get('customer')
        subscription_id = invoice.get('subscription')
        
        # TODO: Handle subscription payment logic
        
        return jsonify({
            "status": "success", 
            "message": "Invoice payment recorded"
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"Error handling invoice payment: {str(e)}")
        return jsonify({"error": f"Failed to process invoice payment: {str(e)}"}), 500

def handle_subscription_change(subscription, change_type):
    """
    Handle customer.subscription.* events
    
    Args:
        subscription: Stripe Subscription object
        change_type: Type of change (created, updated, deleted)
        
    Returns:
        Response indicating how the event was handled
    """
    try:
        # Extract metadata
        customer_id = subscription.get('customer')
        subscription_id = subscription.get('id')
        
        # TODO: Update local subscription status based on change_type
        
        return jsonify({
            "status": "success", 
            "message": f"Subscription {change_type}", 
            "subscription_id": subscription_id
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"Error handling subscription {change_type}: {str(e)}")
        return jsonify({"error": f"Failed to process subscription {change_type}: {str(e)}"}), 500
