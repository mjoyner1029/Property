"""
Model for messages in conversations.
"""
from ..extensions import db
from datetime import datetime

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    attachment_url = db.Column(db.String(255), nullable=True)
    attachment_type = db.Column(db.String(50), nullable=True)  # image, document, etc.
    room = db.Column(db.String(100), nullable=True)  # For socketio rooms
    is_system_message = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    conversation = db.relationship('Conversation', back_populates='messages')
    sender = db.relationship('User', backref=db.backref('sent_messages', lazy=True))
    
    def __repr__(self):
        return f'<Message {self.id} from User {self.sender_id} in Conversation {self.conversation_id}>'
    
    def to_dict(self):
        """Convert message to dictionary."""
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender_id': self.sender_id,
            'content': self.content,
            'attachment_url': self.attachment_url,
            'attachment_type': self.attachment_type,
            'is_system_message': self.is_system_message,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'sender': self.sender.to_dict(minimal=True) if self.sender else None
        }