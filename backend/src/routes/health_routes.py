"""
Health check endpoints for monitoring and deployment verification.
"""
import os
import subprocess
from flask import Blueprint, jsonify
from .. import db

bp = Blueprint('health', __name__, url_prefix='/api/health')

@bp.route('', methods=['GET'])
def health_check():
    """Basic health check endpoint."""
    return jsonify({'status': 'ok'})

@bp.route('/db', methods=['GET'])
def db_health_check():
    """Health check that verifies database connectivity."""
    try:
        # Simple query to check DB connection
        db.session.execute('SELECT 1').scalar()
        return jsonify({
            'status': 'ok',
            'database': 'connected'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'database': str(e)
        }), 500

@bp.route('/git', methods=['GET'])
def git_health_check():
    """Health check that returns the current git commit SHA."""
    try:
        # Get the git SHA for the current deployment
        sha = os.environ.get('GIT_SHA')
        
        # If not set via env var, try to get it directly
        if not sha:
            try:
                sha = subprocess.check_output(
                    ['git', 'rev-parse', 'HEAD'], 
                    stderr=subprocess.DEVNULL
                ).decode('ascii').strip()
            except:
                sha = 'unknown'
                
        return jsonify({
            'status': 'ok',
            'git_sha': sha
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
