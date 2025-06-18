from ..models.maintenance_request import MaintenanceRequest
from ..extensions import db


def get_all_requests():
    requests = MaintenanceRequest.query.all()
    return [{
        "id": r.id,
        "description": r.description,
        "status": r.status,
        "created_at": r.created_at.isoformat()
    } for r in requests]


def create_maintenance_request(data):
    req = MaintenanceRequest(
        tenant_id=data["tenant_id"],
        property_id=data["property_id"],
        description=data["description"]
    )
    db.session.add(req)
    db.session.commit()
    return {"message": "Maintenance request created"}, 201
