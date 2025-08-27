"""
DEPRECATED: This file is no longer used. 
Use backend/src/utils/role_required.py instead, which has enhanced functionality 
including proper logging, admin_required, landlord_required, and tenant_required decorators.

This file is kept as a backup reference only and should be removed in future releases.
"""

from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from flask import jsonify

def role_required(role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if isinstance(role, (list, tuple, set)):
                if claims.get("role") not in role:
                    return jsonify({"error": "Unauthorized"}), 403
            else:
                if claims.get("role") != role:
                    return jsonify({"error": "Unauthorized"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper