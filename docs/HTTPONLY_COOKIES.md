# Backend HttpOnly Cookie Implementation Guide

This document explains how to implement httpOnly cookies for secure token handling in the Flask backend.

## Overview

We've updated the frontend to use a memory-first token approach. Now, we need to update the backend to:
1. Send refresh tokens in httpOnly cookies
2. Accept refresh tokens from cookies for token refresh
3. Properly handle CORS for secure cookie sharing

## Implementation Steps

### 1. Update Auth Routes

```python
# backend/src/routes/auth_routes.py

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    # Authenticate user and generate tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    response = jsonify({
        "access_token": access_token,
        "user": user.to_dict()
    })
    
    # Set refresh token as httpOnly cookie (not accessible via JavaScript)
    response.set_cookie(
        'refresh_token',
        value=refresh_token,
        httponly=True,
        secure=True,   # Only sent over HTTPS
        samesite='Strict',  # Prevents CSRF
        max_age=30*24*60*60  # 30 days in seconds
    )
    
    return response

@auth_bp.route('/refresh', methods=['POST'])
@jwt_refresh_token_required
def refresh():
    # JWT extension automatically validates the cookie
    current_user = get_jwt_identity()
    access_token = create_access_token(identity=current_user)
    
    return jsonify({"access_token": access_token})

@auth_bp.route('/logout', methods=['POST'])
def logout():
    response = jsonify({"message": "Logged out successfully"})
    
    # Clear the refresh token cookie
    response.delete_cookie(
        'refresh_token',
        httponly=True,
        secure=True,
        samesite='Strict'
    )
    
    return response
```

### 2. Configure JWT Extension

```python
# backend/src/app.py or extensions.py

from flask_jwt_extended import JWTManager

jwt = JWTManager(app)

# Configure JWT to read tokens from cookies for specific endpoints
app.config['JWT_TOKEN_LOCATION'] = ['cookies', 'headers']

# Only use cookies for refresh tokens, not for access tokens
app.config['JWT_COOKIE_CSRF_PROTECT'] = True
app.config['JWT_CSRF_CHECK_FORM'] = False
app.config['JWT_CSRF_METHODS'] = ['POST', 'PUT', 'PATCH', 'DELETE']
```

### 3. Configure CORS Properly

```python
# backend/src/app.py or extensions.py

from flask_cors import CORS

# Configure CORS to allow cookies
CORS(app, supports_credentials=True, origins=[
    "http://localhost:3000",  # Dev frontend
    "https://app.assetanchor.com"  # Production frontend
])
```

### 4. Update Error Handling

```python
# backend/src/app.py

from flask_jwt_extended.exceptions import NoAuthorizationError, InvalidHeaderError
from jwt.exceptions import ExpiredSignatureError, DecodeError

@app.errorhandler(ExpiredSignatureError)
def handle_expired_token(e):
    return jsonify({"error": "Token has expired"}), 401

@app.errorhandler(NoAuthorizationError)
@app.errorhandler(InvalidHeaderError)
def handle_auth_error(e):
    return jsonify({"error": "Invalid or missing authorization"}), 401

@app.errorhandler(DecodeError)
def handle_decode_error(e):
    return jsonify({"error": "Token could not be decoded"}), 401
```

### 5. Testing The Implementation

1. Login route should return an access token in the response body and set a refresh token as an httpOnly cookie
2. Any API requests requiring auth should include the access token in the Authorization header
3. Refresh route should accept the httpOnly refresh token from the cookie and return a new access token
4. Logout route should clear the refresh token cookie

### Security Benefits

1. XSS protection: Attackers can't access the refresh token via JavaScript
2. CSRF protection: samesite=strict prevents cross-site request forgery
3. Reduced exposure: Access tokens live only in memory for the current session
4. Automatic expiry: Cookies can have a secure expiration policy

### Browser Dev Tools

To verify cookies are being set correctly:
1. Open Chrome DevTools > Application > Storage > Cookies
2. Look for cookies from your domain
3. Verify the HttpOnly flag is set to "Yes" for refresh_token
