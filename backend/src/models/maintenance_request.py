from src.extensions import db
from src.models.tenant_profile import TenantProfile

class MaintenanceRequest(db.Model):
    __tablename__ = "maintenance_requests"

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey("tenant_profiles.id"), nullable=False, index=True)
    property_id = db.Column(db.Integer, db.ForeignKey("properties.id"), nullable=True, index=True)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default="open")  # open, in progress, closed
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    tenant = db.relationship("TenantProfile", backref="maintenance_requests")
    # Optionally, add property relationship if needed:
    # property = db.relationship("Property", backref="maintenance_requests")

    def __repr__(self):
        return f"<MaintenanceRequest id={self.id} tenant_id={self.tenant_id} status={self.status}>"
