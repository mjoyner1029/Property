"""
Model for messaging conversations between users.
"""
from ..extensions import db
from datetime import datetime

class Conversation(db.Model):
    __tablename__ = 'conversations'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    is_group = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', backref=db.backref('created_conversations', lazy=True))
    property = db.relationship('Property', backref=db.backref('conversations', lazy=True))
    participants = db.relationship('ConversationParticipant', back_populates='conversation')
    messages = db.relationship('Message', back_populates='conversation', order_by='Message.created_at')
    
    def __repr__(self):
        return f'<Conversation {self.id} - {self.title or "No Title"}>'
    
    def to_dict(self):
        """Convert conversation to dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'property_id': self.property_id,
            'created_by': self.created_by,
            'is_group': self.is_group,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'participants': [p.to_dict() for p in self.participants],
            'last_message': self.messages[-1].to_dict() if self.messages else None
        }