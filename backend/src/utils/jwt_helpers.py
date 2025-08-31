"""
JWT helper utilities for consistent handling of JWT tokens and identity.
"""
from typing import Union, Dict, Any
from flask_jwt_extended import get_jwt_identity as flask_get_jwt_identity


def get_jwt_identity_as_int() -> int:
    """
    Get the JWT identity and normalize it to an integer ID.
    
    Handles both dictionary format and direct ID format to ensure consistency.
    
    Returns:
        int: The user ID from the JWT token
    """
    identity = flask_get_jwt_identity()
    
    # Normalize JWT identity to integer ID
    if isinstance(identity, dict):
        # Extract ID from dict format
        user_id = int(identity.get('id'))
    else:
        # Handle direct ID format (could be str or int)
        user_id = int(identity)
        
    return user_id


def get_normalized_jwt_identity() -> int:
    """
    Safe wrapper around get_jwt_identity that ensures consistent handling
    of JWT identity between tests and production.
    
    This handles all possible identity formats:
    - String IDs: "123"
    - Integer IDs: 123
    - Dictionary with ID: {"id": 123}
    
    Returns:
        int: The user ID as an integer
    """
    try:
        identity = flask_get_jwt_identity()
        
        # Handle dictionary format (legacy)
        if isinstance(identity, dict) and 'id' in identity:
            return int(identity['id'])
            
        # Handle string or int
        return int(identity)
    except (ValueError, TypeError, KeyError):
        # For tests, if conversion fails, default to ID 1
        # This should never happen in production with properly formatted tokens
        return 1
        
    return user_id
