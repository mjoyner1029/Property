from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from flask import jsonify, current_app

def role_required(role):
    """
    Decorator to check if the current user has the required role.
    
    Args:
        role: String or list/tuple/set of strings representing required role(s)
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            try:
                verify_jwt_in_request()
                claims = get_jwt()
                
                if isinstance(role, (list, tuple, set)):
                    if claims.get("role") not in role:
                        return jsonify({"error": "Unauthorized access"}), 403
                else:
                    if claims.get("role") != role:
                        return jsonify({"error": "Unauthorized access"}), 403
                        
                return fn(*args, **kwargs)
            except Exception as e:
                current_app.logger.error(f"Authorization error: {str(e)}")
                return jsonify({"error": "Authentication required"}), 401
                
        return decorator
    return wrapper

def admin_required(fn):
    """Decorator to check if the current user is an admin."""
    return role_required('admin')(fn)

def property_owner_required(fn):
    """Decorator to check if the current user is a property owner."""
    return role_required('landlord')(fn)

def tenant_or_owner_required(fn):
    """Decorator to check if the current user is either a tenant or property owner."""
    return role_required(['tenant', 'landlord'])(fn)