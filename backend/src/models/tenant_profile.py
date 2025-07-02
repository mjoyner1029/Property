from src.extensions import db

class TenantProfile(db.Model):
    __tablename__ = "tenant_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), unique=True, nullable=False, index=True)
    property_id = db.Column(db.Integer, db.ForeignKey("properties.id"), index=True)
    lease_start = db.Column(db.Date)
    lease_end = db.Column(db.Date)

    user = db.relationship("User", backref=db.backref("tenant_profile", uselist=False))
    property = db.relationship("Property", backref="tenant_profiles")

    def __repr__(self):
        return f"<TenantProfile id={self.id} user_id={self.user_id} property_id={self.property_id}>"