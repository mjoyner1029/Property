from datetime import datetime
from ..extensions import db

class Invoice(db.Model):
    __tablename__ = 'invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    landlord_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'))
    amount = db.Column(db.Float, nullable=False)
    due_date = db.Column(db.DateTime, nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, paid, overdue, cancelled
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    paid_at = db.Column(db.DateTime)
    
    # Relationships
    tenant = db.relationship('User', foreign_keys=[tenant_id])
    landlord = db.relationship('User', foreign_keys=[landlord_id])
    property = db.relationship('Property')
    unit = db.relationship('Unit')
    payments = db.relationship('Payment', backref='invoice', lazy=True)
    
    def __repr__(self):
        return f"<Invoice {self.id} for ${self.amount} due {self.due_date}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'tenant_id': self.tenant_id,
            'landlord_id': self.landlord_id,
            'property_id': self.property_id,
            'unit_id': self.unit_id,
            'amount': self.amount,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'description': self.description,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None
        }