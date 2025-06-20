from ..extensions import db

class TenantProfile(db.Model):
    __tablename__ = "tenant_profiles"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey("properties.id"))
    unit = db.Column(db.String(50))
    lease_start = db.Column(db.Date)
    lease_end = db.Column(db.Date)
    monthly_rent = db.Column(db.Numeric(10, 2))
    emergency_contact = db.Column(db.String(100))

    user = db.relationship("User", backref=db.backref("tenant_profile", uselist=False))
    property = db.relationship("Property", backref="tenants")
