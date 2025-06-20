# backend/src/routes/payments.py
from flask import Blueprint, request, jsonify
from src.extensions import db
from src.models.payment import Payment

bp = Blueprint("payments", __name__, url_prefix="/api/payments")

@bp.route("/", methods=["GET"])
def get_all_payments():
    payments = Payment.query.all()
    return jsonify([{
        "id": p.id,
        "tenant_id": p.tenant_id,
        "amount": p.amount,
        "status": p.status,
        "due_date": p.due_date.isoformat() if p.due_date else None,
        "paid_date": p.paid_date.isoformat() if p.paid_date else None
    } for p in payments])

@bp.route("/", methods=["POST"])
def create_payment():
    data = request.get_json()
    payment = Payment(
        tenant_id=data["tenant_id"],
        amount=data["amount"],
        status=data.get("status", "pending"),
        due_date=data.get("due_date")
    )
    db.session.add(payment)
    db.session.commit()
    return jsonify({"msg": "Payment created"}), 201
