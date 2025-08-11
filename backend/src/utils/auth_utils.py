# backend/src/utils/auth_utils.py
import re

def validate_email(email):
    """
    Simple regex to validate email format
    """
    return re.match(r"^[^@]+@[^@]+\.[^@]+$", email) is not None

def validate_password_strength(password):
    """
    Basic password strength validation:
    - Minimum 8 characters
    - At least one digit
    - At least one letter
    """
    return (
        len(password) >= 8 and
        any(c.isdigit() for c in password) and
        any(c.isalpha() for c in password)
    )
