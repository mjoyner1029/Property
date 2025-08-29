from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    jwt_required, create_access_token, 
    create_refresh_token, get_jwt_identity, get_jwt
)
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import uuid
from sqlalchemy import or_

from ..models.user import User
from ..models.property import Property
from ..models.tenant_property import TenantProperty
from ..models.token_blocklist import TokenBlocklist
from ..models.password_reset import PasswordReset
from ..extensions import db, mail
from ..utils.role_required import role_required
from ..utils.email_service import send_email, send_verification_email, send_password_reset_email

user_bp = Blueprint('users', __name__)

@user_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    try:
        # Validate required fields
        required_fields = ['email', 'password', 'name', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Validate role
        if data['role'] not in ['tenant', 'landlord']:
            return jsonify({"error": "Role must be either 'tenant' or 'landlord'"}), 400
            
        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({"error": "Email already registered"}), 409
            
        # Create new user
        verification_token = str(uuid.uuid4())
        new_user = User(
            email=data['email'],
            password=generate_password_hash(data['password']),
            name=data['name'],
            role=data['role'],
            phone=data.get('phone', ''),
            verification_token=verification_token,
            is_verified=False
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        # Send verification email
        send_verification_email(new_user.email, new_user.name, verification_token)
        
        return jsonify({
            "message": "User registered successfully. Please verify your email.",
            "user_id": new_user.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@user_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    """Verify user's email address"""
    try:
        user = User.query.filter_by(verification_token=token).first()
        
        if not user:
            return jsonify({"error": "Invalid verification token"}), 400
            
        user.is_verified = True
        user.verification_token = None
        user.email_verified_at = datetime.now()
        db.session.commit()
        
        return jsonify({"message": "Email verified successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@user_bp.route('/login', methods=['POST'])
def login():
    """Login user and return tokens"""
    data = request.get_json()
    
    try:
        # Validate required fields
        if 'email' not in data or 'password' not in data:
            return jsonify({"error": "Email and password are required"}), 400
            
        user = User.query.filter_by(email=data['email']).first()
        
        # Check if user exists and password is correct
        if not user or not check_password_hash(user.password, data['password']):
            return jsonify({"error": "Invalid email or password"}), 401
            
        # Check if email is verified
        if not user.is_verified:
            return jsonify({"error": "Please verify your email address first"}), 403
            
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        # Update last login
        user.last_login = datetime.now()
        db.session.commit()
        
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "phone": user.phone
            },
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    identity = get_jwt_identity()
    # Normalize JWT identity to integer ID
    current_user_id = int(identity) if not isinstance(identity, dict) else int(identity.get('id'))
    access_token = create_access_token(identity=current_user_id)
    
    return jsonify({
        "access_token": access_token
    }), 200

@user_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user by blocklisting the JWT token"""
    jwt = get_jwt()
    jti = jwt["jti"]
    
    # Add token to blocklist
    token_block = TokenBlocklist(jti=jti, created_at=datetime.now())
    db.session.add(token_block)
    db.session.commit()
    
    return jsonify({"message": "Successfully logged out"}), 200

@user_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user profile"""
    identity = get_jwt_identity()
    # Normalize JWT identity to integer ID
    current_user_id = int(identity) if not isinstance(identity, dict) else int(identity.get('id'))
    
    try:
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        user_data = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "phone": user.phone,
            "is_verified": user.is_verified,
            "created_at": user.created_at.isoformat(),
            "last_login": user.last_login.isoformat() if user.last_login else None
        }
        
        # Get additional stats based on role
        if user.role == 'landlord':
            # Get property count
            property_count = Property.query.filter_by(landlord_id=user.id).count()
            # Get tenant count
            tenant_count = TenantProperty.query.join(Property).filter(
                Property.landlord_id == user.id,
                TenantProperty.status == 'active'
            ).count()
            
            user_data.update({
                "property_count": property_count,
                "tenant_count": tenant_count
            })
        elif user.role == 'tenant':
            # Get properties rented
            properties_rented = TenantProperty.query.filter_by(
                tenant_id=user.id, 
                status='active'
            ).count()
            
            user_data.update({
                "properties_rented": properties_rented
            })
        
        return jsonify(user_data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Update fields
        if 'name' in data:
            user.name = data['name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'profile_picture' in data:
            user.profile_picture = data['profile_picture']
            
        # If updating email, require verification again
        if 'email' in data and data['email'] != user.email:
            # Check if email already exists
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user:
                return jsonify({"error": "Email already registered"}), 409
                
            user.email = data['email']
            user.is_verified = False
            user.verification_token = str(uuid.uuid4())
            
            # Send verification email
            send_verification_email(user.email, user.name, user.verification_token)
            
        db.session.commit()
        
        return jsonify({
            "message": "Profile updated successfully",
            "email_verification_required": 'email' in data and data['email'] != user.email
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@user_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change user password"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        # Validate required fields
        if 'current_password' not in data or 'new_password' not in data:
            return jsonify({"error": "Current and new passwords are required"}), 400
            
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Verify current password
        if not check_password_hash(user.password, data['current_password']):
            return jsonify({"error": "Current password is incorrect"}), 401
            
        # Update password
        user.password = generate_password_hash(data['new_password'])
        db.session.commit()
        
        return jsonify({"message": "Password changed successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@user_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset"""
    data = request.get_json()
    
    if 'email' not in data:
        return jsonify({"error": "Email is required"}), 400
        
    try:
        user = User.query.filter_by(email=data['email']).first()
        
        # Always return success to prevent email enumeration
        if not user:
            return jsonify({"message": "If the email exists, a reset link will be sent"}), 200
            
        # Generate reset token
        reset_token = str(uuid.uuid4())
        expiration = datetime.now() + timedelta(hours=24)
        
        # Store reset token
        password_reset = PasswordReset(
            user_id=user.id,
            token=reset_token,
            expires_at=expiration
        )
        
        db.session.add(password_reset)
        db.session.commit()
        
        # Send reset email
        send_password_reset_email(user.email, user.name, reset_token)
        
        return jsonify({"message": "If the email exists, a reset link will be sent"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@user_bp.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    """Reset password using token"""
    data = request.get_json()
    
    if 'password' not in data:
        return jsonify({"error": "New password is required"}), 400
        
    try:
        # Find valid reset token
        reset_request = PasswordReset.query.filter_by(token=token).first()
        
        if not reset_request or reset_request.expires_at < datetime.now():
            return jsonify({"error": "Invalid or expired token"}), 400
            
        # Update password
        user = User.query.get(reset_request.user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        user.password = generate_password_hash(data['password'])
        
        # Delete used token
        db.session.delete(reset_request)
        db.session.commit()
        
        return jsonify({"message": "Password reset successful"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@user_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """Resend verification email"""
    data = request.get_json()
    
    if 'email' not in data:
        return jsonify({"error": "Email is required"}), 400
        
    try:
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        if user.is_verified:
            return jsonify({"error": "Email is already verified"}), 400
            
        # Generate new verification token if needed
        if not user.verification_token:
            user.verification_token = str(uuid.uuid4())
            db.session.commit()
            
        # Send verification email
        send_verification_email(user.email, user.name, user.verification_token)
        
        return jsonify({"message": "Verification email sent"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Admin user management endpoints
@user_bp.route('/', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_users():
    """Get all users (admin only)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        role_filter = request.args.get('role')
        search = request.args.get('search')
        
        query = User.query
        
        # Apply filters
        if role_filter:
            query = query.filter(User.role == role_filter)
            
        if search:
            query = query.filter(
                or_(
                    User.name.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%')
                )
            )
            
        # Paginate results
        paginated_users = query.paginate(page=page, per_page=per_page)
        
        users_data = []
        for user in paginated_users.items:
            user_data = {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "is_verified": user.is_verified,
                "created_at": user.created_at.isoformat()
            }
            users_data.append(user_data)
        
        result = {
            "users": users_data,
            "total": paginated_users.total,
            "pages": paginated_users.pages,
            "current_page": page
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get a specific user"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Users can only view their own profiles unless they are admins
    if current_user_id != user_id and current_user.role != 'admin':
        return jsonify({"error": "Unauthorized access"}), 403
        
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        user_data = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "phone": user.phone,
            "is_verified": user.is_verified,
            "created_at": user.created_at.isoformat(),
            "last_login": user.last_login.isoformat() if user.last_login else None
        }
        
        return jsonify(user_data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
@role_required('admin')
def update_user(user_id):
    """Update a user (admin only)"""
    data = request.get_json()
    
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Update fields
        if 'name' in data:
            user.name = data['name']
        if 'email' in data and data['email'] != user.email:
            # Check if email already exists
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user:
                return jsonify({"error": "Email already registered"}), 409
            user.email = data['email']
        if 'role' in data:
            user.role = data['role']
        if 'phone' in data:
            user.phone = data['phone']
        if 'is_verified' in data:
            user.is_verified = data['is_verified']
            
        db.session.commit()
        
        return jsonify({"message": "User updated successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@user_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def delete_user(user_id):
    """Delete a user (admin only)"""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({"message": "User deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@user_bp.route('/stats', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_user_stats():
    """Get user statistics (admin only)"""
    try:
        total_users = User.query.count()
        tenant_count = User.query.filter_by(role='tenant').count()
        landlord_count = User.query.filter_by(role='landlord').count()
        admin_count = User.query.filter_by(role='admin').count()
        
        verified_count = User.query.filter_by(is_verified=True).count()
        unverified_count = User.query.filter_by(is_verified=False).count()
        
        # Recent registrations (last 7 days)
        week_ago = datetime.now() - timedelta(days=7)
        recent_registrations = User.query.filter(User.created_at >= week_ago).count()
        
        stats = {
            "total_users": total_users,
            "role_breakdown": {
                "tenant": tenant_count,
                "landlord": landlord_count,
                "admin": admin_count
            },
            "verification_status": {
                "verified": verified_count,
                "unverified": unverified_count
            },
            "recent_registrations": recent_registrations
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    """Get the current user's profile"""
    try:
        # Get the user ID from JWT token and cast to int
        identity = get_jwt_identity()
        user_id = int(identity) if not isinstance(identity, dict) else int(identity.get('id'))
        
        # Fetch the user from database
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Return user profile data
        profile = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "is_verified": user.is_verified,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
        
        return jsonify(profile), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_user_profile():
    """Update the current user's profile"""
    try:
        # Get the user ID from JWT token and cast to int
        identity = get_jwt_identity()
        user_id = int(identity) if not isinstance(identity, dict) else int(identity.get('id'))
        
        # Fetch the user from database
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Get update data from request
        data = request.get_json()
        
        # Update allowed fields
        if 'name' in data:
            user.name = data['name']
            
        # Add more updatable fields as needed
            
        # Save changes
        db.session.commit()
        
        return jsonify({"message": "Profile updated successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500