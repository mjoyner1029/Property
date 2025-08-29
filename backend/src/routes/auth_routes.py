# backend/src/routes/auth_routes.py

"""
Authentication routes for user login, registration, refresh, logout, and profile.
Applied rate limits use Flask-Limiter directly to ensure they bind to view functions.
"""

from datetime import datetime, timezone
import uuid

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from ..extensions import db, jwt, limiter
from ..models.user import User
from ..models.token_blocklist import TokenBlocklist
from ..utils.validators import validate_email, validate_password
from ..utils.email_service import send_welcome_email

bp = Blueprint("auth", __name__)  # prefix applied in app.register_blueprint(...)


# JWT blocklist callback
@jwt.token_in_blocklist_loader
def _check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload.get("jti")
    if not jti:
        return True
    return db.session.query(TokenBlocklist.id).filter_by(jti=jti).first() is not None


@bp.get("/verify")
@jwt_required()
@limiter.limit("30 per minute")
def verify_token():
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
            "full_name": user.full_name,
        },
        "isAuthenticated": True
    }), 200


@bp.post("/login")
@limiter.limit("10 per 5 minutes; 100 per hour")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""
    portal = data.get("portal")  # optional
    mfa_code = data.get("mfa_code")  # Optional MFA code

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # Check for account lockout status
    from ..utils.account_security import check_account_lockout
    lockout_status = check_account_lockout(email)
    if lockout_status.get('locked', False):
        unlock_time = lockout_status.get('unlock_time')
        # Make sure we're comparing UTC datetime objects
        if unlock_time:
            # If unlock_time is naive, make it timezone-aware
            if unlock_time.tzinfo is None:
                unlock_time = unlock_time.replace(tzinfo=timezone.utc)
            now_utc = datetime.now(timezone.utc)
            minutes_left = round((unlock_time - now_utc).total_seconds() / 60)
            return jsonify({
                "error": f"Account is temporarily locked. Please try again in {minutes_left} minutes.",
                "locked": True,
                "unlock_time": unlock_time.isoformat()
            }), 403
        else:
            # Fallback if no unlock time is provided
            return jsonify({
                "error": "Account is temporarily locked. Please try again later.",
                "locked": True
            }), 403

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        # Track failed attempt
        from ..utils.account_security import track_failed_login
        track_status = track_failed_login(email, request.remote_addr)
        
        # Return different message if this attempt triggered a lockout
        if track_status.get('locked', False):
            minutes = current_app.config.get('ACCOUNT_LOCKOUT_MINUTES', 15)
            return jsonify({
                "error": f"Too many failed attempts. Account locked for {minutes} minutes.",
                "locked": True
            }), 403
            
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Account is inactive. Please contact support."}), 403
        
    # Check if MFA is enabled and handle verification
    if user.mfa_enabled:
        # If no MFA code provided, return a challenge response
        if not mfa_code:
            return jsonify({
                "mfa_required": True,
                "email": user.email,
                "message": "MFA verification required"
            }), 200
        
        # If MFA code is provided, verify it
        from ..utils.mfa import MFAManager
        mfa_manager = MFAManager(current_app)
        
        if not mfa_manager.verify_totp(user.mfa_secret, mfa_code):
            # Check if it's a backup code
            if user.mfa_backup_codes:
                success, updated_codes = mfa_manager.verify_backup_code(user.mfa_backup_codes, mfa_code)
                if success:
                    user.mfa_backup_codes = updated_codes
                    db.session.commit()
                else:
                    return jsonify({"error": "Invalid MFA code"}), 401
            else:
                return jsonify({"error": "Invalid MFA code"}), 401
    
    # Reset any failed login attempts
    from ..utils.account_security import reset_login_attempts
    reset_login_attempts(email)
    
    # Generate tokens
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "portal": portal or user.role},
    )
    refresh_token = create_refresh_token(identity=str(user.id))

    # Update last login timestamp
    user.last_login = datetime.now(timezone.utc)
    db.session.commit()

    # Get token expiry
    jwt_config = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 3600)
    expires_in = jwt_config.total_seconds() if hasattr(jwt_config, 'total_seconds') else int(jwt_config)

    response = jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict(),
        "expires_in": expires_in,
    })

    # Optionally set HttpOnly cookies if configured
    if current_app.config.get('JWT_COOKIE_SECURE', False):
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)

    return response, 200


@bp.post("/register")
@limiter.limit("5 per hour")
def register():
    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""
    # Handle both name and full_name for backward compatibility
    name = data.get("name") or data.get("full_name") or ""
    if isinstance(name, str):
        name = name.strip()
    role = (data.get("role") or "tenant").strip()

    if not email or not password or not name:
        return jsonify({"error": "Email, password, and name are required"}), 400

    if not validate_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    # The password validation function returns a tuple (is_valid, message)
    is_valid, pwd_message = validate_password(password)
    if not is_valid:
        return jsonify({"error": f"Password is not strong enough: {pwd_message}" }), 400

    # Validate role
    allowed_roles = ["tenant", "landlord"]
    if role not in allowed_roles:
        return jsonify({"error": f"Invalid role. Must be one of: {', '.join(allowed_roles)}"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(
        email=email,
        name=name,
        role=role,
        is_verified=False,  # Using is_verified based on the User model
        verification_token=str(uuid.uuid4()),
    )
    user.set_password(password)

    try:
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception("Registration DB error")
        return jsonify({"error": "Registration failed. Please try again."}), 500

    # Best-effort welcome email
    try:
        send_welcome_email(user)
    except Exception:
        current_app.logger.exception("Failed to send welcome email")

    access_token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    refresh_token = create_refresh_token(identity=str(user.id))

    response = jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict(),
        "message": "Registration successful. Please verify your email.",
    })

    if current_app.config.get('JWT_COOKIE_SECURE', False):
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)

    return response, 201


@bp.post("/refresh")
@jwt_required(refresh=True)
@limiter.limit("60 per hour")
def refresh():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or not user.is_active:
        return jsonify({"error": "User inactive or not found"}), 401

    access_token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})

    response = jsonify({"access_token": access_token, "user": user.to_dict()})
    if current_app.config.get('JWT_COOKIE_SECURE', False):
        set_access_cookies(response, access_token)
    return response, 200


@bp.post("/logout")
@jwt_required(verify_type=False)
@limiter.limit("30 per hour")
def logout():
    token = get_jwt()
    jti = token.get("jti")
    ttype = token.get("type")
    if not jti or not ttype:
        return jsonify({"message": "Already logged out"}), 200

    now = datetime.now(timezone.utc)
    db.session.add(TokenBlocklist(jti=jti, type=ttype, created_at=now))
    db.session.commit()

    response = jsonify({"message": "Successfully logged out"})
    if current_app.config.get('JWT_COOKIE_SECURE', False):
        unset_jwt_cookies(response)
    return response, 200


@bp.get("/me")
@jwt_required()
@limiter.limit("60 per minute")
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200
