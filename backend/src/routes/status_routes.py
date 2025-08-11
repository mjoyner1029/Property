"""
Status endpoints for application health monitoring.
"""
from flask import Blueprint, jsonify, current_app
from datetime import datetime
import sqlalchemy

bp = Blueprint("status", __name__, url_prefix="/api")

@bp.route("/status", methods=["GET"])
def status():
    """
    Basic health check endpoint for the API.
    Used by monitoring tools and load balancers.
    """
    return jsonify({
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "asset-anchor-api",
        "version": current_app.config.get("VERSION", "1.0.0"),
        "environment": current_app.config.get("ENV", "development")
    })

@bp.route("/health", methods=["GET"])
def health_check():
    """
    Full health check endpoint that checks database connectivity.
    Used by deployment services and monitoring.
    """
    db_healthy = True
    try:
        # Check database connection
        result = current_app.db.session.execute(sqlalchemy.text("SELECT 1"))
        result.close()
    except Exception as e:
        current_app.logger.error(f"Database health check failed: {str(e)}")
        db_healthy = False
    
    return jsonify({
        "status": "healthy" if db_healthy else "unhealthy",
        "database": "connected" if db_healthy else "disconnected",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }), 200 if db_healthy else 503

@bp.route("/version", methods=["GET"])
def version():
    """
    Return the current API version.
    """
    return jsonify({
        "version": "1.0.0",
        "environment": "production"
    })