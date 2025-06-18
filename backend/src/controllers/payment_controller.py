from ..models.payment import Payment
from ..extensions import db

def create_payment(data):
    payment = Payment(
        tenant_id=data["tenant_id"],
        amount=data["amount"],
        status=data.get("status", "pending"),
        due_date=data.get("due_date"),
        paid_date=data.get("paid_date")
    )
    db.session.add(payment)
    db.session.commit()
    return {"message": "Payment created"}, 201

def list_payments():
    payments = Payment.query.all()
    return [{
        "id": p.id,
        "tenant_id": p.tenant_id,
        "amount": p.amount,
        "status": p.status,
        "due_date": p.due_date.isoformat() if p.due_date else None,
        "paid_date": p.paid_date.isoformat() if p.paid_date else None
    } for p in payments]
