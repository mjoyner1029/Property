from datetime import datetime
from ..extensions import db  # Changed from src.extensions to relative import

class Lease(db.Model):
    __tablename__ = 'leases'
    
    id = db.Column(db.Integer, primary_key=True)
    landlord_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    tenant_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'))
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    rent_amount = db.Column(db.Float, nullable=False)
    security_deposit = db.Column(db.Float, nullable=False)
    payment_day = db.Column(db.Integer, default=1)  # Day of month when rent is due
    rent_cycle = db.Column(db.String(20), default='monthly')  # monthly, weekly, etc.
    terms = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, active, terminated, expired, rejected
    rejection_reason = db.Column(db.Text)
    termination_reason = db.Column(db.Text)
    is_renewal = db.Column(db.Boolean, default=False)
    previous_lease_id = db.Column(db.Integer, db.ForeignKey('leases.id'))
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    accepted_at = db.Column(db.DateTime)
    terminated_at = db.Column(db.DateTime)
    
    # Relationships
    landlord = db.relationship('User', foreign_keys=[landlord_id])
    tenant = db.relationship('User', foreign_keys=[tenant_id])
    property = db.relationship('Property')
    unit = db.relationship('Unit')
    previous_lease = db.relationship('Lease', remote_side=[id])
    
    def __repr__(self):
        return f"<Lease for Tenant {self.tenant_id} at Property {self.property_id}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'landlord_id': self.landlord_id,
            'tenant_id': self.tenant_id,
            'property_id': self.property_id,
            'unit_id': self.unit_id,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'rent_amount': self.rent_amount,
            'security_deposit': self.security_deposit,
            'terms': self.terms,
            'status': self.status,
            'rejection_reason': self.rejection_reason,
            'termination_reason': self.termination_reason,
            'is_renewal': self.is_renewal,
            'previous_lease_id': self.previous_lease_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'accepted_at': self.accepted_at.isoformat() if self.accepted_at else None,
            'terminated_at': self.terminated_at.isoformat() if self.terminated_at else None
        }
