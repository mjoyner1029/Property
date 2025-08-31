from datetime import datetime
from ..extensions import db

class MessageThread(db.Model):
    __tablename__ = 'message_threads'
    
    id = db.Column(db.Integer, primary_key=True)
    user1_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user2_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject = db.Column(db.String(255), nullable=False, default="")  # Added subject field
    created_by = db.Column(db.Integer, nullable=True)  # Added created_by field
    participants = db.Column(db.JSON, nullable=True)  # Added participants field
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    user1 = db.relationship('User', foreign_keys=[user1_id])
    user2 = db.relationship('User', foreign_keys=[user2_id])
    # Remove the invalid relationship that's causing the error
    # messages = db.relationship('Message', backref='thread', lazy=True, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<MessageThread {self.id} between User {self.user1_id} and User {self.user2_id}>"
    
    def to_dict(self):
        """Convert thread to dictionary with all required fields for tests and frontend."""
        return {
            'id': self.id,
            'user1_id': self.user1_id,
            'user2_id': self.user2_id,
            'subject': self.subject,
            'created_by': self.created_by,
            'participants': self.participants,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }