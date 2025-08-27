"""
Password validation utilities to enforce password policies.
"""
from __future__ import annotations

import re
from typing import List, Dict, Any, Optional, Tuple
from flask import current_app


def validate_password_strength(password: str) -> Tuple[bool, List[str]]:
    """
    Validate that a password meets the configured strength requirements.
    
    Args:
        password: The password to validate
        
    Returns:
        Tuple[bool, List[str]]: (is_valid, list of validation errors)
    """
    errors = []
    
    # Get password policy from config
    min_length = current_app.config.get('PASSWORD_MIN_LENGTH', 8)
    require_upper = current_app.config.get('PASSWORD_REQUIRE_UPPERCASE', True)
    require_lower = current_app.config.get('PASSWORD_REQUIRE_LOWERCASE', True)
    require_numbers = current_app.config.get('PASSWORD_REQUIRE_NUMBERS', True)
    require_special = current_app.config.get('PASSWORD_REQUIRE_SPECIAL', True)
    
    # Check password length
    if len(password) < min_length:
        errors.append(f"Password must be at least {min_length} characters long")
    
    # Check for uppercase letters if required
    if require_upper and not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")
    
    # Check for lowercase letters if required
    if require_lower and not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")
    
    # Check for numbers if required
    if require_numbers and not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one number")
    
    # Check for special characters if required
    if require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")
    
    # Check for common patterns that would make the password weak
    if password.lower() in ['password', 'admin', '123456', 'qwerty']:
        errors.append("Password is too common and easily guessable")
    
    # Check for repeated characters (e.g., 'aaa', '111')
    if re.search(r'(.)\1{2,}', password):
        errors.append("Password should not contain repeated sequences of characters")
    
    # Check for sequential characters (e.g., 'abc', '123')
    sequential_patterns = ['abcdefghijklmnopqrstuvwxyz', '01234567890']
    for pattern in sequential_patterns:
        for i in range(len(pattern) - 2):
            if pattern[i:i+3].lower() in password.lower():
                errors.append("Password should not contain sequential patterns")
                break
    
    return (len(errors) == 0, errors)


def get_password_requirements() -> Dict[str, Any]:
    """
    Get the current password policy requirements.
    
    Returns:
        Dict with password requirements
    """
    return {
        'min_length': current_app.config.get('PASSWORD_MIN_LENGTH', 8),
        'require_uppercase': current_app.config.get('PASSWORD_REQUIRE_UPPERCASE', True),
        'require_lowercase': current_app.config.get('PASSWORD_REQUIRE_LOWERCASE', True),
        'require_numbers': current_app.config.get('PASSWORD_REQUIRE_NUMBERS', True),
        'require_special': current_app.config.get('PASSWORD_REQUIRE_SPECIAL', True)
    }
