# backend/src/routes/auth.py

from flask import Blueprint, request, jsonify, current_app
from src.models.user import User
from src.extensions import db
from src.utils.jwt import create_access_token
from src.utils.validation import is_valid_email, is_strong_password
from src.utils.email import send_verification_email, send_reset_email
from werkzeug.security import generate_password_hash
import logging

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

    user = User(email=email, role=role, full_name=full_name, is_verified=False)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    try:
        send_verification_email(user)
        current_app.logger.info(f"Verification email sent to {email}")
    except Exception as e:
        current_app.logger.error(f"Failed to send verification email: {e}")

    return jsonify({"msg": "User created. Please verify your email.", "user_id": user.id, "role": role}), 201


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not all(key in data for key in ["email", "password"]):
        return jsonify({"msg": "Missing credentials"}), 400

    email = data["email"].lower().strip()
    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(data["password"]):
        return jsonify({"msg": "Invalid credentials"}), 401

    if not user.is_verified:
        return jsonify({"msg": "Email not verified"}), 403

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


@bp.route("/verify-email/<token>", methods=["GET"])
def verify_email(token):
    user = User.verify_verification_token(token)
    if not user:
        return jsonify({"msg": "Invalid or expired verification link."}), 400

    user.is_verified = True
    db.session.commit()
    current_app.logger.info(f"User {user.email} verified their email.")
    return jsonify({"msg": "Email verified successfully."}), 200


@bp.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    if user:
        send_reset_email(user)  # Implement this utility
    return jsonify({"message": "If your email exists, a reset link was sent."}), 200


@bp.route('/auth/reset-password/<token>', methods=['POST'])
def reset_password(token):
    user = User.verify_reset_token(token)
    if not user:
        return jsonify({"error": "Invalid or expired token"}), 400
    data = request.get_json()
    user.password = generate_password_hash(data.get('password'))
    db.session.commit()
    return jsonify({"message": "Password reset successful."}), 200


@bp.route('/auth/resend-verification', methods=['POST'])
def resend_verification():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    if user and not user.is_verified:
        send_verification_email(user)  # Implement this utility
    return jsonify({"message": "If your email exists, a verification link was sent."}), 200
