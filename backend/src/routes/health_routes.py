"""
Health check routes for the application.
These routes are always enabled and don't require authentication.
"""
from flask import Blueprint, jsonify, current_app
import os

health_bp = Blueprint('health', __name__)

@health_bp.route('/', methods=['GET'])
def health_check():
    """Basic health check endpoint"""
    git_sha = os.environ.get('GIT_SHA', 'unknown')
    return jsonify({
        'status': 'healthy',
        'version': current_app.config.get('VERSION', '1.0.0'),
        'git_sha': git_sha,
        'environment': current_app.config.get('ENV', 'development')
    })
