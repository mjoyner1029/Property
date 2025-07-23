# backend/src/utils/error_handler.py
import traceback
import logging
from flask import jsonify
from werkzeug.exceptions import HTTPException
from functools import wraps

# Configure logger
logger = logging.getLogger('asset_anchor')

class APIError(Exception):
    """Custom exception for API errors with status code and message"""
    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        result = dict(self.payload or {})
        result['error'] = self.message
        return result

def handle_api_error(func):
    """Decorator to handle exceptions in API routes"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except APIError as e:
            # Log API errors with appropriate level based on status code
            if e.status_code >= 500:
                logger.error(f"API Error: {e.message}", exc_info=True)
            else:
                logger.warning(f"API Error: {e.message}", exc_info=True)
                
            response = jsonify(e.to_dict())
            response.status_code = e.status_code
            return response
        except HTTPException as e:
            # Handle standard HTTP exceptions
            logger.warning(f"HTTP Exception: {str(e)}", exc_info=True)
            return jsonify(error=str(e)), e.code
        except Exception as e:
            # Log unexpected exceptions as errors
            error_id = generate_error_id()
            logger.critical(
                f"Unexpected error (ID: {error_id}): {str(e)}", 
                exc_info=True
            )
            
            # In production, don't expose internal error details
            error_message = f"An unexpected error occurred (ID: {error_id})"
            if not is_production():
                error_message = f"{error_message}: {str(e)}"
                
            return jsonify(error=error_message), 500
    
    return wrapper

def generate_error_id():
    """Generate a unique ID for error tracking"""
    import uuid
    return str(uuid.uuid4())[:8]

def is_production():
    """Check if application is running in production mode"""
    from flask import current_app
    return not current_app.debug

def validation_error(errors, status_code=422):
    """Create a validation error response"""
    return jsonify({
        'error': 'Validation error',
        'errors': errors
    }), status_code

def format_exception():
    """Format the current exception for logging"""
    return ''.join(traceback.format_exception(*traceback.sys.exc_info()))
