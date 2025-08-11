"""
Bank account model for storing financial account information.
"""
from ..extensions import db
from datetime import datetime

class BankAccount(db.Model):
    __tablename__ = 'bank_accounts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    account_name = db.Column(db.String(100), nullable=False)
    account_type = db.Column(db.String(20), nullable=False)  # checking, savings, etc.
    institution_name = db.Column(db.String(100), nullable=False)
    last_four = db.Column(db.String(4), nullable=True)
    is_default = db.Column(db.Boolean, default=False)
    is_verified = db.Column(db.Boolean, default=False)
    verified_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending, active, error, disabled
    error_type = db.Column(db.String(50), nullable=True)
    error_code = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    # Plaid specific fields
    plaid_item_id = db.Column(db.String(100), nullable=True, unique=True)
    plaid_account_id = db.Column(db.String(100), nullable=True)
    access_token = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('bank_accounts', lazy='dynamic'))
    
    def __repr__(self):
        return f'<BankAccount {self.id} {self.account_type} for user {self.user_id}>'
    
    def to_dict(self):
        """Convert bank account to dictionary."""
        return {
            'id': self.id,
            'account_name': self.account_name,
            'account_type': self.account_type,
            'institution_name': self.institution_name,
            'last_four': self.last_four,
            'is_default': self.is_default,
            'is_verified': self.is_verified,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }