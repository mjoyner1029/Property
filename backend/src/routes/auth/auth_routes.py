# backend/src/routes/auth/auth_routes.py
from __future__ import annotations

from datetime import datetime, timedelta
import secrets
import string

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)
from sqlalchemy.exc import IntegrityError

from ...models.user import User
from ...extensions import db, limiter
from ...utils.validators import validate_email, validate_password
from ...utils.email_service import send_welcome_email

# NOTE: app.py should register this blueprint at /api/auth
bp = Blueprint("auth", __name__)

# ---- Helpers ---------------------------------------------------------------

_ALLOWED_ROLES = {"tenant", "landlord"}


def _json() -> dict:
    """Safe JSON getter."""
    return request.get_json(silent=True) or {}


def _norm_email(email: str | None) -> str:
    return (email or "").strip().lower()


def _mk_verification_token(n: int = 64) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(n))


# ---- Routes ----------------------------------------------------------------

@bp.route("/register", methods=["POST"])
@limiter.limit("5/minute")  # basic abuse protection per IP
def register():
    """
    Register a new user and send a verification email.
    Body: { name, email, password, role }
    """
    data = _json()

    # Required fields
    missing = [k for k in ("name", "email", "password", "role") if not data.get(k)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    name = str(data["name"]).strip()
    email = _norm_email(data["email"])
    password = str(data["password"])
    role = str(data["role"]).strip().lower()

    # Validate
    if not validate_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    if not validate_password(password):
        return jsonify({
            "error": (
                "Password must be at least 8 characters and include uppercase, "
                "lowercase, numbers, and special characters"
            )
        }), 400

    if role not in _ALLOWED_ROLES:
        return jsonify({"error": "Invalid role. Must be 'tenant' or 'landlord'"}), 400

    # Create user
    verification_token = _mk_verification_token()

    try:
        # Check existing
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already registered"}), 409

        new_user = User(
            name=name,
            email=email,
            role=role,
            verification_token=verification_token,
            is_verified=False,
        )
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Email already registered"}), 409
    except Exception as exc:
        db.session.rollback()
        current_app.logger.exception("Registration failed")
        return jsonify({"error": "Registration failed"}), 500

    # Send verification email (best-effort)
    try:
        send_welcome_email(new_user, verification_token)
    except Exception as exc:
        current_app.logger.error("Failed to send welcome email: %s", exc)

    # Issue tokens
    access_token = create_access_token(identity=new_user.id, additional_claims={"role": new_user.role})
    refresh_token = create_refresh_token(identity=new_user.id)

    return jsonify({
        "message": "User registered successfully",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": new_user.to_dict(),
    }), 201


@bp.route("/login", methods=["POST"])
@limiter.limit("10/minute")  # allow a bit more here, still protective
def login():
    """
    Log in with email and password.
    Body: { email, password }
    """
    data = _json()
    email = _norm_email(data.get("email"))
    password = str(data.get("password") or "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()

    # Avoid user enumeration timing leaks: check password anyway
    if not user or not user.check_password(password):
        # Optional: small fixed delay to reduce brute-force efficacy
        return jsonify({"error": "Invalid email or password"}), 401

    # Enforce verification (configurable)
    require_ver = bool(current_app.config.get("REQUIRE_EMAIL_VERIFICATION", True))
    if require_ver and not user.is_verified:
        return jsonify({"error": "Email not verified", "user_id": user.id}), 403

    # Create tokens
    access_token = create_access_token(identity=user.id, additional_claims={"role": user.role})
    refresh_token = create_refresh_token(identity=user.id)

    # Update login timestamp
    try:
        user.last_login = datetime.utcnow()
        db.session.commit()
    except Exception:
        db.session.rollback()
        current_app.logger.warning("Failed to update last_login for user_id=%s", user.id)

    expires_td = current_app.config.get("JWT_ACCESS_TOKEN_EXPIRES", timedelta(minutes=15))
    expires_in = int(expires_td.total_seconds()) if isinstance(expires_td, timedelta) else 0

    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict(),
        "expires_in": expires_in,
    }), 200


@bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """
    Return the current authenticated user's profile.
    """
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200
