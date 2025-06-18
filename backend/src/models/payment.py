from ..extensions import db

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey("tenant.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default="pending")  # or 'paid', 'failed'
    due_date = db.Column(db.Date)
    paid_date = db.Column(db.Date)

    tenant = db.relationship("Tenant", backref="payments")
