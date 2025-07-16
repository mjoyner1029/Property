from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.extensions import db
from src.models.landlord_profile import LandlordProfile
from src.models.tenant_profile import TenantProfile
from src.models.property import Property
from src.models.lease import Lease
from ..controllers.onboarding_controller import (
    start_onboarding, complete_step, get_onboarding_status,
    skip_step, reset_onboarding, onboard_landlord, onboard_tenant
)

bp = Blueprint("onboard", __name__, url_prefix="/api/onboard")

@bp.route("/landlord", methods=["POST"])
@jwt_required()
def onboard_landlord():
    user_id = get_jwt_identity()["id"]
    data = request.get_json()
    phone = data.get("phone")
    company = data.get("company_name")
    properties = data.get("properties", [])

    if not phone:
        return jsonify({"msg": "Phone number is required"}), 400

    # Prevent duplicate onboarding
    if LandlordProfile.query.filter_by(user_id=user_id).first():
        return jsonify({"msg": "Landlord already onboarded"}), 400

    profile = LandlordProfile(user_id=user_id, phone=phone, company_name=company)
    db.session.add(profile)
    db.session.flush()

    for prop in properties:
        if not all(k in prop for k in ("name", "address", "unit_count")):
            continue  # skip incomplete property data
        p = Property(
            landlord_id=user_id,
            name=prop["name"],
            address=prop["address"],
            unit_count=prop["unit_count"]
        )
        db.session.add(p)

    db.session.commit()
    return jsonify({"msg": "Landlord onboarding completed"}), 201

@bp.route("/tenant", methods=["POST"])
@jwt_required()
def onboard_tenant():
    user_id = get_jwt_identity()["id"]
    data = request.get_json()

    phone = data.get("phone")
    property_id = data.get("property_id")
    unit = data.get("unit")
    lease_start = data.get("lease_start")
    lease_end = data.get("lease_end")
    rent = data.get("monthly_rent")
    emergency_contact = data.get("emergency_contact")

    missing = [field for field in ["phone", "property_id", "unit", "lease_start", "lease_end", "monthly_rent"] if not data.get(field)]
    if missing:
        return jsonify({"msg": f"Missing fields: {', '.join(missing)}"}), 400

    # Prevent duplicate onboarding
    if TenantProfile.query.filter_by(user_id=user_id).first():
        return jsonify({"msg": "Tenant already onboarded"}), 400

    profile = TenantProfile(
        user_id=user_id,
        phone=phone,
        property_id=property_id,
        unit=unit,
        lease_start=lease_start,
        lease_end=lease_end,
        monthly_rent=rent,
        emergency_contact=emergency_contact
    )
    db.session.add(profile)

    lease = Lease(
        tenant_id=user_id,
        property_id=property_id,
        unit=unit,
        start_date=lease_start,
        end_date=lease_end,
        rent=rent
    )
    db.session.add(lease)
    db.session.commit()

    return jsonify({"msg": "Tenant onboarding completed"}), 201

# Consolidate the duplicate BP definitions:
bp = Blueprint("onboard", __name__, url_prefix="/api/onboard")

# Map all controllers to the same blueprint
bp.route("/landlord", methods=["POST"])(onboard_landlord)
bp.route("/tenant", methods=["POST"])(onboard_tenant)
bp.route('/start', methods=['POST'])(start_onboarding)
bp.route('/step/<step_name>', methods=['POST'])(complete_step)
bp.route('/status', methods=['GET'])(get_onboarding_status)
bp.route('/skip/<step_name>', methods=['POST'])(skip_step)
bp.route('/reset', methods=['POST'])(reset_onboarding)
