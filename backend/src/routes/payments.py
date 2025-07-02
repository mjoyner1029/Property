# backend/src/routes/payments.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.extensions import db
from src.models.payment import Payment

bp = Blueprint("payments", __name__, url_prefix="/api/payments")

@bp.route("/", methods=["GET"])
@jwt_required()
def get_all_payments():
    user_id = get_jwt_identity()["id"]
    # Only return payments for the current user (tenant or landlord)
    payments = Payment.query.filter_by(tenant_id=user_id).all()
    return jsonify([{
        "id": p.id,
        "tenant_id": p.tenant_id,
        "amount": p.amount,
        "status": p.status,
        "due_date": p.due_date.isoformat() if p.due_date else None,
        "paid_date": p.paid_date.isoformat() if p.paid_date else None
    } for p in payments])

@bp.route("/", methods=["POST"])
@jwt_required()
def create_payment():
    user_id = get_jwt_identity()["id"]
    data = request.get_json()
    payment = Payment(
        tenant_id=user_id,
        amount=data["amount"],
        status=data.get("status", "pending"),
        due_date=data.get("due_date")
    )
    db.session.add(payment)
    db.session.commit()
    return jsonify({"msg": "Payment created"}), 201
