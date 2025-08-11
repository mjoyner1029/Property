"""
Model for tenant relationships between users and properties.
"""
from ..extensions import db
from datetime import datetime

class Tenant(db.Model):
    __tablename__ = 'tenants'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=True)
    lease_id = db.Column(db.Integer, db.ForeignKey('leases.id'), nullable=True)
    status = db.Column(db.String(20), default='active')  # active, past, inactive
    move_in_date = db.Column(db.Date, nullable=True)
    move_out_date = db.Column(db.Date, nullable=True)
    rent_amount = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('tenant_relationships', lazy=True))
    property = db.relationship('Property', backref=db.backref('tenants', lazy=True))
    unit = db.relationship('Unit', backref=db.backref('tenants', lazy=True))
    lease = db.relationship('Lease', backref=db.backref('tenants', lazy=True))
    
    def __repr__(self):
        return f'<Tenant {self.id} - User {self.user_id} at Property {self.property_id}>'
    
    def to_dict(self):
        """Convert tenant to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'property_id': self.property_id,
            'unit_id': self.unit_id,
            'lease_id': self.lease_id,
            'status': self.status,
            'move_in_date': self.move_in_date.isoformat() if self.move_in_date else None,
            'move_out_date': self.move_out_date.isoformat() if self.move_out_date else None,
            'rent_amount': self.rent_amount,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }