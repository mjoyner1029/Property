from ..extensions import db
from datetime import datetime
import uuid

class PropertyCode(db.Model):
    __tablename__ = 'property_codes'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # Relationships
    property = db.relationship('Property', backref='property_codes')
    creator = db.relationship('User', backref='created_codes')
    
    def __init__(self, **kwargs):
        super(PropertyCode, self).__init__(**kwargs)
        if not self.code:
            self.code = self.generate_code()
    
    def __repr__(self):
        return f'<PropertyCode {self.code} for property {self.property_id}>'
    
    @staticmethod
    def generate_code():
        """Generate a random 6-character alphanumeric code"""
        return str(uuid.uuid4()).upper()[:6]
    
    def is_valid(self):
        """Check if the code is valid (active and not expired)"""
        if not self.active:
            return False
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        return True
        
    def to_dict(self):
        return {
            'id': self.id,
            'property_id': self.property_id,
            'code': self.code,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'active': self.active
        }