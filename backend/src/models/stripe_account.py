from ..extensions import db

class StripeAccount(db.Model):
    __tablename__ = "stripe_accounts"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    stripe_id = db.Column(db.String(100), nullable=False)
    account_type = db.Column(db.String(20))  # e.g., 'standard', 'express'

    user = db.relationship("User", backref=db.backref("stripe_account", uselist=False))
