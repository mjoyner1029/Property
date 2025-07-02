# backend/src/models/user.py

from src.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = "user"  # explicitly set tablename to match FK reference

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)

    # Relationship for reverse access from Property
    properties = db.relationship("Property", back_populates="landlord", cascade="all, delete")

    # Relationship for notifications
    notifications = db.relationship("Notification", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"
