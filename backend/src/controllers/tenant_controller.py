from ..models.tenant import Tenant
from ..extensions import db


def get_all_tenants():
    tenants = Tenant.query.all()
    return [{
        "id": t.id,
        "user_id": t.user_id,
        "unit": t.unit,
        "lease_start": t.lease_start.isoformat() if t.lease_start else None,
        "lease_end": t.lease_end.isoformat() if t.lease_end else None
    } for t in tenants]


def create_tenant(data):
    tenant = Tenant(
        user_id=data["user_id"],
        unit=data["unit"],
        lease_start=data.get("lease_start"),
        lease_end=data.get("lease_end")
    )
    db.session.add(tenant)
    db.session.commit()
    return {"message": "Tenant created"}, 201
