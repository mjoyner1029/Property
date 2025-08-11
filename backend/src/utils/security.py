"""
Security-related utilities.
"""
from flask_jwt_extended import create_access_token, create_refresh_token
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
import string
from datetime import datetime, timedelta
from flask import current_app
import hashlib
import jwt

# Import the password utilities to maintain backward compatibility
from .password import hash_password, verify_password

def generate_token(identity, additional_claims=None, expires_delta=None):
    """
    Generate a JWT access token.
    
    Args:
        identity: User ID or other unique identifier
        additional_claims: Dictionary of additional claims to include
        expires_delta: Token expiration time (default: from config)
        
    Returns:
        JWT access token string
    """
    if additional_claims is None:
        additional_claims = {}
        
    return create_access_token(
        identity=identity,
        additional_claims=additional_claims,
        expires_delta=expires_delta
    )

def generate_refresh_token(identity):
    """
    Generate a JWT refresh token.
    
    Args:
        identity: User ID or other unique identifier
        
    Returns:
        JWT refresh token string
    """
    return create_refresh_token(identity=identity)

def generate_verification_token(email):
    """
    Generate an email verification token.
    
    Args:
        email: User email address
        
    Returns:
        Token string
    """
    secret = current_app.config.get('JWT_SECRET_KEY')
    payload = {
        'email': email,
        'type': 'email_verification',
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, secret, algorithm='HS256')

def verify_token(token, expected_type=None):
    """
    Verify and decode a token.
    
    Args:
        token: JWT token
        expected_type: Expected token type (e.g., 'email_verification')
        
    Returns:
        Decoded payload or None if invalid
    """
    try:
        secret = current_app.config.get('JWT_SECRET_KEY')
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        
        if expected_type and payload.get('type') != expected_type:
            return None
            
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def generate_random_password(length=12):
    """
    Generate a secure random password.
    
    Args:
        length: Password length (default: 12)
        
    Returns:
        Random password string
    """
    # Ensure minimum length for security
    length = max(8, length)
    
    # Define character sets
    uppercase = string.ascii_uppercase
    lowercase = string.ascii_lowercase
    digits = string.digits
    special = "!@#$%^&*()-_=+"
    
    # Ensure at least one character from each set
    password = [
        secrets.choice(uppercase),
        secrets.choice(lowercase),
        secrets.choice(digits),
        secrets.choice(special)
    ]
    
    # Fill remaining characters
    all_chars = uppercase + lowercase + digits + special
    password.extend(secrets.choice(all_chars) for _ in range(length - 4))
    
    # Shuffle the characters
    secrets.SystemRandom().shuffle(password)
    
    return ''.join(password)

def hash_file_content(file_content, algorithm='sha256'):
    """
    Generate a hash of file content.
    
    Args:
        file_content: Binary file content
        algorithm: Hash algorithm to use
        
    Returns:
        Hexadecimal hash string
    """
    hash_obj = hashlib.new(algorithm)
    hash_obj.update(file_content)
    return hash_obj.hexdigest()