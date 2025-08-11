"""
Simple authentication test controller without model dependencies
"""
from flask import Blueprint, jsonify, request

test_auth_bp = Blueprint('test_auth', __name__)

@test_auth_bp.route('/test-login', methods=['POST'])
def test_login():
    """Test login endpoint with static credentials"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing email or password"}), 400
    
    # Hard-coded test credentials - accept any password for demo
    admin_email = "admin@assetanchor.io"
    
    if data.get('email') == admin_email:
        response = {
            "access_token": "test.token.1234567890",
            "user": {
                "id": 1,
                "name": "Admin User",
                "email": admin_email,
                "role": "admin",
                "onboarding_complete": True
            }
        }
        return jsonify(response), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401
