from flask import Blueprint, request
from ..webhooks.stripe import bp as stripe_webhook_bp
from ..webhooks.twilio import register_twilio_webhooks

webhook_bp = Blueprint("webhook_bp", __name__, url_prefix="/webhooks")

# Register the stripe webhook at /webhooks/stripe
webhook_bp.register_blueprint(stripe_webhook_bp, url_prefix="/stripe")

# Register Twilio webhooks
@webhook_bp.route('/twilio', methods=['POST'])
def twilio_handler():
    """Handle Twilio webhooks"""
    return {'message': 'Twilio webhook received'}, 200