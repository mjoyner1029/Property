# backend/src/routes/tenants.py

from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models.tenant import Tenant

bp = Blueprint("tenants", __name__, url_prefix="/api/tenants")

@bp.route("/", methods=["GET"])
def get_tenants():
    tenants = Tenant.query.all()
    return jsonify([{
        "id": t.id,
        "user_id": t.user_id,
        "unit": t.unit,
        "lease_start": t.lease_start.isoformat() if t.lease_start else None,
        "lease_end": t.lease_end.isoformat() if t.lease_end else None
    } for t in tenants])

@bp.route("/", methods=["POST"])
def add_tenant():
    data = request.get_json()
    tenant = Tenant(
        user_id=data["user_id"],
        unit=data["unit"],
        lease_start=data.get("lease_start"),
        lease_end=data.get("lease_end")
    )
    db.session.add(tenant)
    db.session.commit()
    return jsonify({"msg": "Tenant added"}), 201
