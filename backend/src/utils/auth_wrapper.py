from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from flask_jwt_extended.exceptions import NoAuthorizationError

def jwt_or_token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return jwt_required()(f)(*args, **kwargs)
        except NoAuthorizationError:
            return jsonify({
                "error": "Unauthorized", 
                "message": "A valid token is required to access this endpoint"
            }), 401
    return decorated_function
