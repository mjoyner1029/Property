from flask import Blueprint, request
from ..webhooks.stripe import bp as stripe_webhook_bp

# Renamed blueprint name to match its variable name
webhook_bp = Blueprint("webhook", __name__, url_prefix="/webhooks")

# Register the stripe webhook at /webhooks/stripe
webhook_bp.register_blueprint(stripe_webhook_bp, url_prefix="/stripe")

# Register Twilio webhooks directly here
try:
    from ..webhooks.twilio import bp as twilio_webhook_bp
    # Register the twilio webhook at /webhooks/twilio
    webhook_bp.register_blueprint(twilio_webhook_bp, url_prefix="/twilio")
except ImportError as e:
    # Log the error, but continue without crashing
    import logging
    logging.warning(f"Failed to register Twilio webhook blueprint: {e}")