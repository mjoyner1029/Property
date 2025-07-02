from src.models.property import Property
from src.extensions import db


def get_all_properties():
    props = Property.query.all()
    return [{
        "id": p.id,
        "name": p.name,
        "address": p.address,
        "city": getattr(p, "city", None),
        "state": getattr(p, "state", None),
        "zip_code": getattr(p, "zip_code", None),
        "landlord_id": p.landlord_id
    } for p in props]


def create_property(data):
    prop = Property(
        landlord_id=data["landlord_id"],
        name=data["name"],
        address=data["address"],
        city=data.get("city"),
        state=data.get("state"),
        zip_code=data.get("zip_code")
    )
    db.session.add(prop)
    db.session.commit()
    return {"message": "Property created"}, 201
