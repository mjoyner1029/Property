import re
import os
import sys
from email_validator import validate_email as validate_email_format, EmailNotValidError

def validate_email(email):
    """
    Validates an email address format.
    Returns True if valid, False otherwise.
    """
    try:
        # Skip deliverability check in tests to avoid DNS lookups
        mode = "TEST" if os.environ.get("FLASK_ENV") == "testing" or "pytest" in sys.modules else "PROD"
        check_deliverability = mode != "TEST"
        
        # Validate the email
        validate_email_format(email, check_deliverability=check_deliverability)
        return True
    except EmailNotValidError:
        return False

def validate_password(password):
    """
    Validates that a password meets security requirements.
    Returns a tuple (is_valid, error_message)
    """
    return validate_password_strength(password)

def validate_password_strength(password):
    """
    Validates that a password meets security requirements:
    - At least 8 characters long
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one digit
    - Contains at least one special character
    
    Returns a tuple (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, "Password is valid"

def validate_phone_number(phone):
    """
    Validate phone number format.
    
    Args:
        phone: String phone number
        
    Returns:
        Boolean indicating if phone number is valid
    """
    # Remove any non-digit characters
    digits = ''.join(filter(str.isdigit, phone))
    
    # Valid formats: 10 digits (US/CA) or 11 digits starting with 1
    return len(digits) == 10 or (len(digits) == 11 and digits[0] == '1')

def validate_zip_code(zip_code):
    """
    Validate US ZIP code format (5 digits or 5+4).
    
    Args:
        zip_code: String ZIP code
        
    Returns:
        Boolean indicating if ZIP code is valid
    """
    return bool(re.match(r'^\d{5}(?:-\d{4})?$', zip_code))

def validate_property_address(address):
    """
    Basic validation for property address.
    
    Args:
        address: String address
        
    Returns:
        Boolean indicating if address format seems valid
    """
    # Check for minimum length and presence of numbers (most addresses have them)
    if len(address) < 5:
        return False
        
    # Most addresses have at least one number
    if not any(c.isdigit() for c in address):
        return False
        
    return True

def validate_date_format(date_str, format_str='%Y-%m-%d'):
    """
    Validate if a string is a valid date in the specified format.
    
    Args:
        date_str: String date
        format_str: Expected date format (default: YYYY-MM-DD)
        
    Returns:
        Boolean indicating if string is a valid date
    """
    from datetime import datetime
    try:
        datetime.strptime(date_str, format_str)
        return True
    except ValueError:
        return False