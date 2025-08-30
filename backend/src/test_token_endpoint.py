"""
Test script to validate JWT tokens and authorization in a minimal test case.
"""

from flask import Flask, jsonify, request
from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token,
    get_jwt_identity
)

# Create a minimal app for testing
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'test-key-for-jwt'
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_TYPE'] = 'Bearer'
jwt = JWTManager(app)

# Add a test endpoint
@app.route('/api/test/protected', methods=['GET'])
@jwt_required()
def protected():
    # Get the JWT identity and return it
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

@app.route('/api/test/token', methods=['POST'])
def get_token():
    # Generate and return a test token
    access_token = create_access_token(identity=2)
    return jsonify(access_token=access_token), 200

@app.route('/api/test/check-auth', methods=['GET'])
def check_auth():
    # Print and return the Authorization header
    auth_header = request.headers.get('Authorization')
    return jsonify(
        has_auth_header=auth_header is not None,
        auth_header=auth_header
    ), 200

if __name__ == '__main__':
    app.run(debug=True)
