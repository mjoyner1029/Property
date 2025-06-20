from . import db

class LandlordProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    company_name = db.Column(db.String(255))
    stripe_account_id = db.Column(db.String(255))
