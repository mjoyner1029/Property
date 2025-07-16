# backend/src/routes/tenants.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.extensions import db
from src.models.tenant_profile import TenantProfile
from ..controllers.tenant_controller import (
    get_tenants, get_tenant_profile, update_tenant_profile,
    get_landlord_tenants, create_tenant_profile
)

tenant_bp = Blueprint('tenants', __name__)

tenant_bp.route('/', methods=['GET'])(get_tenants)
tenant_bp.route('/profile', methods=['GET'])(get_tenant_profile)
tenant_bp.route('/profile', methods=['POST'])(create_tenant_profile)
tenant_bp.route('/profile', methods=['PUT'])(update_tenant_profile)
tenant_bp.route('/landlord', methods=['GET'])(get_landlord_tenants)

@tenant_bp.route("/", methods=["GET"])
@jwt_required()
def get_tenants():
    # Optionally filter by landlord or property if needed
    tenants = TenantProfile.query.all()
    return jsonify([
        {
            "id": t.id,
            "user_id": t.user_id,
            "property_id": t.property_id,
            "lease_start": t.lease_start.isoformat() if t.lease_start else None,
            "lease_end": t.lease_end.isoformat() if t.lease_end else None
        }
        for t in tenants
    ])

@tenant_bp.route("/", methods=["POST"])
@jwt_required()
def add_tenant():
    data = request.get_json()
    try:
        tenant = TenantProfile(
            user_id=data["user_id"],
            property_id=data["property_id"],
            lease_start=data.get("lease_start"),
            lease_end=data.get("lease_end")
        )
        db.session.add(tenant)
        db.session.commit()
        return jsonify({"msg": "Tenant added"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400
