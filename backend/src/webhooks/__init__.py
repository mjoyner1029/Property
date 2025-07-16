"""
Webhook handlers for external service integrations.

This package contains handlers for webhooks from various external services,
such as payment processors, notification services, and more.
"""

from flask import Blueprint

# Create Blueprint for webhook routes
webhook_bp = Blueprint("webhooks", __name__, url_prefix="/api/webhooks")

# Import and register webhook handlers
from .stripe import register_stripe_webhooks
from .twilio import register_twilio_webhooks
from .system import register_system_webhooks
from .plaid import register_plaid_webhooks

def init_webhooks(app):
    """Initialize all webhook handlers"""
    # Register the main webhook blueprint
    app.register_blueprint(webhook_bp)
    
    # Register specific webhook handlers with their routes
    register_stripe_webhooks(webhook_bp)
    register_twilio_webhooks(webhook_bp)
    register_system_webhooks(webhook_bp)
    register_plaid_webhooks(webhook_bp)
    
    app.logger.info("Webhook handlers initialized")