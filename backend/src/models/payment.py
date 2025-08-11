from datetime import datetime
from ..extensions import db  # Changed from src.extensions to relative import

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'))
    tenant_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    landlord_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50))  # credit_card, bank_transfer, etc.
    payment_intent_id = db.Column(db.String(100))  # Stripe payment intent ID
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed, refunded
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    tenant = db.relationship('User', foreign_keys=[tenant_id])
    landlord = db.relationship('User', foreign_keys=[landlord_id])
    
    def __repr__(self):
        return f"<Payment {self.id} for ${self.amount} ({self.status})>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'invoice_id': self.invoice_id,
            'tenant_id': self.tenant_id,
            'landlord_id': self.landlord_id,
            'amount': self.amount,
            'payment_method': self.payment_method,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
