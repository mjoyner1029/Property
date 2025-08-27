from flask import Blueprint

webhook_bp = Blueprint("webhook_bp", __name__, url_prefix="/api/webhooks")

def register_stripe_webhooks(bp):
    """Register stripe webhook routes"""
    pass

def register_twilio_webhooks(bp):
    """Register twilio webhook routes"""
    pass

# Register routes
register_stripe_webhooks(webhook_bp)
register_twilio_webhooks(webhook_bp)