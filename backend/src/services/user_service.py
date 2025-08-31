from ..models.user import User
from ..models.tenant_profile import TenantProfile
from ..models.landlord_profile import LandlordProfile
from ..extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import SQLAlchemyError
import uuid
from datetime import datetime, timedelta

class UserService:
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID"""
        return db.session.get(User, user_id)
        
    @staticmethod
    def get_user_by_email(email):
        """Get user by email"""
        return User.query.filter_by(email=email).first()
        
    @staticmethod
    def create_user(name, email, password, role='tenant', phone=None):
        """Create a new user"""
        try:
            # Check if email already exists
            existing_user = UserService.get_user_by_email(email)
            if existing_user:
                return None, "Email already registered"
                
            # Create verification token
            verification_token = str(uuid.uuid4())
            token_expiry = datetime.utcnow() + timedelta(hours=24)
            
            # Create new user
            new_user = User(
                name=name,
                email=email.lower(),
                password=generate_password_hash(password),
                role=role,
                phone=phone,
                verification_token=verification_token,
                token_expiry=token_expiry,
                is_verified=False
            )
            
            db.session.add(new_user)
            db.session.commit()
            
            return new_user, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, str(e)
            
    @staticmethod
    def verify_user_email(token):
        """Verify user email with token"""
        try:
            user = User.query.filter_by(verification_token=token).first()
            
            if not user:
                return None, "Invalid verification token"
                
            if user.token_expiry and user.token_expiry < datetime.utcnow():
                return None, "Verification token expired"
                
            user.is_verified = True
            user.email_verified_at = datetime.utcnow()
            user.verification_token = None
            user.token_expiry = None
            
            db.session.commit()
            
            return user, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def update_user_profile(user_id, data):
        """Update user profile information"""
        try:
            user = UserService.get_user_by_id(user_id)
            if not user:
                return None, "User not found"
                
            # Update allowed fields
            if 'name' in data:
                user.name = data['name']
            if 'phone' in data:
                user.phone = data['phone']
            if 'profile_picture' in data:
                user.profile_picture = data['profile_picture']
                
            # Update role-specific profile
            if user.role == 'tenant' and 'tenant_profile' in data:
                profile = TenantProfile.query.filter_by(user_id=user_id).first()
                tenant_data = data['tenant_profile']
                
                if not profile:
                    profile = TenantProfile(user_id=user_id)
                    db.session.add(profile)
                    
                # Update tenant profile fields
                for field in ['date_of_birth', 'employment_status', 'employer', 'emergency_contact_name', 
                             'emergency_contact_phone', 'emergency_contact_relation']:
                    if field in tenant_data:
                        setattr(profile, field, tenant_data[field])
                        
            elif user.role == 'landlord' and 'landlord_profile' in data:
                profile = LandlordProfile.query.filter_by(user_id=user_id).first()
                landlord_data = data['landlord_profile']
                
                if not profile:
                    profile = LandlordProfile(user_id=user_id)
                    db.session.add(profile)
                    
                # Update landlord profile fields
                for field in ['company_name', 'business_address', 'business_license_number', 'tax_id']:
                    if field in landlord_data:
                        setattr(profile, field, landlord_data[field])
                        
            db.session.commit()
            return user, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def change_password(user_id, current_password, new_password):
        """Change user password"""
        try:
            user = UserService.get_user_by_id(user_id)
            if not user:
                return False, "User not found"
                
            # Verify current password
            if not check_password_hash(user.password, current_password):
                return False, "Current password is incorrect"
                
            # Update password
            user.password = generate_password_hash(new_password)
            user.password_changed_at = datetime.utcnow()
            
            db.session.commit()
            return True, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return False, str(e)
    
    @staticmethod
    def generate_password_reset_token(email):
        """Generate password reset token"""
        try:
            user = UserService.get_user_by_email(email)
            if not user:
                return None, "User not found"
                
            # Generate reset token
            reset_token = str(uuid.uuid4())
            token_expiry = datetime.utcnow() + timedelta(hours=1)
            
            user.reset_token = reset_token
            user.reset_token_expiry = token_expiry
            
            db.session.commit()
            
            return reset_token, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def reset_password_with_token(token, new_password):
        """Reset password using token"""
        try:
            user = User.query.filter_by(reset_token=token).first()
            
            if not user:
                return None, "Invalid reset token"
                
            if user.reset_token_expiry and user.reset_token_expiry < datetime.utcnow():
                return None, "Reset token expired"
                
            # Update password
            user.password = generate_password_hash(new_password)
            user.password_changed_at = datetime.utcnow()
            user.reset_token = None
            user.reset_token_expiry = None
            
            db.session.commit()
            
            return user, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, str(e)