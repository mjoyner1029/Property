"""
General helper utilities.
"""
import re
import json
import uuid
from flask import request, jsonify, current_app
import traceback
from functools import wraps

def generate_unique_id(prefix=''):
    """
    Generate a unique identifier.
    
    Args:
        prefix: Optional prefix to add to ID
        
    Returns:
        String unique ID
    """
    unique_id = str(uuid.uuid4())
    if prefix:
        return f"{prefix}_{unique_id}"
    return unique_id

def parse_query_params(allowed_params, default_params=None):
    """
    Parse and validate query parameters.
    
    Args:
        allowed_params: Dictionary mapping param names to types
        default_params: Dictionary of default values
        
    Returns:
        Dictionary of parsed parameters
    """
    result = default_params.copy() if default_params else {}
    
    for param, param_type in allowed_params.items():
        if param in request.args:
            value = request.args.get(param)
            
            if param_type == int:
                try:
                    result[param] = int(value)
                except ValueError:
                    pass
            elif param_type == float:
                try:
                    result[param] = float(value)
                except ValueError:
                    pass
            elif param_type == bool:
                result[param] = value.lower() in ('true', 'yes', '1')
            elif param_type == list:
                result[param] = value.split(',')
            else:
                result[param] = value
                
    return result

def paginate(query, page=1, per_page=20):
    """
    Paginate a SQLAlchemy query.
    
    Args:
        query: SQLAlchemy query object
        page: Page number (default: 1)
        per_page: Items per page (default: 20)
        
    Returns:
        Dictionary with pagination information
    """
    # Ensure valid page and per_page values
    page = max(1, page)
    per_page = max(1, min(100, per_page))  # Limit to reasonable range
    
    # Get total count
    total = query.count()
    
    # Paginate the query
    items = query.limit(per_page).offset((page - 1) * per_page).all()
    
    # Calculate pagination metadata
    last_page = (total + per_page - 1) // per_page
    has_next = page < last_page
    has_prev = page > 1
    
    return {
        'items': items,
        'pagination': {
            'total': total,
            'per_page': per_page,
            'current_page': page,
            'last_page': last_page,
            'has_next': has_next,
            'has_prev': has_prev,
            'next_page': page + 1 if has_next else None,
            'prev_page': page - 1 if has_prev else None
        }
    }

def error_response(message, status_code=400):
    """
    Generate a standardized error response.
    
    Args:
        message: Error message
        status_code: HTTP status code
        
    Returns:
        Flask response object
    """
    response = jsonify({'error': message})
    response.status_code = status_code
    return response

def success_response(data=None, message=None, status_code=200):
    """
    Generate a standardized success response.
    
    Args:
        data: Response data
        message: Success message
        status_code: HTTP status code
        
    Returns:
        Flask response object
    """
    response_body = {}
    
    if data is not None:
        response_body.update(data)
        
    if message is not None:
        response_body['message'] = message
        
    response = jsonify(response_body)
    response.status_code = status_code
    return response

def log_exception(e):
    """
    Log an exception with detailed traceback.
    
    Args:
        e: Exception object
        
    Returns:
        None
    """
    error_traceback = traceback.format_exc()
    current_app.logger.error(f"Exception: {str(e)}\n{error_traceback}")

def camel_to_snake(name):
    """
    Convert camelCase string to snake_case.
    
    Args:
        name: camelCase string
        
    Returns:
        snake_case string
    """
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

def snake_to_camel(name):
    """
    Convert snake_case string to camelCase.
    
    Args:
        name: snake_case string
        
    Returns:
        camelCase string
    """
    components = name.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

def transform_keys(obj, transform_function):
    """
    Transform all dictionary keys using the provided function.
    
    Args:
        obj: Dictionary or list of dictionaries
        transform_function: Function to transform keys
        
    Returns:
        Object with transformed keys
    """
    if isinstance(obj, list):
        return [transform_keys(item, transform_function) for item in obj]
    elif isinstance(obj, dict):
        return {
            transform_function(key): transform_keys(value, transform_function)
            if isinstance(value, (dict, list)) else value
            for key, value in obj.items()
        }
    return obj