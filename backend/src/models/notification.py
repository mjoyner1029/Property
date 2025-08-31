import json
from datetime import datetime
from ..extensions import db

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # payment, maintenance, message, system
    title = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False)
    is_read = db.Column(db.Boolean, default=False)  # Added for compatibility with tests
    property_id = db.Column(db.Integer, nullable=True)  # No ForeignKey for test compatibility
    resource_type = db.Column(db.String(50))  # invoice, maintenance_request, message, etc.
    resource_id = db.Column(db.Integer)  # ID of the related resource
    data = db.Column(db.Text)  # JSON serialized data field for additional info
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    read_at = db.Column(db.DateTime)
    
    def __repr__(self):
        return f"<Notification {self.id} for User {self.user_id}: {self.title}>"
    
    def to_dict(self):
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'is_read': self.is_read or self.read,  # Use either field
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'data': json.loads(self.data) if self.data else None
        }
        
        # Include property_id if it exists
        if self.property_id:
            result['property'] = {'id': self.property_id}
                
        return result