from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

from ..models.user import User

def role_required(required_role):
    """
    Decorator to check if the authenticated user has the required role.
    Usage: @role_required('admin') or @role_required(['admin', 'landlord'])
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            
            user = User.query.get(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
                
            if isinstance(required_role, list):
                if user.role not in required_role:
                    return jsonify({"error": "Insufficient permissions"}), 403
            else:
                if user.role != required_role:
                    return jsonify({"error": "Insufficient permissions"}), 403
                    
            return fn(*args, **kwargs)
        return decorator
    return wrapper