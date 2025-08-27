"""
Role-based access control decorators.
"""
from functools import wraps
from flask import jsonify, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity

from ..models.user import User

def role_required(required_role):
    """
    Decorator to check if the authenticated user has the required role.
    Usage: @role_required('admin') or @role_required(['admin', 'landlord'])
    
    Args:
        required_role: String or list of strings representing allowed role(s)
        
    Returns:
        Decorated function that only executes if user has required role
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            
            # Get claims to use for logging
            claims = get_jwt()
            
            user = User.query.get(user_id)
            if not user:
                current_app.logger.warning(
                    f"Access attempt with valid JWT but non-existent user_id: {user_id}"
                )
                return jsonify({"error": "User not found"}), 404
                
            if isinstance(required_role, (list, tuple, set)):
                if user.role not in required_role:
                    current_app.logger.warning(
                        f"Unauthorized access attempt: route requiring {required_role} " +
                        f"accessed by user {user_id} with {user.role} role"
                    )
                    return jsonify({"error": "Insufficient permissions"}), 403
            else:
                if user.role != required_role:
                    current_app.logger.warning(
                        f"Unauthorized access attempt: route requiring {required_role} " +
                        f"accessed by user {user_id} with {user.role} role"
                    )
                    return jsonify({"error": "Insufficient permissions"}), 403
                    
            return fn(*args, **kwargs)
        return decorator
    return wrapper


def admin_required(fn):
    """
    Decorator to require admin role for access to a route.
    
    Args:
        fn: Function to wrap
    
    Returns:
        Decorated function that only executes if user has admin role
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        
        user = User.query.get(user_id)
        if not user:
            current_app.logger.warning(
                f"Access attempt with valid JWT but non-existent user_id: {user_id}"
            )
            return jsonify({"error": "User not found"}), 404
            
        if user.role != 'admin':
            current_app.logger.warning(
                f"Unauthorized access attempt: admin route accessed by user {user_id} with {user.role} role"
            )
            return jsonify({'error': 'Admin access required'}), 403
            
        return fn(*args, **kwargs)
    return wrapper


def landlord_required(fn):
    """
    Decorator to require landlord role for access to a route.
    Admin can also access landlord routes.
    
    Args:
        fn: Function to wrap
    
    Returns:
        Decorated function that only executes if user has landlord or admin role
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        
        user = User.query.get(user_id)
        if not user:
            current_app.logger.warning(
                f"Access attempt with valid JWT but non-existent user_id: {user_id}"
            )
            return jsonify({"error": "User not found"}), 404
            
        if user.role not in ['landlord', 'admin']:
            current_app.logger.warning(
                f"Unauthorized access attempt: landlord route accessed by user {user_id} with {user.role} role"
            )
            return jsonify({'error': 'Landlord access required'}), 403
            
        return fn(*args, **kwargs)
    return wrapper


def tenant_required(fn):
    """
    Decorator to require tenant role for access to a route.
    Admin can also access tenant routes.
    
    Args:
        fn: Function to wrap
    
    Returns:
        Decorated function that only executes if user has tenant or admin role
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        
        user = User.query.get(user_id)
        if not user:
            current_app.logger.warning(
                f"Access attempt with valid JWT but non-existent user_id: {user_id}"
            )
            return jsonify({"error": "User not found"}), 404
            
        if user.role not in ['tenant', 'admin']:
            current_app.logger.warning(
                f"Unauthorized access attempt: tenant route accessed by user {user_id} with {user.role} role"
            )
            return jsonify({'error': 'Tenant access required'}), 403
            
        return fn(*args, **kwargs)
    return wrapper