# backend/src/models/property.py

from src.extensions import db

class Property(db.Model):
    __tablename__ = "properties"

    id = db.Column(db.Integer, primary_key=True)
    landlord_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    unit_count = db.Column(db.Integer)

    # Relationship for access to User (landlord)
    landlord = db.relationship("User", back_populates="properties")

    def __repr__(self):
        return f"<Property id={self.id} landlord_id={self.landlord_id} name={self.name}>"
