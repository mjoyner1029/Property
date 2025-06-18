from ..extensions import db

class Property(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    zip_code = db.Column(db.String(20))
    landlord_id = db.Column(db.Integer, db.ForeignKey("user.id"))

    landlord = db.relationship("User", backref="properties")
