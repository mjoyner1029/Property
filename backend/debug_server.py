#!/usr/bin/env python3
import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Import Flask and necessary modules
from flask import Flask, jsonify
from src.models.user import User
from src.extensions import db

# Create a simple Flask app
app = Flask(__name__)

# Configure the app
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database
db.init_app(app)

@app.route('/api/debug/users', methods=['GET'])
def list_users():
    """Get all users for debugging"""
    with app.app_context():
        try:
            users = User.query.all()
            return jsonify({
                'status': 'success',
                'user_count': len(users),
                'users': [{'id': u.id, 'email': u.email, 'role': u.role} for u in users]
            }), 200
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500

@app.route('/api/debug/ping', methods=['GET'])
def ping():
    """Simple ping endpoint for checking if server is running"""
    return jsonify({
        'status': 'success',
        'message': 'pong',
        'server': 'Asset Anchor API Debug Server'
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5051, debug=True)
