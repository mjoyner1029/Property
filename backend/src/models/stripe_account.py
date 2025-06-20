class StripeAccount(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    stripe_id = db.Column(db.String(255))
    account_type = db.Column(db.String(50))
