"""
Test utilities to reduce flakiness and duplication in tests.
"""
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from flask_jwt_extended import create_access_token

from src.models.user import User
from src.extensions import db



def make_user(app, db, **overrides):
    """
    Create a test user with optional stripe_customer_id and stripe_account_id.
    
    Args:
        app: Flask app instance
        db: SQLAlchemy db instance
        **overrides: Override default user attributes
        
    Returns:
        User: The created user object
        
    Example:
        user = make_user(app, db, 
                        email="test@example.com", 
                        role="landlord",
                        stripe_customer_id="cus_123456",
                        stripe_account_id="acct_123456")
    """
    with app.app_context():
        # Default values
        defaults = {
            'email': f"test_{datetime.now().timestamp()}@example.com",
            'name': "Test User",
            'role': "tenant",
            'is_verified': True,
            'password': "Password123!",
            'stripe_customer_id': None,
            'stripe_account_id': None
        }
        
        # Override defaults with provided values
        user_data = {**defaults, **overrides}
        
        # Hash password
        password = user_data.pop('password')
        
        # Create user
        user = User(
            email=user_data['email'],
            name=user_data['name'],
            role=user_data['role'],
            is_verified=user_data['is_verified'],
            password=generate_password_hash(password)
        )
        
        # Add Stripe fields - handle dynamically since they're not in the base model
        if user_data['stripe_customer_id']:
            setattr(user, 'stripe_customer_id', user_data['stripe_customer_id'])
            
        if user_data['stripe_account_id']:
            setattr(user, 'stripe_account_id', user_data['stripe_account_id'])
            
        # Add any additional fields provided in overrides
        for key, value in overrides.items():
            if key not in ['email', 'name', 'role', 'is_verified', 'password', 'stripe_customer_id', 'stripe_account_id']:
                setattr(user, key, value)
        
        # Save to database
        db.session.add(user)
        db.session.commit()
        
        # Store the user ID for later reference (in case session closes)
        user_id = user.id
        
        # Query the user again to ensure it's attached to a session
        fresh_user = db.session.get(User, user_id)
        return fresh_user


def auth_header(app, user):
    """
    Generate authentication headers for a user with a fresh JWT.
    
    Args:
        app: Flask app instance
        user: User object or user ID
        
    Returns:
        dict: Authorization header with Bearer token
        
    Example:
        headers = auth_header(app, user)
    """
    with app.app_context():
        # Set explicit expiration for test tokens
        expiry = timedelta(hours=1)
        
        # Extract the user ID
        user_id = user
        if hasattr(user, 'id'):
            try:
                # Try to get the ID from the user object, but don't use the attribute directly
                from src.models.user import User
                # Re-query the user to ensure it's attached to a session
                user_db = db.session.get(User, user.id)
                if user_db:
                    user_id = user_db.id
            except Exception:
                # If anything fails, use the user object as is (might be an ID already)
                pass
                
        # Create token with the user ID
        token = create_access_token(identity=int(user_id), expires_delta=expiry)
        return {"Authorization": f"Bearer {token}"}
