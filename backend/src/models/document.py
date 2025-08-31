from datetime import datetime
from ..extensions import db

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'))
    maintenance_request_id = db.Column(db.Integer, db.ForeignKey('maintenance_requests.id'))
    document_type = db.Column(db.String(50), nullable=False)  # lease, receipt, maintenance, id_proof
    title = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(255), nullable=False, default="")  # Added name field
    file_path = db.Column(db.String(255), nullable=False)
    file_name = db.Column(db.String(255))  # Added file_name field
    original_name = db.Column(db.String(255))  # Added original_name field
    file_type = db.Column(db.String(50))
    file_size = db.Column(db.Integer)  # size in bytes
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    user = db.relationship('User')
    
    def __repr__(self):
        return f"<Document {self.id}: {self.title}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'property_id': self.property_id,
            'property': {'id': self.property.id, 'name': self.property.name} if hasattr(self, 'property') and self.property else None,
            'maintenance_request_id': self.maintenance_request_id,
            'document_type': self.document_type,
            'title': self.title,
            'name': self.name,  # Added name field
            'file_path': self.file_path,
            'file_name': self.file_name,  # Added file_name field
            'original_name': self.original_name,  # Added original_name field
            'file_type': self.file_type,
            'file_size': self.file_size,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }