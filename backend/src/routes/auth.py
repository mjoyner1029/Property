# backend/src/routes/auth.py

from flask import Blueprint, request, jsonify
from src.models.user import User
from src.extensions import db
from src.utils.jwt import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from src.utils.validation import (
    is_valid_email,
    is_strong_password
)

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@bp.route("/signup", methods=["POST"])
def signup():
    print("HEADERS:", dict(request.headers))
    print("JSON BODY:", request.get_json())

    data = request.get_json()
    required_fields = ["email", "password", "role", "full_name", "tos_agreed"]
    if not data or not all(field in data for field in required_fields):
        return jsonify({"msg": "Missing required signup fields"}), 400

    email = data["email"].lower().strip()
    password = data["password"]
    role = data["role"]
    full_name = data["full_name"].strip()
    tos_agreed = data["tos_agreed"]

    if not is_valid_email(email):
        return jsonify({"msg": "Invalid email format"}), 400

    if not is_strong_password(password):
        return jsonify({"msg": "Password not strong enough"}), 400

    if not tos_agreed:
        return jsonify({"msg": "You must agree to the Terms of Service"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "Email already registered"}), 400

    user = User(email=email, role=role, full_name=full_name)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({"msg": "User created", "user_id": user.id, "role": role}), 201


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not all(key in data for key in ["email", "password"]):
        return jsonify({"msg": "Missing credentials"}), 400

    email = data["email"].lower().strip()
    user = User.query.filter_by(email=email).first()

    if user and user.check_password(data["password"]):
        token = create_access_token(identity={"id": user.id, "role": user.role})
        return jsonify({
            "access_token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "full_name": user.full_name
            }
        }), 200

    return jsonify({"msg": "Invalid credentials"}), 401
