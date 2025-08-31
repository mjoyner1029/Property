"""
Routes for Stripe customer management
"""
from flask import Blueprint

from ..controllers.stripe_customer_controller import create_customer

# Create a blueprint for Stripe customer routes
stripe_customer_bp = Blueprint('stripe_customer', __name__, url_prefix='/api/stripe')

# Register routes
stripe_customer_bp.route('/create-customer', methods=['POST'])(create_customer)
stripe_customer_bp.route('/customers', methods=['POST'])(create_customer)
