"""
WSGI entry point for the Property Management application.
"""

import os
import sys

# Add the project root directory to Python's path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Import create_app function
from src.app import create_app

# Create the Flask application
app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)