import logging
# Fix imports from absolute to relative paths
from ..models.user import User
from ..extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from ..utils.jwt import create_access_token
from ..utils.validators import validate_email_format, validate_password_strength

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
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        logger.warning(f"Failed login attempt for email: {email}")
        return {"error": "Invalid credentials"}, 401

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
