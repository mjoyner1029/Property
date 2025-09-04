"""
Health check routes for the application.
These routes are always enabled and don't require authentication.
"""
from flask import Blueprint, jsonify, current_app
from sqlalchemy import text
import os

from ..extensions import db, limiter
from ..services.migration_service import check_database_connection, is_database_migrated

health_bp = Blueprint('health', __name__)

@health_bp.route('/', methods=['GET'])
@limiter.exempt
def health_check():
    """Basic health check endpoint - never depends on DB"""
    git_sha = os.environ.get('GIT_SHA', 'unknown')
    return jsonify({
        'status': 'healthy',
        'version': current_app.config.get('VERSION', '1.0.0'),
        'git_sha': git_sha,
        'environment': current_app.config.get('ENV', 'development')
    }), 200

@health_bp.route('/healthz', methods=['GET'])
@limiter.exempt
def healthz():
    """Simple health check endpoint for Render - never depends on DB"""
    return jsonify({"status": "ok"}), 200

@health_bp.route('/readyz', methods=['GET'])
@limiter.exempt
def readyz():
    """Readiness probe that checks database connectivity and migration status"""
    response = {"status": "ready", "checks": {}}
    status_code = 200
    
    # Check the database connection
    if check_database_connection():
        response["checks"]["database"] = "connected"
        
        # Only check migrations if DB connection is working
        if is_database_migrated():
            response["checks"]["migrations"] = "up-to-date"
        else:
            response["checks"]["migrations"] = "outdated"
            response["status"] = "degraded"
            status_code = 503
    else:
        response["checks"]["database"] = "disconnected"
        response["status"] = "degraded"
        status_code = 503
    
    return jsonify(response), status_code
