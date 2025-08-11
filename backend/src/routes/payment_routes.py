# backend/src/routes/payments.py
from flask import Blueprint
from ..controllers.payment_controller import (
    create_payment, get_payments, get_payment,
    get_tenant_payments, get_landlord_payments
)

payment_bp = Blueprint('payments', __name__)

payment_bp.route('/', methods=['POST'])(create_payment)
payment_bp.route('/', methods=['GET'])(get_payments)
payment_bp.route('/<int:payment_id>', methods=['GET'])(get_payment)
payment_bp.route('/tenant', methods=['GET'])(get_tenant_payments)
payment_bp.route('/landlord', methods=['GET'])(get_landlord_payments)
