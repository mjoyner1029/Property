# backend/src/routes/properties.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.extensions import db
from src.models.property import Property

bp = Blueprint("properties", __name__, url_prefix="/api/properties")

@bp.route("/", methods=["GET"])
@jwt_required()
def get_properties():
    user_id = get_jwt_identity()["id"]
    # Optionally filter by landlord or tenant role
    props = Property.query.all()
    return jsonify([{
        "id": p.id,
        "name": p.name,
        "address": p.address,
        "city": p.city,
        "state": p.state,
        "zip_code": p.zip_code,
        "landlord_id": p.landlord_id
    } for p in props])

@bp.route("/", methods=["POST"])
@jwt_required()
def add_property():
    user_id = get_jwt_identity()["id"]
    data = request.get_json()
    prop = Property(
        landlord_id=user_id,
        name=data["name"],
        address=data["address"],
        city=data["city"],
        state=data["state"],
        zip_code=data["zip_code"]
    )
    db.session.add(prop)
    db.session.commit()
    return jsonify({"msg": "Property added"}), 201
