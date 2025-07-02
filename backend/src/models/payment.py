from src.extensions import db
from src.models.tenant_profile import TenantProfile

class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey("tenant_profiles.id"), nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default="pending")  # or 'paid', 'failed'
    due_date = db.Column(db.Date)
    paid_date = db.Column(db.Date)

    tenant = db.relationship("TenantProfile", backref="payments")

    def __repr__(self):
        return f"<Payment id={self.id} tenant_id={self.tenant_id} status={self.status}>"
