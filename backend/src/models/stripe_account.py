from datetime import datetime
from ..extensions import db  # Changed from src.extensions to relative import

class StripeAccount(db.Model):
    __tablename__ = 'stripe_accounts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    customer_id = db.Column(db.String(100))  # Stripe customer ID for tenants
    account_id = db.Column(db.String(100))   # Stripe connect account ID for landlords
    default_payment_method = db.Column(db.String(100))
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationship
    user = db.relationship('User')
    
    def __repr__(self):
        return f"<StripeAccount for User {self.user_id}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'customer_id': self.customer_id,
            'account_id': self.account_id,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
