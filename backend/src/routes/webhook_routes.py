from flask import Blueprint
from ..controllers.webhook_controller import handle_stripe_webhook

webhook_bp = Blueprint('webhooks', __name__, url_prefix='/api/webhooks')

# Stripe webhook endpoint
webhook_bp.route('/stripe', methods=['POST'])(handle_stripe_webhook)