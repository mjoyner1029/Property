class Lease(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    property_id = db.Column(db.Integer, db.ForeignKey("property.id"))
    unit = db.Column(db.String(20))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    rent = db.Column(db.Float)
