from ..extensions import db

class Tenant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey("property.id"))
    lease_start = db.Column(db.Date)
    lease_end = db.Column(db.Date)

    user = db.relationship("User", backref="tenant_profile")
    property = db.relationship("Property", backref="tenants")
