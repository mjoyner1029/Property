from ..extensions import db
from .tenant_profile import TenantProfile  # <-- import correct model

class MaintenanceRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey("tenant_profiles.id"))  # <-- updated FK
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default="open")  # open, in progress, closed
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    tenant = db.relationship("TenantProfile", backref="maintenance_requests")  # <-- updated relationship
