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
    resource_type = db.Column(db.String(50))  # invoice, maintenance_request, message, etc.
    resource_id = db.Column(db.Integer)  # ID of the related resource
    created_at = db.Column(db.DateTime, default=datetime.now)
    read_at = db.Column(db.DateTime)
    
    def __repr__(self):
        return f"<Notification {self.id} for User {self.user_id}: {self.title}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'read': self.read,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None
        }