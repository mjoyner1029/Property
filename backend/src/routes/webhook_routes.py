from flask import Blueprint
from ..controllers.stripe_controller import webhook

webhook_bp = Blueprint('webhooks', __name__)

webhook_bp.route('/stripe', methods=['POST'])(webhook)