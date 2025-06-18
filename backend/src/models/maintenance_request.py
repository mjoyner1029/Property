from ..extensions import db

class MaintenanceRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey("tenant.id"))
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default="open")  # open, in progress, closed
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    tenant = db.relationship("Tenant", backref="maintenance_requests")
