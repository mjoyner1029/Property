from flask import Blueprint, current_app
from ..controllers.webhook_controller import handle_stripe_webhook

bp = Blueprint('webhooks', __name__)
webhook_routes_bp = bp  # Alias for import compatibility

# Stripe webhook endpoint
bp.route('/stripe', methods=['POST'])(handle_stripe_webhook)