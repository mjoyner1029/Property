from datetime import datetime
from ..extensions import db

class LandlordProfile(db.Model):
    __tablename__ = "landlord_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=False)
    company_name = db.Column(db.String(100))
    stripe_account_id = db.Column(db.String(100))
    business_address = db.Column(db.String(255))
    business_license_number = db.Column(db.String(100))
    tax_id = db.Column(db.String(50))
    verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationship with User
    user = db.relationship("User", backref=db.backref("landlord_profile", uselist=False))

    def __repr__(self):
        return f"<LandlordProfile id={self.id} user_id={self.user_id}>"
        
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'phone': self.phone,
            'company_name': self.company_name,
            'stripe_account_id': self.stripe_account_id,
            'business_address': self.business_address,
            'business_license_number': self.business_license_number,
            'verified': self.verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
