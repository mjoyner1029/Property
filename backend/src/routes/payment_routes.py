# backend/src/routes/payment_routes.py
from flask import Blueprint
from ..extensions import db
from ..controllers.payment_controller import (
    create_payment, get_payments, get_payment,
    get_tenant_payments, get_landlord_payments, 
    create_checkout_session, get_payment_history
)

payment_bp = Blueprint('payments', __name__)

# Standard payment CRUD routes
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
logger = logging.getLogger(__name__)

@payment_bp.route('/', methods=['POST'])
@jwt_required()
def create_payment_route():
    try:
        data = request.get_json()
        logger.info(f"create_payment_route received data: {data}")
        
        if data is None:
            return jsonify({"error": "No JSON data provided"}), 400
        
        if 'tenant_id' not in data:
            data['tenant_id'] = get_jwt_identity()
            logger.info(f"Added tenant_id from JWT: {data['tenant_id']}")
            
        # Get the landlord ID from the invoice
        from ..models.invoice import Invoice
        if 'invoice_id' in data:
            invoice = db.session.get(Invoice, data['invoice_id'])
            if invoice:
                data['landlord_id'] = invoice.landlord_id
                logger.info(f"Added landlord_id from invoice: {data['landlord_id']}")
            else:
                logger.warning(f"Invoice {data['invoice_id']} not found")
                return jsonify({"error": "Invoice not found"}), 404
            
        result, status = create_payment(data)
        logger.info(f"create_payment returned: {result}, {status}")
        
        # Format the response to match what the test expects
        if status == 201:
            logger.info(f"Response from create_payment: {result}")
            
            # Just pass through the response
            return jsonify(result), status
        
        return jsonify(result), status
    except Exception as e:
        logger.error(f"Error in create_payment_route: {str(e)}")
        return jsonify({"error": str(e)}), 500
payment_bp.route('/', methods=['GET'])(get_payments)
payment_bp.route('/<int:payment_id>', methods=['GET'])(get_payment)

@payment_bp.route('/<int:payment_id>', methods=['PUT'])
@jwt_required()
def update_payment_route(payment_id):
    try:
        data = request.get_json()
        if data is None:
            return jsonify({"error": "No JSON data provided"}), 400
            
        from ..controllers.payment_controller import update_payment
        result, status = update_payment(payment_id, data)
        return jsonify(result), status
    except Exception as e:
        logger.error(f"Error in update_payment_route: {str(e)}")
        return jsonify({"error": str(e)}), 500

@payment_bp.route('/tenant', methods=['GET'])
@jwt_required()
def get_tenant_payments_route():
    try:
        result, status = get_tenant_payments()
        return jsonify(result), status
    except Exception as e:
        logger.error(f"Error in get_tenant_payments_route: {str(e)}")
        return jsonify({"error": str(e)}), 500

@payment_bp.route('/landlord', methods=['GET'])
@jwt_required()
def get_landlord_payments_route():
    try:
        result, status = get_landlord_payments()
        return jsonify(result), status
    except Exception as e:
        logger.error(f"Error in get_landlord_payments_route: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Stripe checkout and history routes
payment_bp.route('/checkout', methods=['POST'])(create_checkout_session)
payment_bp.route('/history', methods=['GET'])(get_payment_history)
