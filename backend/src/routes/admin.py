# backend/src/routes/admin.py

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import User
from src.models.property import Property
from src.models.payment import Payment
from src.models.maintenance_request import MaintenanceRequest
from src.extensions import db

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def admin_required(fn):
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()["id"]
        user = User.query.get(user_id)
        if not user or user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    wrapper.__name__ = fn.__name__
    return wrapper

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    users = User.query.all()
    return jsonify([{
        "id": u.id,
        "full_name": u.full_name,
        "email": u.email,
        "role": u.role,
        "is_verified": u.is_verified
    } for u in users])

@admin_bp.route('/deactivate_user/<int:user_id>', methods=['POST'])
@admin_required
def deactivate_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    user.is_active = False
    db.session.commit()
    return jsonify({"message": "User deactivated"})

@admin_bp.route('/properties', methods=['GET'])
@admin_required
def get_all_properties():
    props = Property.query.all()
    return jsonify([{
        "id": p.id,
        "name": p.name,
        "address": p.address,
        "landlord_id": p.landlord_id
    } for p in props])

@admin_bp.route('/payments', methods=['GET'])
@admin_required
def get_all_payments():
    payments = Payment.query.all()
    return jsonify([{
        "id": p.id,
        "user_id": p.user_id,
        "amount": p.amount,
        "status": p.status,
        "timestamp": p.timestamp.isoformat()
    } for p in payments])

@admin_bp.route('/maintenance', methods=['GET'])
@admin_required
def get_all_requests():
    reqs = MaintenanceRequest.query.all()
    return jsonify([{
        "id": r.id,
        "property_id": r.property_id,
        "status": r.status,
        "description": r.description
    } for r in reqs])

@admin_bp.route('/announce', methods=['POST'])
@admin_required
def send_announcement():
    data = request.get_json()
    message = data.get("message")
    if not message:
        return jsonify({"error": "Message required"}), 400
    # Here you would queue/send the announcement to all users (e.g., via notifications)
    # For now, just log or return success
    return jsonify({"message": "Announcement sent"}), 200

@admin_bp.route('/refund/<int:payment_id>', methods=['POST'])
@admin_required
def refund_payment(payment_id):
    payment = Payment.query.get(payment_id)
    if not payment or payment.status != "completed":
        return jsonify({"error": "Payment not found or not completed"}), 404
    # Integrate with Stripe to process refund here
    payment.status = "refunded"
    db.session.commit()
    return jsonify({"message": "Payment refunded"}), 200