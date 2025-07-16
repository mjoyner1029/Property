import logging
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
from src.models.payment import Payment
from src.extensions import db

logger = logging.getLogger(__name__)

def create_payment(data):
    """Create a new payment record."""
    # Validate required fields
    required_fields = ["tenant_id", "amount"]
    for field in required_fields:
        if field not in data:
            logger.warning(f"Payment creation failed: missing {field}")
            return {"error": f"Missing required field: {field}"}, 400
            
    try:
        payment = Payment(
            tenant_id=data["tenant_id"],
            amount=data["amount"],
            status=data.get("status", "pending"),
            due_date=data.get("due_date"),
            paid_date=data.get("paid_date")
        )
        db.session.add(payment)
        db.session.commit()
        
        logger.info(f"Payment created for tenant {data['tenant_id']}, amount: {data['amount']}")
        return {"message": "Payment created", "id": payment.id}, 201
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Failed to create payment: {str(e)}")
        return {"error": "Failed to create payment"}, 500

def list_payments(filters=None):
    """Get all payments with optional filtering."""
    try:
        query = Payment.query
        
        # Apply filters if provided
        if filters:
            if 'tenant_id' in filters:
                query = query.filter_by(tenant_id=filters['tenant_id'])
            if 'status' in filters:
                query = query.filter_by(status=filters['status'])
            if 'from_date' in filters and 'to_date' in filters:
                query = query.filter(Payment.due_date.between(filters['from_date'], filters['to_date']))
        
        payments = query.all()
        
        return [{
            "id": p.id,
            "tenant_id": p.tenant_id,
            "amount": p.amount,
            "status": p.status,
            "due_date": p.due_date.isoformat() if p.due_date else None,
            "paid_date": p.paid_date.isoformat() if p.paid_date else None
        } for p in payments], 200
    except SQLAlchemyError as e:
        logger.error(f"Database error when listing payments: {str(e)}")
        return {"error": "Failed to retrieve payments"}, 500

def get_payment(payment_id):
    """Get a specific payment by ID."""
    try:
        payment = Payment.query.get(payment_id)
        
        if not payment:
            return {"error": "Payment not found"}, 404
            
        return {
            "id": payment.id,
            "tenant_id": payment.tenant_id,
            "amount": payment.amount,
            "status": payment.status,
            "due_date": payment.due_date.isoformat() if payment.due_date else None,
            "paid_date": payment.paid_date.isoformat() if payment.paid_date else None
        }, 200
    except SQLAlchemyError as e:
        logger.error(f"Database error when getting payment {payment_id}: {str(e)}")
        return {"error": "Failed to retrieve payment"}, 500

def update_payment(payment_id, data):
    """Update an existing payment."""
    try:
        payment = Payment.query.get(payment_id)
        
        if not payment:
            return {"error": "Payment not found"}, 404
            
        if "status" in data:
            payment.status = data["status"]
            
            # If marking as paid, update the paid_date
            if data["status"] == "paid" and not payment.paid_date:
                payment.paid_date = datetime.utcnow()
                
        if "amount" in data:
            payment.amount = data["amount"]
        if "due_date" in data:
            payment.due_date = data["due_date"]
        if "paid_date" in data:
            payment.paid_date = data["paid_date"]
            
        db.session.commit()
        logger.info(f"Payment {payment_id} updated")
        
        return {"message": "Payment updated"}, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Failed to update payment: {str(e)}")
        return {"error": "Failed to update payment"}, 500

def delete_payment(payment_id):
    """Delete a payment."""
    try:
        payment = Payment.query.get(payment_id)
        
        if not payment:
            return {"error": "Payment not found"}, 404
            
        db.session.delete(payment)
        db.session.commit()
        logger.info(f"Payment {payment_id} deleted")
        
        return {"message": "Payment deleted"}, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Failed to delete payment: {str(e)}")
        return {"error": "Failed to delete payment"}, 500
