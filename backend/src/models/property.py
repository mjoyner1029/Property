# backend/src/models/property.py

from src.extensions import db

class Property(db.Model):
    __tablename__ = "properties"

    id = db.Column(db.Integer, primary_key=True)
    landlord_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    unit_count = db.Column(db.Integer)

    # Relationship for access to User (landlord)
    landlord = db.relationship("User", back_populates="properties")
