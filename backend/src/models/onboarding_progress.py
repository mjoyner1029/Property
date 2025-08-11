from ..extensions import db
from sqlalchemy.types import JSON  # Use this import if using SQLAlchemy 1.3.0+
# For older SQLAlchemy versions or if not using PostgreSQL, use:
# from sqlalchemy.types import Text
# import json
from datetime import datetime

class OnboardingProgress(db.Model):
    __tablename__ = 'onboarding_progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    role = db.Column(db.String(20), nullable=False)  # tenant, landlord, etc.
    
    # Use JSON type if supported by your database
    steps = db.Column(JSON, nullable=False)
    
    # Alternative for databases that don't support JSON natively:
    # steps = db.Column(Text, nullable=False)
    # 
    # @property
    # def steps(self):
    #     return json.loads(self._steps) if self._steps else []
    # 
    # @steps.setter
    # def steps(self, value):
    #     self._steps = json.dumps(value)
    
    current_step = db.Column(db.String(50))  # ID of current step
    completed = db.Column(db.Boolean, default=False)  # Whether onboarding is complete
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='onboarding_progress')
    
    def __repr__(self):
        return f'<OnboardingProgress {self.id} for user {self.user_id}>'