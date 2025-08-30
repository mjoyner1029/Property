# backend/src/controllers/auth_controller.py

import secrets
from datetime import datetime, timedelta
from flask import current_app
from ..extensions import db
from ..models.user import User
from ..utils.validators import validate_password
from ..utils.email_service import send_email

def request_password_reset(email):
    """
    Handle password reset request.
    
    Args:
        email (str): User email address
        
    Returns:
        tuple: (response_dict, status_code)
    """
    if not email:
        return {"error": "Email is required"}, 400
    
    user = User.query.filter_by(email=email).first()
    
    # Don't reveal whether the user exists or not
    if not user:
        current_app.logger.info(f"Password reset requested for non-existent email: {email}")
        return {
            "message": "If your email is registered, you will receive a password reset link."
        }, 200
    
    # Generate a secure token
    reset_token = secrets.token_urlsafe(24)
    user.reset_token = reset_token
    user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
    
    try:
        db.session.commit()
        
        # Send email with the reset link
        try:
            from ..utils.email_service import send_password_reset_email
            send_password_reset_email(user, reset_token)
            current_app.logger.info(f"Password reset email sent to {email}")
        except Exception as e:
            current_app.logger.exception(f"Failed to send password reset email: {e}")
            # Don't return error to client to prevent user enumeration
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(f"Password reset DB error: {e}")
        return {"error": "Unable to process request. Please try again later."}, 500
    
    return {
        "message": "If your email is registered, you will receive a password reset link."
    }, 200

def confirm_password_reset(token, new_password):
    """
    Confirm password reset with token and set new password.
    
    Args:
        token (str): Reset token from email
        new_password (str): New password to set
        
    Returns:
        tuple: (response_dict, status_code)
    """
    if not token or not new_password:
        return {"error": "Token and new password are required"}, 400
    
    # Validate the new password
    is_valid, pwd_message = validate_password(new_password)
    if not is_valid:
        return {"error": f"Password does not meet strength requirements: {pwd_message}"}, 400
    
    # Find the user by token
    user = User.query.filter_by(reset_token=token).first()
    if not user:
        return {"error": "Invalid or expired reset token"}, 404
    
    # Check if token is expired
    if not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
        # Clear the expired token
        user.reset_token = None
        user.reset_token_expiry = None
        db.session.commit()
        return {"error": "Reset token has expired. Please request a new password reset."}, 400
    
    # Set the new password and clear the token
    user.set_password(new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    
    # If the user was inactive, activate them
    if not user.is_active:
        user.is_active = True
    
    try:
        db.session.commit()
        current_app.logger.info(f"Password successfully reset for user {user.id}")
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(f"Password reset confirmation error: {e}")
        return {"error": "Unable to reset password. Please try again."}, 500
    
    return {"message": "Password has been reset successfully. You can now log in."}, 200
