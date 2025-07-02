# backend/src/routes/maintenance.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.extensions import db
from src.models.maintenance_request import MaintenanceRequest

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
def create_request():
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
