# backend/src/routes/maintenance.py

from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models.maintenance_request import MaintenanceRequest

bp = Blueprint("maintenance", __name__, url_prefix="/api/maintenance")

@bp.route("/", methods=["GET"])
def get_all_requests():
    requests = MaintenanceRequest.query.all()
    return jsonify([{
        "id": r.id,
        "description": r.description,
        "status": r.status,
        "created_at": r.created_at.isoformat()
    } for r in requests])

@bp.route("/", methods=["POST"])
def create_request():
    data = request.get_json()
    req = MaintenanceRequest(
        tenant_id=data["tenant_id"],
        property_id=data["property_id"],
        description=data["description"]
    )
    db.session.add(req)
    db.session.commit()
    return jsonify({"msg": "Request submitted"}), 201
