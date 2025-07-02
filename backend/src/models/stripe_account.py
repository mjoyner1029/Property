from src.extensions import db

class StripeAccount(db.Model):
    __tablename__ = "stripe_accounts"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), unique=True, nullable=False, index=True)
    stripe_id = db.Column(db.String(100), nullable=False)
    account_type = db.Column(db.String(20))  # e.g., 'standard', 'express'

    user = db.relationship("User", backref=db.backref("stripe_account", uselist=False))

    def __repr__(self):
        return f"<StripeAccount id={self.id} user_id={self.user_id} type={self.account_type}>"
