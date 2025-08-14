# backend/src/routes/payment_routes.py
from flask import Blueprint
from ..controllers.payment_controller import (
    create_payment, get_payments, get_payment,
    get_tenant_payments, get_landlord_payments, 
    create_checkout_session, get_payment_history
)

payment_bp = Blueprint('payments', __name__)

# Standard payment CRUD routes
payment_bp.route('/', methods=['POST'])(create_payment)
payment_bp.route('/', methods=['GET'])(get_payments)
payment_bp.route('/<int:payment_id>', methods=['GET'])(get_payment)
payment_bp.route('/tenant', methods=['GET'])(get_tenant_payments)
payment_bp.route('/landlord', methods=['GET'])(get_landlord_payments)

# Stripe checkout and history routes
payment_bp.route('/checkout', methods=['POST'])(create_checkout_session)
payment_bp.route('/history', methods=['GET'])(get_payment_history)
