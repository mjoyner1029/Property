"""
Routes for managing multi-factor authentication.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..models.user import User
from ..extensions import db, limiter
from ..utils.mfa import MFAManager
import json

mfa_bp = Blueprint('mfa', __name__)
mfa_manager = MFAManager()

@mfa_bp.route('/setup', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute; 20 per hour")
def setup_mfa():
    """
    Start MFA setup process by generating and returning a secret
    Returns QR code for scanning and secret for manual entry
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if user.mfa_enabled:
        return jsonify({"error": "MFA is already enabled for this account"}), 400
    
    # Generate new MFA secret
    secret = mfa_manager.generate_secret()
    
    # Generate TOTP URI and QR code
    totp_uri = mfa_manager.generate_totp_uri(secret, user.email)
    qr_code = mfa_manager.generate_qr_code(totp_uri)
    
    # Store secret temporarily in user record (not enabled yet until verified)
    user.mfa_secret = secret
    db.session.commit()
    
    return jsonify({
        "secret": secret,
        "qr_code": qr_code,
        "email": user.email
    }), 200


@mfa_bp.route('/verify', methods=['POST'])
@jwt_required()
@limiter.limit("10 per 5 minutes; 30 per hour")
def verify_mfa_setup():
    """
    Verify MFA setup by validating a TOTP code
    Enables MFA for the user if verification is successful
    """
    data = request.get_json()
    if not data or 'code' not in data:
        return jsonify({"error": "Verification code is required"}), 400
    
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if not user.mfa_secret:
        return jsonify({"error": "MFA setup not started"}), 400
    
    # Verify the provided code against the secret
    if not mfa_manager.verify_totp(user.mfa_secret, data['code']):
        return jsonify({"error": "Invalid verification code"}), 400
    
    # Generate backup codes
    backup_codes = mfa_manager.generate_backup_codes()
    
    # Enable MFA for the user
    user.mfa_enabled = True
    user.mfa_backup_codes = json.dumps(backup_codes)
    db.session.commit()
    
    return jsonify({
        "message": "MFA enabled successfully",
        "backup_codes": backup_codes
    }), 200


@mfa_bp.route('/disable', methods=['POST'])
@jwt_required()
def disable_mfa():
    """
    Disable MFA for the user
    Requires password verification for security
    """
    data = request.get_json()
    if not data or 'password' not in data:
        return jsonify({"error": "Password is required"}), 400
    
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if not user.mfa_enabled:
        return jsonify({"error": "MFA is not enabled for this account"}), 400
    
    # Verify password for security
    if not user.check_password(data['password']):
        return jsonify({"error": "Invalid password"}), 401
    
    # Disable MFA
    user.mfa_enabled = False
    user.mfa_secret = None
    user.mfa_backup_codes = None
    db.session.commit()
    
    return jsonify({"message": "MFA disabled successfully"}), 200


@mfa_bp.route('/verify-code', methods=['POST'])
def verify_mfa_code():
    """
    Verify a TOTP code during login
    Used as part of the login flow when MFA is enabled
    """
    data = request.get_json()
    if not data or 'email' not in data or 'code' not in data:
        return jsonify({"error": "Email and verification code are required"}), 400
    
    # Find user by email
    user = User.query.filter_by(email=data['email']).first()
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if not user.mfa_enabled or not user.mfa_secret:
        return jsonify({"error": "MFA is not enabled for this account"}), 400
    
    # Check if using a backup code
    if data.get('is_backup_code', False):
        if not user.mfa_backup_codes:
            return jsonify({"error": "No backup codes available"}), 400
            
        success, updated_codes = mfa_manager.verify_backup_code(user.mfa_backup_codes, data['code'])
        if success:
            user.mfa_backup_codes = updated_codes
            db.session.commit()
            return jsonify({"message": "Backup code verification successful"}), 200
        else:
            return jsonify({"error": "Invalid backup code"}), 400
    
    # Verify TOTP code
    if mfa_manager.verify_totp(user.mfa_secret, data['code']):
        return jsonify({"message": "Verification successful"}), 200
    else:
        return jsonify({"error": "Invalid verification code"}), 400


@mfa_bp.route('/generate-backup-codes', methods=['POST'])
@jwt_required()
def generate_new_backup_codes():
    """
    Generate new backup codes for an account with MFA enabled
    Requires password verification for security
    """
    data = request.get_json()
    if not data or 'password' not in data:
        return jsonify({"error": "Password is required"}), 400
    
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if not user.mfa_enabled:
        return jsonify({"error": "MFA is not enabled for this account"}), 400
    
    # Verify password for security
    if not user.check_password(data['password']):
        return jsonify({"error": "Invalid password"}), 401
    
    # Generate new backup codes
    backup_codes = mfa_manager.generate_backup_codes()
    user.mfa_backup_codes = json.dumps(backup_codes)
    db.session.commit()
    
    return jsonify({
        "message": "New backup codes generated",
        "backup_codes": backup_codes
    }), 200


@mfa_bp.route('/status', methods=['GET'])
@jwt_required()
def mfa_status():
    """
    Check if MFA is enabled for the current user
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "mfa_enabled": user.mfa_enabled
    }), 200
