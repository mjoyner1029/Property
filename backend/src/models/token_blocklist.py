from datetime import datetime
from ..extensions import db

class TokenBlocklist(db.Model):
    __tablename__ = 'token_blocklist'
    
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    def __repr__(self):
        return f"<BlocklistedToken {self.jti}>"
    
    # Added to_dict method
    def to_dict(self):
        return {
            'id': self.id,
            'jti': self.jti,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }