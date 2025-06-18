from ..models.property import Property
from ..extensions import db


def get_all_properties():
    props = Property.query.all()
    return [{
        "id": p.id,
        "name": p.name,
        "address": p.address,
        "city": p.city,
        "state": p.state,
        "zip_code": p.zip_code
    } for p in props]


def create_property(data):
    prop = Property(
        landlord_id=data["landlord_id"],
        name=data["name"],
        address=data["address"],
        city=data["city"],
        state=data["state"],
        zip_code=data["zip_code"]
    )
    db.session.add(prop)
    db.session.commit()
    return {"message": "Property created"}, 201
