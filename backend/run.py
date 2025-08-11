import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Import create_app function
from src.app import create_app

# Set environment variables
os.environ.setdefault('SQLALCHEMY_DATABASE_URI', 'sqlite:///app.db')
os.environ.setdefault('SECRET_KEY', 'development-secret-key')
os.environ.setdefault('JWT_SECRET_KEY', 'development-jwt-secret')

# Create the Flask application
app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=True)