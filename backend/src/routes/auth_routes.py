# backend/src/routes/auth_routes.py

"""
Authentication routes for user login, registration, and token management.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required, get_jwt_identity,
    get_jwt, set_access_cookies, set_refresh_cookies, unset_jwt_cookies
)
from datetime import datetime, timedelta, timezone
import bcrypt
import uuid

from ..models.user import User
from ..models.token_blocklist import TokenBlocklist
from ..extensions import db, jwt
from ..utils.validators import validate_email, validate_password
from ..utils.email_service import send_welcome_email
from ..utils.rate_limit import rate_limit

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# JWT token blocklist callback
@jwt.token_in_blocklist_loader
def check_if_token_is_revoked(jwt_header, jwt_payload):
    """
    Callback to check if a token is blocklisted (revoked).
    
    Args:
        jwt_header: JWT header
        jwt_payload: JWT payload
        
    Returns:
        bool: True if token is blocklisted, False otherwise
    """
    jti = jwt_payload["jti"]
    token = TokenBlocklist.query.filter_by(jti=jti).first()
    return token is not None

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
    
    response = jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict()
    })
    
    # Optionally set cookies for added security
    if current_app.config.get('JWT_COOKIE_SECURE', False):
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)
        
    return response, 200

@bp.route("/register", methods=["POST"])
@rate_limit(limit=5, period=3600)  # 5 registrations per hour from the same IP
def register():
    """
    Register a new user.
    
    Returns:
        JWT access token, refresh token, and user details
    """
    data = request.json
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
        
    # Required fields
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    role = data.get("role", "tenant")  # Default role is tenant
    
    # Validate required fields
    if not email or not password or not full_name:
        return jsonify({
            "error": "Email, password, and full name are required"
        }), 400
    
    # Validate email format
    if not validate_email(email):
        return jsonify({"error": "Invalid email format"}), 400
    
    # Validate password strength
    password_validation = validate_password(password)
    if not password_validation["valid"]:
        return jsonify({
            "error": f"Password is not strong enough: {password_validation['message']}"
        }), 400
    
    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409
    
    # Create new user
    user = User(
        email=email,
        full_name=full_name,
        role=role,
        is_active=True,
        email_verified=False,
        verification_token=str(uuid.uuid4())
    )
    user.set_password(password)
    
    try:
        db.session.add(user)
        db.session.commit()
        
        # Try to send welcome email
        try:
            send_welcome_email(user)
        except Exception as e:
            current_app.logger.error(f"Failed to send welcome email: {e}")
        
        # Generate tokens
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={"role": user.role}
        )
        refresh_token = create_refresh_token(identity=user.id)
        
        response = jsonify({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user.to_dict(),
            "message": "Registration successful. Please verify your email."
        })
        
        # Optionally set cookies for added security
        if current_app.config.get('JWT_COOKIE_SECURE', False):
            set_access_cookies(response, access_token)
            set_refresh_cookies(response, refresh_token)
            
        return response, 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Registration error: {e}")
        return jsonify({"error": "Registration failed. Please try again."}), 500

@bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh the JWT access token using a valid refresh token.
    
    Returns:
        New access token
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_active:
        return jsonify({"error": "User inactive or not found"}), 401
    
    # Create new access token
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )
    
    response = jsonify({
        "access_token": access_token,
        "user": user.to_dict()
    })
    
    # Optionally set cookies
    if current_app.config.get('JWT_COOKIE_SECURE', False):
        set_access_cookies(response, access_token)
        
    return response, 200

@bp.route("/logout", methods=["POST"])
@jwt_required(verify_type=False)
def logout():
    """
    Logout the user by blocklisting the current token.
    
    Returns:
        Success message
    """
    token = get_jwt()
    jti = token["jti"]
    ttype = token["type"]
    
    now = datetime.now(timezone.utc)
    
    # Add token to blocklist
    db.session.add(TokenBlocklist(jti=jti, type=ttype, created_at=now))
    db.session.commit()
    
    response = jsonify({"message": "Successfully logged out"})
    
    # Clear cookies if they're being used
    if current_app.config.get('JWT_COOKIE_SECURE', False):
        unset_jwt_cookies(response)
        
    return response, 200

@bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """
    Get the current user's details.
    
    Returns:
        User details
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({"user": user.to_dict()}), 200