# backend/src/routes/auth/auth_routes.py

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import secrets
import string

from ...models.user import User
from ...extensions import db
from ...utils.validators import validate_email, validate_password
from ...utils.email_service import send_welcome_email

bp = Blueprint("auth_core", __name__)

@bp.route("/register", methods=["POST"])
def register():
    """
    Register a new user.
    
    Returns:
        dict: User information and tokens
    """
    data = request.json
    
    # Validate required fields
    if not all(k in data for k in ["name", "email", "password", "role"]):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Validate email format
    if not validate_email(data["email"]):
        return jsonify({"error": "Invalid email format"}), 400
    
    # Validate password strength
    if not validate_password(data["password"]):
        return jsonify({"error": "Password must be at least 8 characters long and include upper and lowercase letters, numbers, and special characters"}), 400
    
    # Validate role
    if data["role"] not in ["tenant", "landlord"]:
        return jsonify({"error": "Invalid role. Must be 'tenant' or 'landlord'"}), 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=data["email"]).first()
    if existing_user:
        return jsonify({"error": "Email already registered"}), 409
    
    # Generate verification token
    verification_token = ''.join(
        secrets.choice(string.ascii_letters + string.digits)
        for _ in range(64)
    )
    
    # Create new user
    new_user = User(
        name=data["name"],
        email=data["email"],
        role=data["role"],
        verification_token=verification_token,
        is_verified=False
    )
    new_user.set_password(data["password"])
    
    db.session.add(new_user)
    db.session.commit()
    
    # Send verification email
    try:
        send_welcome_email(new_user, verification_token)
    except Exception as e:
        current_app.logger.error(f"Failed to send welcome email: {str(e)}")
    
    # Generate tokens
    access_token = create_access_token(
        identity=new_user.id,
        additional_claims={"role": new_user.role}
    )
    refresh_token = create_refresh_token(identity=new_user.id)
    
    return jsonify({
        "message": "User registered successfully",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": new_user.to_dict()
    }), 201

@bp.route("/login", methods=["POST"])
def login():
    """
    Log in a user with email and password.
    
    Returns:
        dict: Tokens and user information
    """
    data = request.json
    
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400
    
    # Find user by email
    user = User.query.filter_by(email=data.get("email")).first()
    
    # Validate credentials
    if not user or not user.check_password(data.get("password")):
        return jsonify({"error": "Invalid email or password"}), 401
    
    # Check if account is verified
    if not user.is_verified and current_app.config.get("REQUIRE_EMAIL_VERIFICATION", True):
        return jsonify({
            "error": "Email not verified", 
            "user_id": user.id
        }), 403
    
    # Create tokens
    access_token = create_access_token(
        identity=user.id,
        additional_claims={"role": user.role}
    )
    refresh_token = create_refresh_token(identity=user.id)
    
    # Update last login timestamp
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict(),
        "expires_in": int(current_app.config.get("JWT_ACCESS_TOKEN_EXPIRES", timedelta(minutes=15)).total_seconds())
    }), 200

@bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """
    Get the current authenticated user's details.
    
    Returns:
        dict: User information
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({"user": user.to_dict()}), 200
