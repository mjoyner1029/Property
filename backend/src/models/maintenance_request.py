from datetime import datetime
from ..extensions import db  # Use relative import for consistency

class MaintenanceRequest(db.Model):
    __tablename__ = 'maintenance_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'))
    tenant_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    landlord_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    maintenance_type = db.Column(db.String(100))  # Type of maintenance (plumbing, electrical, etc.)
    priority = db.Column(db.String(20), default='medium')  # low, medium, high, emergency
    status = db.Column(db.String(20), default='open')  # open, in_progress, completed, cancelled
    assigned_to = db.Column(db.Integer, db.ForeignKey('user.id'))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    requester = db.relationship('User', foreign_keys=[tenant_id])
    landlord = db.relationship('User', foreign_keys=[landlord_id])
    assignee = db.relationship('User', foreign_keys=[assigned_to])
    images = db.relationship('Document', backref='maintenance_request', lazy=True)
    
    def __repr__(self):
        return f"<MaintenanceRequest {self.id}: {self.title} ({self.status})>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'property_id': self.property_id,
            'property': {'id': self.property.id, 'name': self.property.name} if hasattr(self, 'property') and self.property else None,
            'unit_id': self.unit_id,
            'tenant_id': self.tenant_id,
            'landlord_id': self.landlord_id,
            'title': self.title,
            'description': self.description,
            'maintenance_type': self.maintenance_type,
            'priority': self.priority,
            'status': self.status,
            'assigned_to': self.assigned_to,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
