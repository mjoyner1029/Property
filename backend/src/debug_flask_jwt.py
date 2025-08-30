"""
Debug script to test JWT configuration and token verification
"""

from flask import Flask
from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token,
    get_jwt_identity
)

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'super-secret-test-key'
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_TYPE'] = 'Bearer'
jwt = JWTManager(app)

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    identity = get_jwt_identity()
    return {'logged_in_as': identity}

def main():
    # Generate a token
    with app.app_context():
        token = create_access_token(identity=2)
        print(f"\nTest token: {token}\n")
        
        # Manual decode to check payload
        import jwt as pyjwt
        decoded = pyjwt.decode(token, options={'verify_signature': False})
        print(f"Decoded payload: {decoded}\n")
        
        # Test with Flask-JWT-Extended
        print("Using the token with Flask-JWT-Extended:")
        from flask import request
        with app.test_request_context(
            path='/protected',
            headers={'Authorization': f'Bearer {token}'}
        ):
            try:
                print(f"Headers: {request.headers}")
                identity = get_jwt_identity()
                print(f"Identity: {identity}, Type: {type(identity)}")
                print("JWT authentication successful!")
            except Exception as e:
                print(f"JWT authentication failed: {str(e)}")

if __name__ == '__main__':
    main()
