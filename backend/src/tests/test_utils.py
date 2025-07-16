import json
from datetime import datetime

def parse_response(response):
    """Parse a JSON response from the API"""
    return json.loads(response.data.decode('utf-8'))

def format_date(date_obj):
    """Format a date for API requests"""
    if isinstance(date_obj, datetime):
        date_obj = date_obj.date()
    return date_obj.strftime('%Y-%m-%d')