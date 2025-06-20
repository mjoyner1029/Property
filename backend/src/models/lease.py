from ..extensions import db

class Lease(db.Model):
    __tablename__ = "leases"
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey("properties.id"), nullable=False)
    unit = db.Column(db.String(50), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    rent = db.Column(db.Numeric(10, 2), nullable=False)

    tenant = db.relationship("User", backref="leases")
    property = db.relationship("Property", backref="leases")
