"""
WSGI entry point for the Property Management application.
"""

import os
import sys
import logging

# Add the project root directory to Python's path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Define the environment
APP_ENV = os.getenv("APP_ENV", os.getenv("FLASK_ENV", "development")).lower()

# Import create_app function
from src.app import create_app

# Create the Flask application
app = create_app(APP_ENV)

# Production-specific verifications
if APP_ENV == "production":
    logging.info("Starting Asset Anchor in production mode")
    
    # Verify critical environment variables are set
    required_vars = ["SECRET_KEY", "JWT_SECRET_KEY", "DATABASE_URL"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        raise EnvironmentError(f"Missing required environment variables: {', '.join(missing_vars)}")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)