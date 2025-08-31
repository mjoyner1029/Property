# backend/src/controllers/invoice_controller.py
from __future__ import annotations

import logging
from datetime import datetime, date, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional, Tuple

from flask import request, jsonify, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import and_

from src.extensions import db
from src.models.invoice import Invoice  # adjust if your path/model name differs
from src.models.tenant_property import TenantProperty

logger = logging.getLogger(__name__)

# ---------- helpers ----------

def _dec(val: Any) -> Optional[Decimal]:
    if val is None:
        return None
    try:
        d = Decimal(str(val))
        return d.quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError, TypeError):
        return None

def _as_date(val: Any) -> Optional[date]:
    if not val:
        return None
    if isinstance(val, (date, datetime)):
        return val.date() if isinstance(val, datetime) else val
    s = str(val).strip()
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%fZ"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(s).date()
    except Exception:
        return None

def _to_dict(inv: Invoice) -> Dict[str, Any]:
    return {
        "id": inv.id,
        "tenant_id": getattr(inv, "tenant_id", None),
        "landlord_id": getattr(inv, "landlord_id", None),
        "amount": float(inv.amount) if getattr(inv, "amount", None) is not None else None,
        "status": getattr(inv, "status", None),
        "due_date": getattr(inv, "due_date", None).isoformat() if getattr(inv, "due_date", None) else None,
        "paid_at": getattr(inv, "paid_at", None).isoformat() if getattr(inv, "paid_at", None) else None,
        "created_at": getattr(inv, "created_at", None).isoformat() if getattr(inv, "created_at", None) else None,
        "updated_at": getattr(inv, "updated_at", None).isoformat() if getattr(inv, "updated_at", None) else None,
        "description": getattr(inv, "description", None),
        "property_id": getattr(inv, "property_id", None),
    }

def _get_or_404(invoice_id: int) -> Invoice:
    inv: Optional[Invoice] = Invoice.query.get(invoice_id)
    if not inv:
        abort(404, description="Invoice not found")
    return inv

# ---------- views (used directly by blueprint) ----------

@jwt_required(optional=True)
@jwt_required()
def create_invoice():
    data = request.get_json(silent=True) or {}
    logger.debug("Received create_invoice data: %s", data)
    
    # Get the current user for landlord_id
    current_user_id = get_jwt_identity()
    if not current_user_id:
        return jsonify({"error": "Authentication required"}), 401
        
    missing = [f for f in ("tenant_id", "amount") if f not in data or data[f] in (None, "")]
    if missing:
        logger.error("Missing required fields for invoice: %s", missing)
        return jsonify({"error": f"Missing required field(s): {', '.join(missing)}"}), 400

    try:
        tenant_id = int(data.get("tenant_id"))
    except Exception:
        return jsonify({"error": "tenant_id must be an integer"}), 400

    amount = _dec(data.get("amount"))
    if amount is None:
        return jsonify({"error": "amount must be a non-negative number"}), 400

    status = str(data.get("status", "due")).strip().lower() or "due"
    allowed = {"due", "paid", "void", "overdue", "pending"}
    if status not in allowed:
        return jsonify({"error": f"Invalid status. Use one of: {', '.join(sorted(allowed))}"}), 400

    due_date = _as_date(data.get("due_date"))
    landlord_id = data.get("landlord_id")
    try:
        landlord_id = int(landlord_id) if landlord_id is not None else None
    except Exception:
        return jsonify({"error": "landlord_id must be an integer"}), 400

    desc = data.get("description")
    property_id = data.get("property_id")
    try:
        property_id = int(property_id) if property_id is not None else None
    except Exception:
        return jsonify({"error": "property_id must be an integer"}), 400

    try:
        # If property_id/unit_id not provided, get from TenantProperty
        if not property_id:
            # Look up the tenant's property information
            tenant_property = db.session.query(db.Model.metadata.tables['tenant_properties']).filter_by(
                tenant_id=tenant_id, 
                status='active'
            ).first()
            
            if tenant_property:
                logger.debug("Found tenant property: %s", tenant_property)
                property_id = tenant_property.property_id
                unit_id = tenant_property.unit_id
            else:
                logger.warning("No active property found for tenant %s", tenant_id)
        
        # Get current user ID for landlord_id if not provided
        if not landlord_id:
            landlord_id = current_user_id

        # Generate invoice number if not provided
        import uuid
        from datetime import datetime
        invoice_number = data.get('invoice_number')
        if not invoice_number:
            invoice_number = f'INV-{datetime.utcnow().strftime("%Y%m%d")}-{uuid.uuid4().hex[:8]}'

        # Get category if provided or default to 'other'
        category = data.get('category', 'other')
        
        logger.debug("Creating invoice with: tenant_id=%s, property_id=%s, unit_id=%s, landlord_id=%s, amount=%s",
                    tenant_id, property_id, unit_id, landlord_id, amount)
        
        inv = Invoice(
            tenant_id=tenant_id,
            property_id=property_id,
            unit_id=unit_id,
            landlord_id=landlord_id,
            amount=amount,
            status=status,
            due_date=due_date,
            description=desc or "Invoice",
            invoice_number=invoice_number,
            category=category,
        )
        db.session.add(inv)
        db.session.commit()
        logger.debug("Invoice created successfully: %s", inv.id)
        return jsonify({"message": "Invoice created", "invoice": inv.to_dict() if hasattr(inv, 'to_dict') else _to_dict(inv)}), 201
    except IntegrityError as e:
        db.session.rollback()
        logger.error("Integrity error creating invoice: %s", str(e))
        return jsonify({"error": f"Integrity error creating invoice: {str(e)}"}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("DB error creating invoice: %s", str(e))
        return jsonify({"error": f"Failed to create invoice: {str(e)}"}), 500
    except Exception as e:
        db.session.rollback()
        logger.error("Unexpected error creating invoice: %s", str(e))
        return jsonify({"error": f"Failed to create invoice: {str(e)}"}), 500

@jwt_required(optional=True)
def get_invoices():
    # Filters via query params: tenant_id, landlord_id, status, from_date, to_date
    args = request.args
    q = Invoice.query

    tenant_id = args.get("tenant_id")
    if tenant_id is not None:
        try:
            q = q.filter(Invoice.tenant_id == int(tenant_id))
        except Exception:
            return jsonify({"error": "tenant_id must be an integer"}), 400

    landlord_id = args.get("landlord_id")
    if landlord_id is not None and hasattr(Invoice, "landlord_id"):
        try:
            q = q.filter(Invoice.landlord_id == int(landlord_id))
        except Exception:
            return jsonify({"error": "landlord_id must be an integer"}), 400

    status = args.get("status")
    if status and hasattr(Invoice, "status"):
        q = q.filter(Invoice.status == status.strip().lower())

    from_date = _as_date(args.get("from_date"))
    to_date = _as_date(args.get("to_date"))
    if from_date and to_date and hasattr(Invoice, "due_date"):
        q = q.filter(and_(Invoice.due_date >= from_date, Invoice.due_date <= to_date))
    elif from_date and hasattr(Invoice, "due_date"):
        q = q.filter(Invoice.due_date >= from_date)
    elif to_date and hasattr(Invoice, "due_date"):
        q = q.filter(Invoice.due_date <= to_date)

    invs: List[Invoice] = q.order_by(getattr(Invoice, "due_date", Invoice.id).asc()).all()
    return jsonify([_to_dict(i) for i in invs]), 200

@jwt_required(optional=True)
def get_invoice(invoice_id: int):
    inv = _get_or_404(invoice_id)
    return jsonify(_to_dict(inv)), 200

@jwt_required()
def update_invoice(invoice_id: int):
    inv = _get_or_404(invoice_id)
    data = request.get_json(silent=True) or {}

    if "amount" in data and hasattr(inv, "amount"):
        amt = _dec(data["amount"])
        if amt is None:
            return jsonify({"error": "amount must be a non-negative number"}), 400
        inv.amount = amt

    if "status" in data and hasattr(inv, "status"):
        status = str(data["status"]).strip().lower()
        allowed = {"due", "paid", "void", "overdue", "pending"}
        if status not in allowed:
            return jsonify({"error": f"Invalid status. Use one of: {', '.join(sorted(allowed))}"}), 400
        inv.status = status
        if status == "paid" and hasattr(inv, "paid_at") and getattr(inv, "paid_at", None) is None:
            inv.paid_at = datetime.now(timezone.utc)

    if "due_date" in data and hasattr(inv, "due_date"):
        dd = _as_date(data["due_date"])
        if data["due_date"] is not None and dd is None:
            return jsonify({"error": "due_date must be an ISO date (YYYY-MM-DD)"}), 400
        inv.due_date = dd

    if "paid_at" in data and hasattr(inv, "paid_at"):
        # allow explicit override/clear
        pa = data["paid_at"]
        inv.paid_at = None if pa in (None, "") else datetime.fromisoformat(str(pa))

    if "description" in data and hasattr(inv, "description"):
        inv.description = data["description"]

    if "tenant_id" in data and hasattr(inv, "tenant_id"):
        try:
            inv.tenant_id = int(data["tenant_id"]) if data["tenant_id"] is not None else None
        except Exception:
            return jsonify({"error": "tenant_id must be an integer"}), 400

    if "landlord_id" in data and hasattr(inv, "landlord_id"):
        try:
            inv.landlord_id = int(data["landlord_id"]) if data["landlord_id"] is not None else None
        except Exception:
            return jsonify({"error": "landlord_id must be an integer"}), 400

    if hasattr(inv, "updated_at"):
        inv.updated_at = datetime.now(timezone.utc)

    try:
        db.session.commit()
        return jsonify({"message": "Invoice updated", "invoice": _to_dict(inv)}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("Failed to update invoice %s: %s", invoice_id, e)
        return jsonify({"error": "Failed to update invoice"}), 500

@jwt_required()
def delete_invoice(invoice_id: int):
    inv = _get_or_404(invoice_id)
    try:
        db.session.delete(inv)
        db.session.commit()
        return jsonify({"message": "Invoice deleted"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("Failed to delete invoice %s: %s", invoice_id, e)
        return jsonify({"error": "Failed to delete invoice"}), 500

@jwt_required()
def get_tenant_invoices():
    # Get the current user's ID from JWT
    current_user_id = get_jwt_identity()
    if not current_user_id:
        return jsonify({"error": "Authentication required"}), 401
    
    # Allow override with query param for admin/landlord access
    tenant_id = request.args.get("tenant_id")
    if tenant_id is None:
        tenant_id = current_user_id  # Default to current user
    else:
        try:
            tenant_id = int(tenant_id)
        except Exception:
            return jsonify({"error": "tenant_id must be an integer"}), 400

    logger.debug("Getting invoices for tenant_id: %s", tenant_id)
    q = Invoice.query.filter(Invoice.tenant_id == tenant_id)
    invs = q.order_by(getattr(Invoice, "due_date", Invoice.id).desc()).all()
    
    return jsonify({"invoices": [inv.to_dict() if hasattr(inv, 'to_dict') else _to_dict(inv) for inv in invs]}), 200

@jwt_required()
def get_landlord_invoices():
    # Get the current user's ID from JWT
    current_user_id = get_jwt_identity()
    if not current_user_id:
        return jsonify({"error": "Authentication required"}), 401
    
    # Allow override with query param for admin access
    landlord_id = request.args.get("landlord_id")
    if landlord_id is None:
        landlord_id = current_user_id  # Default to current user
    else:
        try:
            landlord_id = int(landlord_id)
        except Exception:
            return jsonify({"error": "landlord_id must be an integer"}), 400

    logger.debug("Getting invoices for landlord_id: %s", landlord_id)
    q = Invoice.query.filter(Invoice.landlord_id == landlord_id)
    invs = q.order_by(getattr(Invoice, "due_date", Invoice.id).desc()).all()
    
    return jsonify({"invoices": [inv.to_dict() if hasattr(inv, 'to_dict') else _to_dict(inv) for inv in invs]}), 200

@jwt_required()
def mark_paid(invoice_id: int):
    inv = _get_or_404(invoice_id)
    data = request.get_json(silent=True) or {}
    
    logger.debug("Marking invoice %s as paid with data: %s", invoice_id, data)
    
    if hasattr(inv, "status"):
        inv.status = "paid"
        
    # Set the paid_at timestamp
    if hasattr(inv, "paid_at"):
        inv.paid_at = datetime.now(timezone.utc)
        
    # Add payment_date to response for test compatibility
    payment_date = datetime.now(timezone.utc)
    if hasattr(inv, "paid_at"):
        inv.paid_at = datetime.now(timezone.utc)
    if hasattr(inv, "updated_at"):
        inv.updated_at = datetime.now(timezone.utc)
    try:
        db.session.commit()
        invoice_dict = inv.to_dict() if hasattr(inv, 'to_dict') else _to_dict(inv)
        invoice_dict['payment_date'] = payment_date.isoformat()  # Add payment_date for test compatibility
        return jsonify({"message": "Invoice marked paid", "invoice": invoice_dict}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("Failed to mark paid %s: %s", invoice_id, e)
        return jsonify({"error": "Failed to mark paid"}), 500

@jwt_required()
def mark_unpaid(invoice_id: int):
    inv = _get_or_404(invoice_id)
    if hasattr(inv, "status"):
        inv.status = "due"  # or "unpaid" if that's your canonical value
    if hasattr(inv, "paid_at"):
        inv.paid_at = None
    if hasattr(inv, "updated_at"):
        inv.updated_at = datetime.now(timezone.utc)
    try:
        db.session.commit()
        return jsonify({"message": "Invoice marked unpaid", "invoice": _to_dict(inv)}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("Failed to mark unpaid %s: %s", invoice_id, e)
        return jsonify({"error": "Failed to mark unpaid"}), 500

@jwt_required()
def generate_rent_invoices():
    """
    Minimal generator: accepts JSON like:
    {
      "invoices": [
        {"tenant_id": 3, "amount": 1500, "due_date": "2025-09-01", "description": "...", "landlord_id": 1, "property_id": 42}
      ]
    }
    """
    data = request.get_json(silent=True) or {}
    items = data.get("invoices")
    if not isinstance(items, list) or not items:
        return jsonify({"error": "Provide 'invoices' as a non-empty list"}), 400

    created: List[Dict[str, Any]] = []
    try:
        for item in items:
            tenant_id = item.get("tenant_id")
            amount = _dec(item.get("amount"))
            if tenant_id is None or amount is None:
                return jsonify({"error": "Each invoice needs tenant_id and a valid amount"}), 400
            try:
                tenant_id = int(tenant_id)
            except Exception:
                return jsonify({"error": "tenant_id must be an integer"}), 400

            inv = Invoice(
                tenant_id=tenant_id,
                amount=amount if hasattr(Invoice, "amount") else None,
                status="due" if hasattr(Invoice, "status") else None,
                due_date=_as_date(item.get("due_date")) if hasattr(Invoice, "due_date") else None,
                description=item.get("description") if hasattr(Invoice, "description") else None,
                landlord_id=int(item["landlord_id"]) if hasattr(Invoice, "landlord_id") and "landlord_id" in item and item["landlord_id"] is not None else None,
                property_id=int(item["property_id"]) if hasattr(Invoice, "property_id") and "property_id" in item and item["property_id"] is not None else None,
            )
            db.session.add(inv)
            db.session.flush()  # get inv.id without committing
            created.append(_to_dict(inv))

        db.session.commit()
        return jsonify({"message": "Invoices generated", "count": len(created), "invoices": created}), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error generating invoices"}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error("DB error generating invoices: %s", e)
        return jsonify({"error": "Failed to generate invoices"}), 500
