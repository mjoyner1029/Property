#!/usr/bin/env python3
# mock_app.py - Simple local development server without using the factory pattern
# This file is kept for reference but SHOULD NOT be used in development
# Instead, use: FLASK_APP=src.app FLASK_ENV=development flask run --host 127.0.0.1 --port 5050

import os
from flask import Flask, jsonify
from flask_cors import CORS
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Set up configuration - for simplified local development
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev-key-for-local-only'),
        JWT_SECRET_KEY=os.environ.get('JWT_SECRET_KEY', 'jwt-dev-key-for-local-only'),
        CORS_ORIGINS=os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001,http://localhost:3002'),
        DEBUG=os.environ.get('FLASK_DEBUG', 'true').lower() == 'true',
    )
    
    # Set up CORS - with proper configuration for local development
    origins = app.config['CORS_ORIGINS'].split(',') if isinstance(app.config['CORS_ORIGINS'], str) else app.config['CORS_ORIGINS']
    logger.info(f"Configuring CORS with origins: {origins}")
    CORS(app, resources={r"/*": {"origins": origins, "supports_credentials": True}})
    
    # Register routes
    @app.route('/health', methods=['GET'])
    def health():
        """Health check endpoint."""
        return jsonify({
            "status": "healthy",
            "version": "1.0.0",
            "git_sha": os.environ.get("GIT_SHA", "unknown")
        })
    
    @app.route('/api/health', methods=['GET'])
    def api_health():
        """API health check endpoint."""
        return jsonify({
            "status": "healthy", 
            "version": "1.0.0",
            "git_sha": os.environ.get("GIT_SHA", "unknown")
        })
    
    # Authentication endpoints
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        """Simple mock login endpoint for local development."""
        return jsonify({
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
            "refresh_token": "refresh-token-for-development",
            "user": {
                "id": 1,
                "name": "Test User",
                "email": "test@example.com",
                "role": "admin"
            },
            "message": "Login successful - development mode"
        })
    
    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", "5050"))
    logger.info(f"Starting app on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)
