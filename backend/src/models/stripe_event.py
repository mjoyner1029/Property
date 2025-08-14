# backend/src/models/stripe_event.py

from datetime import datetime
from ..extensions import db

class StripeEvent(db.Model):
    """
    Model to track processed Stripe webhook events for idempotency
    """
    __tablename__ = 'stripe_events'
    
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.String(255), unique=True, nullable=False)
    event_type = db.Column(db.String(255), nullable=False)
    api_version = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed_at = db.Column(db.DateTime, default=datetime.utcnow)
    payload = db.Column(db.Text, nullable=True)  # Optional: store full payload for debugging
    
    def __repr__(self):
        return f"<StripeEvent {self.event_id} ({self.event_type})>"
