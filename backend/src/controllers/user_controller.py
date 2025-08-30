from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    jwt_required, create_access_token, 
    create_refresh_token, get_jwt_identity, get_jwt
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import uuid
import os
import json
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
    """Refresh the access token using the refresh token"""
    try:
        user_id = int(get_jwt_identity())
        access_token = create_access_token(identity=user_id)
        
        return jsonify({
            "access_token": access_token
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout the current user by revoking their tokens"""
    try:
        user_id = int(get_jwt_identity())
        jti = get_jwt()['jti']
        
        # Add token to blocklist
        now = datetime.now()
        token = TokenBlocklist(
            jti=jti,
            created_at=now
        )
        db.session.add(token)
        db.session.commit()
        
        return jsonify({"message": "Successfully logged out"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    """Get current user profile"""
    try:
        # Print request headers for debugging
        print(f"DEBUG - User profile request headers: {dict(request.headers)}")
        auth_header = request.headers.get('Authorization')
        print(f"DEBUG - Authorization header: {auth_header}")
        
        raw_identity = get_jwt_identity()
        print(f"DEBUG - JWT raw identity: {raw_identity}, type: {type(raw_identity)}")
        
        # Handle both integer and dictionary identities
        try:
            if isinstance(raw_identity, dict) and 'id' in raw_identity:
                user_id = int(raw_identity['id'])
            else:
                user_id = int(raw_identity)
            
            print(f"DEBUG - JWT processed identity: {user_id}")
        except (ValueError, TypeError) as e:
            print(f"DEBUG - Error converting identity to int: {str(e)}")
            # Just use the raw identity if conversion fails
            user_id = raw_identity
        
        # Get JWT claims for debugging
        try:
            from flask_jwt_extended import get_jwt
            claims = get_jwt()
            print(f"DEBUG - JWT claims: {claims}")
        except Exception as e:
            print(f"DEBUG - Error getting JWT claims: {str(e)}")
        
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
        
        return jsonify({"user": user_data}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_user_profile():
    """Update user profile"""
    try:
        # Print request headers for debugging
        print(f"DEBUG - Update profile request headers: {dict(request.headers)}")
        auth_header = request.headers.get('Authorization')
        print(f"DEBUG - Authorization header: {auth_header}")
        
        raw_identity = get_jwt_identity()
        print(f"DEBUG - JWT raw identity: {raw_identity}, type: {type(raw_identity)}")
        
        # Handle both integer and dictionary identities
        try:
            if isinstance(raw_identity, dict) and 'id' in raw_identity:
                current_user_id = int(raw_identity['id'])
            else:
                current_user_id = int(raw_identity)
                
            print(f"DEBUG - JWT processed identity: {current_user_id}")
        except (ValueError, TypeError) as e:
            print(f"DEBUG - Error converting identity to int: {str(e)}")
            # Just use the raw identity if conversion fails
            current_user_id = raw_identity
            
        data = request.get_json()
        
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
        
        # Return updated user info
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
        
        return jsonify({
            "message": "Profile updated successfully",
            "user": user_data,
            "email_verification_required": 'email' in data and data['email'] != user.email
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@user_bp.route('/password', methods=['PUT'])
@jwt_required()
def update_password():
    """Update user password"""
    try:
        # Get current user ID from JWT
        identity = get_jwt_identity()
        user_id = int(identity)
        
        data = request.get_json()
        
        # Check if required fields are present
        if 'current_password' not in data or 'new_password' not in data:
            return jsonify({
                "error": "Current password and new password are required"
            }), 400
            
        # Get the user
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Verify current password
        if not check_password_hash(user.password, data['current_password']):
            return jsonify({"error": "Current password is incorrect"}), 401
            
        # Update password
        user.password = generate_password_hash(data['new_password'])
        db.session.commit()
        
        return jsonify({"message": "Password updated successfully"}), 200
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
def admin_delete_user(user_id):
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

@user_bp.route('/', methods=['DELETE'])
@jwt_required()
def delete_user():
    """Delete the user account"""

@user_bp.route('/profile-picture', methods=['POST'])
@jwt_required()
def upload_profile_picture():
    """Upload user profile picture"""

@jwt_required()
@user_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_user_preferences():
    """Get user preferences"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Return preferences as JSON
        preferences = {}
        if user.preferences:
            preferences = json.loads(user.preferences)
            
        return jsonify({"preferences": preferences}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
@jwt_required()
@user_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def set_user_preferences():
    """Update user preferences"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        data = request.get_json()
        
        if not isinstance(data, dict):
            return jsonify({"error": "Invalid preferences format"}), 400
            
        # Store preferences as JSON string
        user.preferences = json.dumps(data)
        db.session.commit()
        
        return jsonify({
            "message": "Preferences updated successfully",
            "preferences": data
        }), 200
        
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
        
# Function already defined above - removing duplicate
    # Print debug headers to see what's coming in
    print(f"DEBUG - Request headers: {dict(request.headers)}")
    
    try:
        # Get the user ID from JWT token and cast to int
        identity = get_jwt_identity()
        print(f"DEBUG - JWT Identity: {identity}, Type: {type(identity)}")
        
        # Print the full JWT claims if available
        try:
            from flask_jwt_extended import get_jwt
            jwt_claims = get_jwt()
            print(f"DEBUG - Full JWT claims: {jwt_claims}")
        except Exception as e:
            print(f"DEBUG - Error getting JWT claims: {str(e)}")
        
        # Handle different identity formats
        if isinstance(identity, dict):
            user_id = int(identity.get('id'))
            print(f"DEBUG - Dict Identity: {identity}, using id: {user_id}")
        elif identity is not None:
            user_id = int(identity)
            print(f"DEBUG - Raw Identity: {identity}, converted to: {user_id}")
        else:
            print("DEBUG - Identity is None")
            return jsonify({"error": "Invalid JWT token - identity is None"}), 401
        
        # Fetch the user from database
        user = User.query.get(user_id)
        if not user:
            print(f"DEBUG - User not found with ID: {user_id}")
            return jsonify({"error": "User not found"}), 404
            
        # Return user profile data - matching the expected format in tests
        profile = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "is_verified": user.is_verified,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "phone": user.phone
        }
        
        print(f"DEBUG - Returning profile: {profile}")
        # Return in the format expected by tests
        return jsonify({"user": profile}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Function already defined above - removing duplicate
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
        
        if 'phone' in data:
            user.phone = data['phone']
            
        # Save changes
        db.session.commit()
        
        # Return updated user profile in the format expected by tests
        updated_profile = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "is_verified": user.is_verified,
            "phone": user.phone
        }
        
        return jsonify({"message": "Profile updated successfully", "user": updated_profile}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
        
# Function already defined above - removing duplicate
    try:
        # Get the user ID from JWT token and cast to int
        identity = get_jwt_identity()
        user_id = int(identity) if not isinstance(identity, dict) else int(identity.get('id'))
        
        # Fetch the user from database
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Get password data from request
        data = request.get_json()
        if 'current_password' not in data or 'new_password' not in data:
            return jsonify({"error": "Current password and new password are required"}), 400
            
        # Verify current password - handle both direct check_password method and werkzeug comparison
        password_correct = False
        if hasattr(user, 'check_password') and callable(user.check_password):
            password_correct = user.check_password(data['current_password'])
        else:
            password_correct = check_password_hash(user.password, data['current_password'])
            
        if not password_correct:
            return jsonify({"error": "Current password is incorrect"}), 401
            
        # Set new password - handle both methods
        if hasattr(user, 'set_password') and callable(user.set_password):
            user.set_password(data['new_password'])
        else:
            user.password = generate_password_hash(data['new_password'])
            
        db.session.commit()
        
        return jsonify({"message": "Password updated successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
        
# Function already defined above - removing duplicate
    try:
        # Get the user ID from JWT token and cast to int
        identity = get_jwt_identity()
        user_id = int(identity) if not isinstance(identity, dict) else int(identity.get('id'))
        
        # Fetch the user from database
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Check if a file was submitted
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
            
        file = request.files['file']
        
        # Check if file is empty
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
            
        # Ensure the file is an allowed type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
        if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({"error": "File type not allowed. Please upload an image (PNG, JPG, JPEG, GIF)"}), 400
            
        # Secure the filename
        filename = secure_filename(file.filename)
        
        # Create a unique filename with user_id
        unique_filename = f"{user_id}_{uuid.uuid4()}_{filename}"
        
        # Ensure upload directory exists
        upload_dir = current_app.config.get('UPLOAD_DIR', 'uploads/profile_pictures')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save the file
        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)
        
        # Update user profile picture path
        user.profile_picture = file_path
        db.session.commit()
        
        # Return user data including the new profile picture path
        user_data = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "profile_picture": file_path,
        }
        
        return jsonify({
            "message": "Profile picture uploaded successfully",
            "user": user_data
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
        
# Function already defined above - removing duplicate
    try:
        # Get the user ID from JWT token and cast to int
        identity = get_jwt_identity()
        user_id = int(identity) if not isinstance(identity, dict) else int(identity.get('id'))
        
        # Fetch the user from database
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Soft delete by setting is_active to False
        # This is actually setting the column value directly since 
        # the property getter might be preventing direct assignment
        setattr(user, 'is_active', False)
        
        # Add timestamp for when account was deactivated
        user.updated_at = datetime.now()
        
        db.session.commit()
        
        return jsonify({"message": "Account deactivated successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
        
# Function already defined above - removing duplicate
    try:
        # Get the user ID from JWT token and cast to int
        identity = get_jwt_identity()
        user_id = int(identity) if not isinstance(identity, dict) else int(identity.get('id'))
        
        # Fetch the user from database
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # For now, return a stub response
        # In the future, this can be connected to a preferences model
        preferences = {
            "notifications": {
                "email": True,
                "sms": False,
                "push": True
            },
            "theme": "light",
            "language": "en",
            "display_name": user.name
        }
        
        user_data = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        }
        
        return jsonify({
            "user": user_data,
            "preferences": preferences
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
# Function already defined above - removing duplicate
    try:
        # Get the user ID from JWT token and cast to int
        identity = get_jwt_identity()
        user_id = int(identity) if not isinstance(identity, dict) else int(identity.get('id'))
        
        # Fetch the user from database
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Get preferences data from request
        data = request.get_json()
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Invalid preferences data"}), 400
            
        # For now, just return success (stub implementation)
        # In the future, this will save to a preferences model
        
        user_data = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        }
        
        return jsonify({
            "message": "Preferences updated successfully",
            "user": user_data,
            "preferences": data
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500