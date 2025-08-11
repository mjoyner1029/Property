# backend/src/routes/auth.py

"""
Authentication routes for user login, registration, and token management.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required, get_jwt_identity
)
from datetime import datetime, timedelta
import bcrypt

from ..models.user import User
from ..extensions import db
from ..utils.validators import validate_email, validate_password
from ..utils.email_service import send_welcome_email
from ..utils.rate_limit import rate_limit

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@bp.route("/verify", methods=["GET"])
@jwt_required()
def verify_token():
    """
    Verify that the JWT token is valid and return user info.
    
    Returns:
        User details
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if not user.is_active:
        return jsonify({"error": "Account is inactive"}), 403
    
    return jsonify({
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name
        },
        "isAuthenticated": True
    }), 200

@bp.route("/login", methods=["POST"])
@rate_limit(limit=10, period=300)  # 10 attempts per 5 minutes
def login():
    """
    Log in a user with email and password.
    
    Returns:
        JWT access token, refresh token, and user details
    """
    data = request.json
    
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400
    
    user = User.query.filter_by(email=data.get("email")).first()
    
    if not user or not user.check_password(data.get("password")):
        return jsonify({"error": "Invalid email or password"}), 401
    
    # Check if the user is active
    if not user.is_active:
        return jsonify({"error": "Account is inactive. Please contact support."}), 403
    
    # Get selected portal if provided
    portal = data.get("portal", user.role)
    
    # Create tokens
    access_token = create_access_token(
        identity=str(user.id), 
        additional_claims={"role": user.role, "portal": portal}
    )
    refresh_token = create_refresh_token(identity=user.id)
    
    # Update last login timestamp
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict()
    }), 200