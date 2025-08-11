from ..extensions import db
from datetime import datetime, timedelta  # Fix the timedelta import
import uuid

class Invitation(db.Model):
    __tablename__ = 'invitations'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # tenant, landlord, etc.
    invited_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=True)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=True)
    token = db.Column(db.String(255), nullable=False, unique=True)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, expired
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, default=lambda: datetime.utcnow() + timedelta(days=7))
    accepted_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    inviter = db.relationship('User', foreign_keys=[invited_by], backref='sent_invitations')
    property = db.relationship('Property', backref='invitations')
    unit = db.relationship('Unit', backref='invitations')
    
    def __init__(self, **kwargs):
        super(Invitation, self).__init__(**kwargs)
        if not self.token:
            self.token = str(uuid.uuid4())
    
    def __repr__(self):
        return f'<Invitation {self.id} to {self.email}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'role': self.role,
            'invited_by': self.invited_by,
            'property_id': self.property_id,
            'unit_id': self.unit_id,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'accepted_at': self.accepted_at.isoformat() if self.accepted_at else None
        }