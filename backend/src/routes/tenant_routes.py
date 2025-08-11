# backend/src/routes/tenants.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.extensions import db
from src.models.tenant_profile import TenantProfile
from ..controllers.tenant_controller import (
    get_tenants,
    get_tenant,
    add_tenant,
    remove_tenant,
    update_tenant
)

tenant_bp = Blueprint('tenants', __name__)

# Routes with unique endpoint names
tenant_bp.route('/', methods=['GET'], endpoint='list_tenants')(jwt_required()(get_tenants))
tenant_bp.route('/<int:tenant_id>', methods=['GET'], endpoint='get_tenant_detail')(jwt_required()(get_tenant))
tenant_bp.route('/', methods=['POST'], endpoint='create_tenant')(jwt_required()(add_tenant))
tenant_bp.route('/<int:tenant_id>/properties/<int:property_id>', methods=['DELETE'], endpoint='remove_tenant_from_property')(jwt_required()(remove_tenant))
tenant_bp.route('/<int:tenant_id>', methods=['PUT'], endpoint='update_tenant_info')(jwt_required()(update_tenant))

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
