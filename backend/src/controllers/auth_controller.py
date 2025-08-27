import logging
import secrets
import os
from datetime import datetime, timedelta

# Fix imports from absolute to relative paths
from ..models.user import User
from ..extensions import db, mail
from werkzeug.security import generate_password_hash, check_password_hash
from ..utils.jwt import create_access_token
from ..utils.validators import validate_email_format, validate_password_strength
from ..utils.account_security import track_failed_login, check_account_lockout, reset_login_attempts
from flask import current_app, url_for, request
from flask_mail import Message

logger = logging.getLogger(__name__)

def register_user(email, password, role, full_name):
    """Register a new user in the Asset Anchor system."""
    # Input validation
    if not validate_email_format(email):
        return {"error": "Invalid email format"}, 400
        
    if not validate_password_strength(password):
        return {"error": "Password does not meet requirements"}, 400

    if User.query.filter_by(email=email).first():
        logger.warning(f"Registration attempt with existing email: {email}")
        return {"error": "Email already exists"}, 400

    user = User(email=email, role=role, full_name=full_name, is_verified=False, is_active=True)
    user.set_password(password)
    db.session.add(user)
    
    try:
        db.session.commit()
        logger.info(f"New user registered: {email}, role: {role}")
        return {"message": "User registered successfully"}, 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to register user: {str(e)}")
        return {"error": "Registration failed"}, 500

def authenticate_user(email, password):
    """Authenticate a user and return an access token."""
    # Check for account lockout
    lockout_status = check_account_lockout(email)
    if lockout_status['locked']:
        unlock_time = lockout_status.get('unlock_time')
        minutes_left = round((unlock_time - datetime.utcnow()).total_seconds() / 60)
        logger.warning(f"Login attempt for locked account: {email}")
        return {
            "error": f"Account is temporarily locked. Please try again in {minutes_left} minutes.",
            "locked": True,
            "unlock_time": unlock_time.isoformat() if unlock_time else None
        }, 403
    
    # Check credentials
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        # Track failed attempt
        ip_address = request.remote_addr
        track_status = track_failed_login(email, ip_address)
        
        # Return different message if this attempt triggered a lockout
        if track_status.get('locked', False):
            minutes = current_app.config.get('ACCOUNT_LOCKOUT_MINUTES', 15)
            return {
                "error": f"Too many failed attempts. Account locked for {minutes} minutes.",
                "locked": True
            }, 403
            
        logger.warning(f"Failed login attempt for email: {email}, attempts: {track_status.get('attempts', 1)}")
        return {"error": "Invalid credentials"}, 401
        
    # Reset failed login attempts on successful login
    reset_login_attempts(email)

    if not user.is_verified:
        logger.warning(f"Login attempt with unverified email: {email}")
        return {"error": "Email not verified"}, 403

    if not user.is_active:
        logger.warning(f"Login attempt with deactivated account: {email}")
        return {"error": "Account deactivated"}, 403

    token = create_access_token(identity={"id": user.id, "role": user.role})
    logger.info(f"User authenticated successfully: {email}")
    
    return {
        "access_token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name
        }
    }, 200
def verify_email(token):
    """Verify a user's email using the token sent to their email"""
    # Stub implementation to fix the import error
    user = User.query.filter_by(verification_token=token).first()
    if not user:
        logger.warning(f"Invalid verification token used: {token}")
        return {"error": "Invalid verification token"}, 400
    
    user.is_verified = True
    user.verification_token = None
    db.session.commit()
    logger.info(f"User verified email successfully: {user.email}")
    
    return {"message": "Email verified successfully"}, 200


def resend_verification(email):
    """Resend verification email to user"""
    # Stub implementation to fix the import error
    user = User.query.filter_by(email=email).first()
    if not user:
        # Don't reveal that email doesn't exist (security)
        return {"message": "If the email exists, a verification link has been sent"}, 200
    
    if user.is_verified:
        return {"message": "Email is already verified"}, 200
    
    # Generate new verification token
    user.verification_token = secrets.token_urlsafe(32)
    db.session.commit()
    
    # Send email with token
    try:
        _send_verification_email(user)
        return {"message": "Verification email sent"}, 200
    except Exception as e:
        logger.error(f"Failed to send verification email: {str(e)}")
        return {"error": "Failed to send verification email"}, 500


def _send_verification_email(user):
    """Send verification email to user"""
    # Use configuration-based frontend URL for verification link
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
    verification_link = f"{frontend_url}/verify-email?token={user.verification_token}"
    
    msg = Message(
        "Asset Anchor - Verify Your Email",
        recipients=[user.email],
        body=f"Hello {user.full_name},\n\n"
             f"Please verify your email by clicking on this link: {verification_link}\n\n"
             f"This link will expire in 24 hours.\n\n"
             f"If you did not sign up for Asset Anchor, please ignore this email.\n\n"
             f"Best regards,\n"
             f"The Asset Anchor Team"
    )
    mail.send(msg)
    logger.info(f"Verification email sent to: {user.email}")
