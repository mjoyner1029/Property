from datetime import datetime
from ..extensions import db  # Changed from src.extensions to relative import

class TenantProfile(db.Model):
    __tablename__ = 'tenant_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    date_of_birth = db.Column(db.Date)
    employment_status = db.Column(db.String(50))
    employer = db.Column(db.String(100))
    annual_income = db.Column(db.Float)
    emergency_contact_name = db.Column(db.String(100))
    emergency_contact_phone = db.Column(db.String(20))
    emergency_contact_relation = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationship
    user = db.relationship('User', backref='tenant_profile', uselist=False)
    
    def __repr__(self):
        return f"<TenantProfile for User {self.user_id}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'employment_status': self.employment_status,
            'employer': self.employer,
            'annual_income': self.annual_income,
            'emergency_contact_name': self.emergency_contact_name,
            'emergency_contact_phone': self.emergency_contact_phone,
            'emergency_contact_relation': self.emergency_contact_relation,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }