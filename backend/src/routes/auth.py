# backend/src/routes/auth.py

from flask import Blueprint, request, jsonify
from ..models.user import User
from ..extensions import db
from ..utils.jwt import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    if not all(key in data for key in ["email", "password", "role"]):
        return jsonify({"msg": "Missing fields"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"msg": "Email already registered"}), 400

    user = User(email=data["email"], role=data["role"])
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()

    return jsonify({"msg": "User created"}), 201

@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not all(key in data for key in ["email", "password"]):
        return jsonify({"msg": "Missing credentials"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if user and user.check_password(data["password"]):
        token = create_access_token(identity={"id": user.id, "role": user.role})
        return jsonify({
            "access_token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role
            }
        }), 200

    return jsonify({"msg": "Invalid credentials"}), 401
