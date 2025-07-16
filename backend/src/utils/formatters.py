"""
Utilities for formatting data in consistent ways.
"""
from datetime import datetime, date

def format_currency(amount, currency_symbol='$'):
    """
    Format a number as currency.
    
    Args:
        amount: Numeric amount to format
        currency_symbol: Currency symbol to use (default: $)
        
    Returns:
        Formatted currency string (e.g., $1,234.56)
    """
    if amount is None:
        return None
    return f"{currency_symbol}{float(amount):,.2f}"

def format_date(date_obj, format="%Y-%m-%d"):
    """
    Format a date consistently.
    
    Args:
        date_obj: Date or datetime object
        format: Format string (default: YYYY-MM-DD)
        
    Returns:
        Formatted date string
    """
    if not date_obj:
        return None
        
    if isinstance(date_obj, datetime):
        date_obj = date_obj.date()
        
    return date_obj.strftime(format)

def format_datetime(dt_obj, format="%Y-%m-%d %H:%M:%S"):
    """
    Format a datetime consistently.
    
    Args:
        dt_obj: Datetime object
        format: Format string (default: YYYY-MM-DD HH:MM:SS)
        
    Returns:
        Formatted datetime string
    """
    if not dt_obj:
        return None
        
    return dt_obj.strftime(format)

def format_phone(phone):
    """
    Format a phone number consistently.
    
    Args:
        phone: String phone number in any format
        
    Returns:
        Formatted phone number (e.g., (555) 123-4567)
    """
    if not phone:
        return None
        
    # Remove any non-digit characters
    digits = ''.join(filter(str.isdigit, phone))
    
    # Format based on length
    if len(digits) == 10:
        return f"({digits[0:3]}) {digits[3:6]}-{digits[6:10]}"
    elif len(digits) == 11 and digits[0] == '1':
        return f"({digits[1:4]}) {digits[4:7]}-{digits[7:11]}"
    else:
        return phone  # Return original if not standard format
        
def format_address(street, city, state, zip_code):
    """
    Format a complete address.
    
    Args:
        street: Street address
        city: City name
        state: State/province code
        zip_code: ZIP/postal code
        
    Returns:
        Formatted address string
    """
    components = [c for c in [street, city, f"{state} {zip_code}" if state else zip_code] if c]
    return ", ".join(components)

def format_name(first_name, last_name=None):
    """
    Format a person's name.
    
    Args:
        first_name: First name
        last_name: Last name (optional)
        
    Returns:
        Formatted name string
    """
    if last_name:
        return f"{first_name} {last_name}"
    return first_name
    
def format_status(status):
    """
    Format a status value for display.
    
    Args:
        status: Status string (e.g., 'in_progress')
        
    Returns:
        Display-friendly status (e.g., 'In Progress')
    """
    if not status:
        return ""
        
    # Replace underscores with spaces and title case each word
    return " ".join(word.capitalize() for word in status.split("_"))