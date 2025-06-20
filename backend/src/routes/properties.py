# backend/src/routes/properties.py
from flask import Blueprint, request, jsonify
from src.extensions import db
from src.models.property import Property

bp = Blueprint("properties", __name__, url_prefix="/api/properties")

@bp.route("/", methods=["GET"])
def get_properties():
    props = Property.query.all()
    return jsonify([{
        "id": p.id,
        "name": p.name,
        "address": p.address,
        "city": p.city,
        "state": p.state,
        "zip_code": p.zip_code
    } for p in props])

@bp.route("/", methods=["POST"])
def add_property():
    data = request.get_json()
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
    return jsonify({"msg": "Property added"}), 201
