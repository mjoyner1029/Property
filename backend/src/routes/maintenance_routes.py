# backend/src/routes/maintenance.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.extensions import db
from src.models.maintenance_request import MaintenanceRequest
from ..controllers.maintenance_controller import (
    create_request, get_requests, get_request,
    update_request, delete_request, get_tenant_requests,
    get_landlord_requests, assign_request, complete_request
)

bp = Blueprint("maintenance", __name__, url_prefix="/api/maintenance")

@bp.route("/", methods=["GET"])
@jwt_required()
def get_all_requests():
    user_id = get_jwt_identity()["id"]
    # Optionally filter by user role or property
    requests = MaintenanceRequest.query.all()
    return jsonify([{
        "id": r.id,
        "tenant_id": r.tenant_id,
        "property_id": r.property_id,
        "description": r.description,
        "status": r.status,
        "created_at": r.created_at.isoformat()
    } for r in requests])

@bp.route("/", methods=["POST"])
@jwt_required()
def create_request_route():
    user_id = get_jwt_identity()["id"]
    data = request.get_json()
    req = MaintenanceRequest(
        tenant_id=user_id,
        property_id=data["property_id"],
        description=data["description"]
    )
    db.session.add(req)
    db.session.commit()
    return jsonify({"msg": "Request submitted"}), 201

bp.route("/", methods=["GET"])(get_requests)
bp.route("/", methods=["POST"])(create_request)
bp.route("/<int:request_id>", methods=["GET"])(get_request)
bp.route("/<int:request_id>", methods=["PUT"])(update_request)
bp.route("/<int:request_id>", methods=["DELETE"])(delete_request)
bp.route("/tenant", methods=["GET"])(get_tenant_requests)
bp.route("/landlord", methods=["GET"])(get_landlord_requests)
bp.route("/<int:request_id>/assign", methods=["PUT"])(assign_request)
bp.route("/<int:request_id>/complete", methods=["PUT"])(complete_request)
