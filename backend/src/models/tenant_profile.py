from ..extensions import db

class TenantProfile(db.Model):
    __tablename__ = "tenant_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey("properties.id"))
    lease_start = db.Column(db.Date)
    lease_end = db.Column(db.Date)

    user = db.relationship("User", backref=db.backref("tenant_profile", uselist=False))
    property = db.relationship("Property", backref="tenant_profiles")