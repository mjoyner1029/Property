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
        # Handle direct ID format
        user_id = int(identity)
        
    return user_id
