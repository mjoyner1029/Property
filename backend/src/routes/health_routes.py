"""
Health check routes for the application.
These routes are always enabled and don't require authentication.
"""
from flask import Blueprint, jsonify, current_app
from sqlalchemy import text
import os

from ..extensions import db, limiter

health_bp = Blueprint('health', __name__)

@health_bp.route('/', methods=['GET'])
@limiter.exempt
def health_check():
    """Basic health check endpoint"""
    git_sha = os.environ.get('GIT_SHA', 'unknown')
    return jsonify({
        'status': 'healthy',
        'version': current_app.config.get('VERSION', '1.0.0'),
        'git_sha': git_sha,
        'environment': current_app.config.get('ENV', 'development')
    })

@health_bp.route('/healthz', methods=['GET'])
@limiter.exempt
def healthz():
    """Simple health check endpoint for Render - never depends on DB"""
    return jsonify({"status": "ok"}), 200

@health_bp.route('/readyz', methods=['GET'])
@limiter.exempt
def readyz():
    """Readiness probe that checks database connectivity"""
    try:
        # Check the database connection
        db.session.execute(text("SELECT 1"))
        return jsonify({"status": "ready", "db": "connected"}), 200
    except Exception as e:
        current_app.logger.warning(f"Database health check failed: {str(e)}")
        return jsonify({"status": "degraded", "message": "Database connection failed"}), 503
