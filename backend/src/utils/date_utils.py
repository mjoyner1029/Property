"""
Utilities for working with dates and times.
"""
from datetime import datetime, date, timedelta
import calendar

def get_first_day_of_month(dt=None):
    """
    Get the first day of the month.
    
    Args:
        dt: Date or datetime object (default: current date)
        
    Returns:
        Date object for first day of month
    """
    if dt is None:
        dt = date.today()
    if isinstance(dt, datetime):
        dt = dt.date()
    return date(dt.year, dt.month, 1)

def get_last_day_of_month(dt=None):
    """
    Get the last day of the month.
    
    Args:
        dt: Date or datetime object (default: current date)
        
    Returns:
        Date object for last day of month
    """
    if dt is None:
        dt = date.today()
    if isinstance(dt, datetime):
        dt = dt.date()
    
    # Get the number of days in the month
    _, last_day = calendar.monthrange(dt.year, dt.month)
    return date(dt.year, dt.month, last_day)

def add_months(dt, months):
    """
    Add a specific number of months to a date.
    
    Args:
        dt: Date or datetime object
        months: Number of months to add (can be negative)
        
    Returns:
        New date with months added
    """
    if isinstance(dt, datetime):
        dt = dt.date()
    
    month = dt.month - 1 + months
    year = dt.year + month // 12
    month = month % 12 + 1
    day = min(dt.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)

def date_range(start_date, end_date):
    """
    Generate a range of dates between start and end.
    
    Args:
        start_date: Start date (inclusive)
        end_date: End date (inclusive)
        
    Returns:
        Generator yielding date objects
    """
    if isinstance(start_date, datetime):
        start_date = start_date.date()
    if isinstance(end_date, datetime):
        end_date = end_date.date()
    
    days = (end_date - start_date).days + 1
    for i in range(days):
        yield start_date + timedelta(days=i)

def get_date_difference_in_days(start_date, end_date):
    """
    Get the number of days between two dates.
    
    Args:
        start_date: Start date
        end_date: End date
        
    Returns:
        Integer number of days
    """
    if isinstance(start_date, datetime):
        start_date = start_date.date()
    if isinstance(end_date, datetime):
        end_date = end_date.date()
    
    return (end_date - start_date).days

def get_date_difference_in_months(start_date, end_date):
    """
    Get the approximate number of months between two dates.
    
    Args:
        start_date: Start date
        end_date: End date
        
    Returns:
        Float representing months (may include partial months)
    """
    if isinstance(start_date, datetime):
        start_date = start_date.date()
    if isinstance(end_date, datetime):
        end_date = end_date.date()
    
    # Calculate difference in months
    months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
    
    # Adjust for partial months
    day_in_month = end_date.day / calendar.monthrange(end_date.year, end_date.month)[1]
    start_day_in_month = start_date.day / calendar.monthrange(start_date.year, start_date.month)[1]
    
    return months + (day_in_month - start_day_in_month)

def is_lease_expiring_soon(end_date, days_threshold=30):
    """
    Check if a lease is expiring within a certain threshold.
    
    Args:
        end_date: Lease end date
        days_threshold: Number of days to consider "soon"
        
    Returns:
        Boolean indicating if lease is expiring soon
    """
    if isinstance(end_date, datetime):
        end_date = end_date.date()
    
    today = date.today()
    days_remaining = (end_date - today).days
    
    return 0 <= days_remaining <= days_threshold

def get_next_payment_date(payment_day, reference_date=None):
    """
    Calculate the next payment date based on a payment day of month.
    
    Args:
        payment_day: Day of month when payment is due (1-31)
        reference_date: Reference date (default: today)
        
    Returns:
        Date object for next payment
    """
    if reference_date is None:
        reference_date = date.today()
    if isinstance(reference_date, datetime):
        reference_date = reference_date.date()
    
    # Ensure payment_day is valid
    payment_day = min(payment_day, 28)  # Safe for all months
    
    # If today's day is before payment day, payment is this month
    if reference_date.day < payment_day:
        # Try to set the payment day in current month
        try:
            return date(reference_date.year, reference_date.month, payment_day)
        except ValueError:
            # Handle case where payment day doesn't exist in this month
            return get_last_day_of_month(reference_date)
    else:
        # Payment is next month
        next_month = add_months(reference_date, 1)
        try:
            return date(next_month.year, next_month.month, payment_day)
        except ValueError:
            # Handle case where payment day doesn't exist in next month
            return get_last_day_of_month(next_month)