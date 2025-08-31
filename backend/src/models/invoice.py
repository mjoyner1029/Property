from datetime import datetime
from ..extensions import db

class Invoice(db.Model):
    __tablename__ = "invoices"
    
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    landlord_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'))
    invoice_number = db.Column(db.String(50), nullable=True, unique=True)
    amount = db.Column(db.Float, nullable=False)
    amount_cents = db.Column(db.Integer, nullable=True)  # new
    currency = db.Column(db.String(3), nullable=True)    # new
    category = db.Column(db.String(20), nullable=True)   # rent, utilities, etc.
    due_date = db.Column(db.DateTime, nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, paid, overdue, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    paid_at = db.Column(db.DateTime)
    
    # Relationships
    tenant = db.relationship('User', foreign_keys=[tenant_id])
    landlord = db.relationship('User', foreign_keys=[landlord_id])
    property = db.relationship('Property')
    unit = db.relationship('Unit')
    payments = db.relationship('Payment', backref='invoice', lazy=True)
    
    def __repr__(self):
        return f"<Invoice {self.id} cents={self.amount_cents} {self.currency} due {self.due_date}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'tenant_id': self.tenant_id,
            'landlord_id': self.landlord_id,
            'property_id': self.property_id,
            'property': {'id': self.property.id, 'name': self.property.name} if self.property else None,
            'unit_id': self.unit_id,
            'invoice_number': self.invoice_number,
            'amount': self.amount,
            'amount_cents': self.amount_cents,
            'currency': self.currency,
            'category': self.category,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'description': self.description,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None
        }