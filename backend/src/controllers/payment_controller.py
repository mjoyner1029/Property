# backend/src/controllers/payment_controller.py
from __future__ import annotations

import logging
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Tuple, Optional

from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import and_

from ..models.payment import Payment
from ..extensions import db
from flask_jwt_extended import get_jwt_identity
# from flask import request, jsonify, current_app

logger = logging.getLogger(__name__)

# Import functions from payment_checkout.py (leave as-is if used by routes elsewhere)
try:
    from .payment_checkout import create_checkout_session, get_payment_history  # noqa: F401
except Exception:
    # Defer errors until actually called by routes that need these
    logger.debug("payment_checkout helpers not available; continuing")


# ------------------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------------------

def _as_decimal(val: Any) -> Optional[Decimal]:
    """
    Convert a value to Decimal safely. Accepts string/float/int.
    Returns None if invalid or negative.
    """
    if val is None:
        return None
    try:
        d = Decimal(str(val))
        # Optional: enforce non-negative amounts
        if d < Decimal("0"):
            return None
        # Normalize to 2 decimal places commonly used for currency
        return d.quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError, TypeError):
        return None


def _as_date(val: Any) -> Optional[date]:
    """
    Accepts ISO date ('YYYY-MM-DD') or datetime string. Returns a date or None.
    """
    if not val:
        return None
    if isinstance(val, (date, datetime)):
        return val.date() if isinstance(val, datetime) else val
    s = str(val).strip()
    # Try date first
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%fZ"):
        try:
            dt = datetime.strptime(s, fmt)
            return dt.date()
        except ValueError:
            continue
    # Last resort: fromisoformat may handle more variants
    try:
        return datetime.fromisoformat(s).date()
    except Exception:
        return None


def _payment_to_dict(p: Payment) -> Dict[str, Any]:
    return {
        "id": p.id,
        "tenant_id": p.tenant_id,
        "amount": float(p.amount) if p.amount is not None else None,
        "status": p.status,
        "due_date": p.due_date.isoformat() if getattr(p, "due_date", None) else None,
        "paid_date": p.paid_date.isoformat() if getattr(p, "paid_date", None) else None,
        "created_at": p.created_at.isoformat() if getattr(p, "created_at", None) else None,
        "updated_at": p.updated_at.isoformat() if getattr(p, "updated_at", None) else None,
    }


# ------------------------------------------------------------------------------
# CRUD (service-layer functions; call from routes)
# ------------------------------------------------------------------------------

def create_payment(data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
    """Create a new payment record."""
    # Validate required fields
    missing = [f for f in ("tenant_id", "amount") if f not in data or data[f] in (None, "")]
    if missing:
        logger.warning("Payment creation failed: missing %s", ", ".join(missing))
        return {"error": f"Missing required field(s): {', '.join(missing)}"}, 400

    tenant_id = data.get("tenant_id")
    amount = _as_decimal(data.get("amount"))
    if not isinstance(tenant_id, int):
        try:
            tenant_id = int(tenant_id)
        except Exception:
            return {"error": "tenant_id must be an integer"}, 400

    if amount is None:
        return {"error": "amount must be a non-negative number"}, 400

    status = str(data.get("status", "pending")).strip().lower() or "pending"
    if status not in {"pending", "due", "paid", "failed", "void"}:
        return {"error": "Invalid status. Use one of: pending, due, paid, failed, void"}, 400

    due_date = _as_date(data.get("due_date"))
    paid_date = _as_date(data.get("paid_date"))

    try:
        payment = Payment(
            tenant_id=tenant_id,
            amount=amount,
            status=status,
            due_date=due_date,
            paid_date=paid_date,
        )
        db.session.add(payment)
        db.session.commit()

        logger.info("Payment created (id=%s) for tenant %s amount=%s", payment.id, tenant_id, amount)
        return {"message": "Payment created", "id": payment.id, "payment": _payment_to_dict(payment)}, 201

    except IntegrityError as e:
        db.session.rollback()
        logger.warning("Integrity error creating payment: %s", e)
        return {"error": "Integrity error creating payment"}, 400
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("DB error creating payment: %s", e)
        return {"error": "Failed to create payment"}, 500
    except Exception as e:
        db.session.rollback()
        logger.exception("Unexpected error creating payment")
        return {"error": "Failed to create payment"}, 500


def list_payments(filters: Optional[Dict[str, Any]] = None) -> Tuple[Any, int]:
    """Get all payments with optional filtering."""
    try:
        q = Payment.query

        if filters:
            tenant_id = filters.get("tenant_id")
            if tenant_id is not None:
                try:
                    tenant_id = int(tenant_id)
                    q = q.filter(Payment.tenant_id == tenant_id)
                except Exception:
                    return {"error": "tenant_id must be an integer"}, 400

            status = filters.get("status")
            if status:
                q = q.filter(Payment.status == str(status).strip().lower())

            from_date = _as_date(filters.get("from_date"))
            to_date = _as_date(filters.get("to_date"))
            if from_date and to_date:
                # Assuming due_date is the primary filterable field
                q = q.filter(and_(Payment.due_date >= from_date, Payment.due_date <= to_date))
            elif from_date:
                q = q.filter(Payment.due_date >= from_date)
            elif to_date:
                q = q.filter(Payment.due_date <= to_date)

        payments: List[Payment] = q.order_by(Payment.due_date.asc().nulls_last()).all()

        return ([_payment_to_dict(p) for p in payments], 200)

    except SQLAlchemyError as e:
        logger.error("Database error when listing payments: %s", e)
        return {"error": "Failed to retrieve payments"}, 500
    except Exception as e:
        logger.exception("Unexpected error when listing payments")
        return {"error": "Failed to retrieve payments"}, 500


def get_payment(payment_id: Any) -> Tuple[Dict[str, Any], int]:
    """Get a specific payment by ID."""
    try:
        pid = int(payment_id)
    except Exception:
        return {"error": "payment_id must be an integer"}, 400

    try:
        payment = Payment.query.get(pid)
        if not payment:
            return {"error": "Payment not found"}, 404
        return _payment_to_dict(payment), 200
    except SQLAlchemyError as e:
        logger.error("Database error when getting payment %s: %s", pid, e)
        return {"error": "Failed to retrieve payment"}, 500
    except Exception:
        logger.exception("Unexpected error when getting payment")
        return {"error": "Failed to retrieve payment"}, 500


def update_payment(payment_id: Any, data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
    """Update an existing payment."""
    try:
        pid = int(payment_id)
    except Exception:
        return {"error": "payment_id must be an integer"}, 400

    try:
        payment = Payment.query.get(pid)
        if not payment:
            return {"error": "Payment not found"}, 404

        if "status" in data:
            status = str(data["status"]).strip().lower()
            if status not in {"pending", "due", "paid", "failed", "void"}:
                return {"error": "Invalid status. Use one of: pending, due, paid, failed, void"}, 400
            payment.status = status
            # If marking as paid, update the paid_date
            if status == "paid" and not payment.paid_date:
                payment.paid_date = datetime.utcnow().date()

        if "amount" in data:
            amt = _as_decimal(data["amount"])
            if amt is None:
                return {"error": "amount must be a non-negative number"}, 400
            payment.amount = amt

        if "due_date" in data:
            dd = _as_date(data["due_date"])
            if data["due_date"] is not None and dd is None:
                return {"error": "due_date must be an ISO date (YYYY-MM-DD)"}, 400
            payment.due_date = dd

        if "paid_date" in data:
            pd = _as_date(data["paid_date"])
            if data["paid_date"] is not None and pd is None:
                return {"error": "paid_date must be an ISO date (YYYY-MM-DD)"}, 400
            payment.paid_date = pd

        db.session.commit()
        logger.info("Payment %s updated", pid)
        return {"message": "Payment updated", "payment": _payment_to_dict(payment)}, 200

    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("Failed to update payment %s: %s", payment_id, e)
        return {"error": "Failed to update payment"}, 500
    except Exception:
        db.session.rollback()
        logger.exception("Unexpected error updating payment")
        return {"error": "Failed to update payment"}, 500


def delete_payment(payment_id: Any) -> Tuple[Dict[str, Any], int]:
    """Delete a payment."""
    try:
        pid = int(payment_id)
    except Exception:
        return {"error": "payment_id must be an integer"}, 400

    try:
        payment = Payment.query.get(pid)
        if not payment:
            return {"error": "Payment not found"}, 404

        db.session.delete(payment)
        db.session.commit()
        logger.info("Payment %s deleted", pid)
        return {"message": "Payment deleted"}, 200

    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("Failed to delete payment %s: %s", payment_id, e)
        return {"error": "Failed to delete payment"}, 500
    except Exception:
        db.session.rollback()
        logger.exception("Unexpected error deleting payment")
        return {"error": "Failed to delete payment"}, 500
def create_payment(payment_data):
    """Create a new payment record"""
    try:
        # Validate payment data
        if 'amount_cents' not in payment_data or 'currency' not in payment_data:
            return {"error": "Missing required fields"}, 400

        new_payment = Payment(
            amount_cents=payment_data['amount_cents'],
            currency=payment_data['currency'],
            status=payment_data.get('status', 'pending'),
            payment_method=payment_data.get('payment_method', 'card'),
            payer_id=payment_data.get('payer_id'),
            receiver_id=payment_data.get('receiver_id'),
            invoice_id=payment_data.get('invoice_id'),
            description=payment_data.get('description', ''),
            metadata=payment_data.get('metadata', {})
        )
        
        db.session.add(new_payment)
        db.session.commit()
        
        return {"message": "Payment created successfully", "payment_id": new_payment.id}, 201
    
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Database error creating payment: {str(e)}")
        return {"error": "Failed to create payment"}, 500
    except Exception as e:
        logger.error(f"Unexpected error creating payment: {str(e)}")
        return {"error": "An unexpected error occurred"}, 500


def get_payments():
    """Get all payments with pagination and filtering"""
    try:
        # Basic implementation without pagination for now
        payments = Payment.query.all()
        
        result = []
        for payment in payments:
            result.append({
                "id": payment.id,
                "amount_cents": payment.amount_cents,
                "currency": payment.currency,
                "status": payment.status,
                "created_at": payment.created_at.isoformat() if payment.created_at else None,
                "payment_method": payment.payment_method,
                "payer_id": payment.payer_id,
                "receiver_id": payment.receiver_id,
                "invoice_id": payment.invoice_id
            })
        
        return {"payments": result}, 200
    
    except Exception as e:
        logger.error(f"Error retrieving payments: {str(e)}")
        return {"error": "Failed to retrieve payments"}, 500


def get_payment(payment_id):
    """Get a specific payment by ID"""
    try:
        payment = Payment.query.get(payment_id)
        
        if not payment:
            return {"error": "Payment not found"}, 404
        
        return {
            "id": payment.id,
            "amount_cents": payment.amount_cents,
            "currency": payment.currency,
            "status": payment.status,
            "created_at": payment.created_at.isoformat() if payment.created_at else None,
            "updated_at": payment.updated_at.isoformat() if payment.updated_at else None,
            "payment_method": payment.payment_method,
            "payer_id": payment.payer_id,
            "receiver_id": payment.receiver_id,
            "invoice_id": payment.invoice_id,
            "description": payment.description,
            "metadata": payment.metadata
        }, 200
    
    except Exception as e:
        logger.error(f"Error retrieving payment {payment_id}: {str(e)}")
        return {"error": "Failed to retrieve payment"}, 500


def get_tenant_payments():
    """Get payments for the current tenant"""
    try:
        # Get current user ID from JWT token
        tenant_id = get_jwt_identity()
        
        # Query payments for this tenant
        payments = Payment.query.filter_by(tenant_id=tenant_id).all()
        
        # Convert to list of dictionaries for JSON response
        payment_list = []
        for payment in payments:
            payment_list.append(_payment_to_dict(payment))
            
        return {"payments": payment_list}, 200
    except Exception as e:
        logger.error(f"Error getting tenant payments: {str(e)}")
        return {"error": "Failed to retrieve payments"}, 500


def get_landlord_payments():
    """Get payments for the current landlord"""
    try:
        # Get current user ID from JWT token
        landlord_id = get_jwt_identity()
        
        # Query payments where landlord is the receiver
        # This assumes a landlord_id field exists in the Payment model
        payments = Payment.query.filter_by(landlord_id=landlord_id).all()
        
        # Convert to list of dictionaries for JSON response
        payment_list = []
        for payment in payments:
            payment_list.append(_payment_to_dict(payment))
            
        return {"payments": payment_list}, 200
    except Exception as e:
        logger.error(f"Error getting landlord payments: {str(e)}")
        return {"error": "Failed to retrieve payments"}, 500


def create_checkout_session(session_data):
    """
    Create a Stripe checkout session
    This is imported from payment_checkout.py in the module imports
    """
    # Import the actual implementation
    from .payment_checkout import create_checkout_session as _create_checkout_session
    return _create_checkout_session()


def get_payment_history():
    """
    Get payment history for the current user
    This is imported from payment_checkout.py in the module imports
    """
    # Call the implementation from payment_checkout module
    return {"error": "Not implemented yet"}, 501
