import stripe
import os
import json
from flask import current_app
from ..models.user import User
from ..extensions import db

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

def create_connect_account(user_id, email):
    account = stripe.Account.create(
        type="express",  # Use "express" for SaaS landlord onboarding
        country="US",
        email=email,
        capabilities={"transfers": {"requested": True}},
        business_type="individual",
        metadata={"user_id": user_id}
    )
    return account

def create_account_link(account_id):
    return stripe.AccountLink.create(
        account=account_id,
        refresh_url=os.getenv("STRIPE_REFRESH_URL", "http://localhost:3000/retry"),
        return_url=os.getenv("STRIPE_RETURN_URL", "http://localhost:3000/dashboard"),
        type="account_onboarding"
    )


class StripeEventHandler:
    """
    Handler for Stripe webhook events.
    """
    
    def handle_event(self, event):
        """
        Process a Stripe webhook event.
        
        Args:
            event (dict): The Stripe event object
            
        Returns:
            dict: Response indicating how the event was handled
        """
        event_type = event.get('type')
        event_id = event.get('id')
        
        # Dictionary mapping event types to handler methods
        handlers = {
            'checkout.session.completed': self._handle_checkout_completed,
            'invoice.payment_succeeded': self._handle_invoice_payment_succeeded,
            'invoice.payment_failed': self._handle_invoice_payment_failed,
            'customer.subscription.created': self._handle_subscription_created,
            'customer.subscription.updated': self._handle_subscription_updated,
            'customer.subscription.deleted': self._handle_subscription_deleted,
            'charge.refunded': self._handle_charge_refunded
        }
        
        # Get the appropriate handler for this event type or use default
        handler = handlers.get(event_type, self._handle_default)
        
        # Process the event
        result = handler(event)
        
        # Log the event
        current_app.logger.info(f"Processed Stripe event: {event_id}, type: {event_type}")
        
        # Return a response
        return {
            "received": True,
            "event_id": event_id,
            "event_type": event_type,
            "result": result
        }
        
    def _handle_checkout_completed(self, event):
        """Handle successful checkout completion."""
        session = event.get('data', {}).get('object', {})
        customer_id = session.get('customer')
        subscription_id = session.get('subscription')
        metadata = session.get('metadata', {})
        
        # Get user from metadata or customer ID
        user_id = metadata.get('user_id')
        user = User.query.get(user_id) if user_id else None
        
        if not user:
            current_app.logger.error(f"User not found for checkout: {session.get('id')}")
            return {"status": "error", "message": "User not found"}
        
        # Update user with Stripe customer ID if not already set
        if not user.stripe_customer_id:
            user.stripe_customer_id = customer_id
            db.session.commit()
                
        return {"status": "success", "message": "Checkout processed successfully"}
        
    def _handle_invoice_payment_succeeded(self, event):
        """Handle successful invoice payment."""
        invoice = event.get('data', {}).get('object', {})
        customer_id = invoice.get('customer')
        
        # Log payment success
        current_app.logger.info(f"Payment succeeded for customer: {customer_id}")
        
        return {"status": "success", "message": "Payment recorded successfully"}
        
    def _handle_invoice_payment_failed(self, event):
        """Handle failed invoice payment."""
        invoice = event.get('data', {}).get('object', {})
        customer_id = invoice.get('customer')
        
        # Log payment failure
        current_app.logger.error(f"Payment failed for customer: {customer_id}")
        
        # TODO: Send notification to user about failed payment
                
        return {"status": "warning", "message": "Payment failed"}
        
    def _handle_subscription_created(self, event):
        """Handle subscription creation."""
        subscription_data = event.get('data', {}).get('object', {})
        customer_id = subscription_data.get('customer')
        
        # Log subscription creation
        current_app.logger.info(f"Subscription created for customer: {customer_id}")
        
        return {"status": "success", "message": "Subscription created"}
        
    def _handle_subscription_updated(self, event):
        """Handle subscription updates."""
        subscription_data = event.get('data', {}).get('object', {})
        customer_id = subscription_data.get('customer')
        
        # Log subscription update
        current_app.logger.info(f"Subscription updated for customer: {customer_id}")
            
        return {"status": "success", "message": "Subscription updated"}
        
    def _handle_subscription_deleted(self, event):
        """Handle subscription cancellation."""
        subscription_data = event.get('data', {}).get('object', {})
        customer_id = subscription_data.get('customer')
        
        # Log subscription cancellation
        current_app.logger.info(f"Subscription canceled for customer: {customer_id}")
            
        return {"status": "success", "message": "Subscription canceled"}
        
    def _handle_charge_refunded(self, event):
        """Handle charge refunds."""
        charge = event.get('data', {}).get('object', {})
        customer_id = charge.get('customer')
        
        # Log refund
        current_app.logger.info(f"Payment refunded for customer: {customer_id}")
                
        return {"status": "success", "message": "Refund processed"}
        
    def _handle_default(self, event):
        """Default handler for unhandled event types."""
        event_type = event.get('type')
        current_app.logger.info(f"Unhandled event type: {event_type}")
        return {"status": "ignored", "message": "Event type not handled"}
