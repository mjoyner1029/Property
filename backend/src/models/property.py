from datetime import datetime
from ..extensions import db

class Property(db.Model):
    __tablename__ = "properties"

    id = db.Column(db.Integer, primary_key=True)
    landlord_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    zip_code = db.Column(db.String(20), nullable=False)
    property_type = db.Column(db.String(50))  # house, apartment, condo, etc.
    bedrooms = db.Column(db.Integer)
    bathrooms = db.Column(db.Float)
    square_footage = db.Column(db.Integer)
    year_built = db.Column(db.Integer)
    description = db.Column(db.Text)
    amenities = db.Column(db.Text)
    status = db.Column(db.String(20), default='available')  # available, rented, maintenance
    unit_count = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    landlord = db.relationship("User", backref="properties")
    units = db.relationship('Unit', backref='property', lazy=True, cascade="all, delete-orphan")
    tenant_properties = db.relationship('TenantProperty', backref='property', lazy=True)
    maintenance_requests = db.relationship('MaintenanceRequest', backref='property', lazy=True)
    documents = db.relationship('Document', backref='property', lazy=True)
    
    def __repr__(self):
        return f"<Property id={self.id} landlord_id={self.landlord_id} name={self.name}>"
    
    @property
    def square_feet(self):
        return getattr(self, "square_footage", None)
        
    @square_feet.setter
    def square_feet(self, v):
        setattr(self, "square_footage", v)
    
    def to_dict(self):
        return {
            'id': self.id,
            'landlord_id': self.landlord_id,
            'name': self.name,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zip_code': self.zip_code,
            'property_type': self.property_type,
            'bedrooms': self.bedrooms,
            'bathrooms': self.bathrooms,
            'square_footage': self.square_footage,
            'square_feet': self.square_footage,  # Add alias for API compatibility
            'year_built': self.year_built,
            'description': self.description,
            'amenities': self.amenities,
            'status': self.status,
            'unit_count': self.unit_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
