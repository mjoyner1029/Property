from src.extensions import db

class LandlordProfile(db.Model):
    __tablename__ = "landlord_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=False)
    company_name = db.Column(db.String(100))
    stripe_account_id = db.Column(db.String(100))

    user = db.relationship("User", backref=db.backref("landlord_profile", uselist=False))

    def __repr__(self):
        return f"<LandlordProfile id={self.id} user_id={self.user_id}>"
