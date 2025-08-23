# backend/src/models/user.py

from datetime import datetime
from ..extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    landlord_profile = db.relationship('LandlordProfile', back_populates='user', uselist=False)
    __tablename__ = "user"  # Table name in the database is 'user'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)  # This field name is used in the methods
    role = db.Column(db.String(20), nullable=False)  # tenant, landlord, admin
    phone = db.Column(db.String(20))
    profile_picture = db.Column(db.String(255))
    is_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(100))
    email_verified_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    last_login = db.Column(db.DateTime)
    
    def set_password(self, password):
        self.password = generate_password_hash(password)  # Changed from password_hash to password
        
    def check_password(self, password):
        return check_password_hash(self.password, password)  # Changed from password_hash to password
    
    def __repr__(self):
        return f"<User {self.id}: {self.name} ({self.role})>"
        
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'phone': self.phone,
            'profile_picture': self.profile_picture,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
