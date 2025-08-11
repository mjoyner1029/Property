"""
Model for participants in messaging conversations.
"""
from ..extensions import db
from datetime import datetime

class ConversationParticipant(db.Model):
    __tablename__ = 'conversation_participants'
    
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role = db.Column(db.String(20), default='member')  # admin, member
    last_read_at = db.Column(db.DateTime, nullable=True)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    conversation = db.relationship('Conversation', back_populates='participants')
    user = db.relationship('User', backref=db.backref('conversation_participations', lazy=True))
    
    __table_args__ = (
        db.UniqueConstraint('conversation_id', 'user_id', name='uq_participant_conversation'),
    )
    
    def __repr__(self):
        return f'<ConversationParticipant {self.id} - User {self.user_id} in Conversation {self.conversation_id}>'
    
    def to_dict(self):
        """Convert participant to dictionary."""
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'user_id': self.user_id,
            'role': self.role,
            'last_read_at': self.last_read_at.isoformat() if self.last_read_at else None,
            'joined_at': self.joined_at.isoformat(),
            'user': self.user.to_dict(minimal=True) if self.user else None
        }