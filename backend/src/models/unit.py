from datetime import datetime
from ..extensions import db

class Unit(db.Model):
    __tablename__ = 'units'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    unit_number = db.Column(db.String(20), nullable=False)
    size = db.Column(db.Integer)  # square feet
    bedrooms = db.Column(db.Integer)
    bathrooms = db.Column(db.Float)
    floor = db.Column(db.Integer)
    rent_amount = db.Column(db.Float)
    description = db.Column(db.Text)
    features = db.Column(db.Text)
    status = db.Column(db.String(20), default='available')  # available, occupied, maintenance
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    tenant_properties = db.relationship('TenantProperty', backref='unit', lazy=True)
    
    def __repr__(self):
        return f"<Unit {self.unit_number} at Property {self.property_id}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'property_id': self.property_id,
            'unit_number': self.unit_number,
            'size': self.size,
            'bedrooms': self.bedrooms,
            'bathrooms': self.bathrooms,
            'floor': self.floor,
            'rent_amount': self.rent_amount,
            'description': self.description,
            'features': self.features,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }