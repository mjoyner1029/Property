from datetime import datetime
from src.extensions import db

class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    receiver_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    property_id = db.Column(db.Integer, db.ForeignKey("properties.id"), nullable=True, index=True)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    read = db.Column(db.Boolean, default=False)

    sender = db.relationship("User", foreign_keys=[sender_id], backref="sent_messages")
    receiver = db.relationship("User", foreign_keys=[receiver_id], backref="received_messages")
    property = db.relationship("Property", backref="messages")

    def __repr__(self):
        return f"<Message id={self.id} sender_id={self.sender_id} receiver_id={self.receiver_id}>"