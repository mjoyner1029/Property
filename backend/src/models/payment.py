from datetime import datetime
from ..extensions import db

class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'))
    tenant_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    landlord_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    amount_cents = db.Column(db.Integer, nullable=True)  # new
    currency = db.Column(db.String(3), nullable=True)    # new, e.g. 'usd'
    payment_method = db.Column(db.String(50))  # credit_card, bank_transfer, etc.
    payment_intent_id = db.Column(db.String(100), index=True)  # Stripe PI id
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed, refunded
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    tenant = db.relationship('User', foreign_keys=[tenant_id])
    landlord = db.relationship('User', foreign_keys=[landlord_id])
    
    def __repr__(self):
        return f"<Payment {self.id} cents={self.amount_cents} {self.currency} status={self.status}>"

    def to_dict(self):
        return {
            'id': self.id,
            'invoice_id': self.invoice_id,
            'tenant_id': self.tenant_id,
            'landlord_id': self.landlord_id,
            'amount_cents': self.amount_cents,
            'currency': self.currency,
            'payment_method': self.payment_method,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }