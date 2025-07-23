"""
Status endpoints for application health monitoring.
"""
import time
import platform
from datetime import datetime
from flask import Blueprint, jsonify, current_app
from sqlalchemy import text
from ..extensions import db
from ..utils.monitoring import performance_monitor
from ..utils.error_handler import handle_api_error

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

bp = Blueprint("status", __name__, url_prefix="/api")

@bp.route("/status", methods=["GET"])
@handle_api_error
def status():
    """
    Enhanced health check endpoint for the API.
    Used by monitoring tools and load balancers.
    """
    start_time = time.time()
    
    # Collect status for various components
    status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "asset-anchor-api",
        "uptime": get_uptime(),
        "database": check_database(),
    }
    
    # Add system resources if psutil is available
    if HAS_PSUTIL:
        status["system"] = check_system_resources()
    
    # Add performance metrics from the monitor
    status["performance"] = performance_monitor.get_metrics()
    
    # Add response time to the response
    status["response_time"] = round(time.time() - start_time, 4)
    
    return jsonify(status)

@bp.route("/version", methods=["GET"])
def version():
    """
    Return the current API version.
    """
    return jsonify({
        "version": "1.0.0",
        "environment": current_app.config.get("ENV", "production"),
        "release_date": "2025-07-22",
        "platform": platform.platform(),
        "python_version": platform.python_version()
    })

def get_uptime():
    """Get application uptime"""
    if hasattr(current_app, "start_time"):
        uptime_seconds = time.time() - current_app.start_time
        return {
            "seconds": round(uptime_seconds, 1),
            "minutes": round(uptime_seconds / 60, 1),
            "hours": round(uptime_seconds / 3600, 1),
            "days": round(uptime_seconds / 86400, 1)
        }
    return {"seconds": 0}

def check_database():
    """Check database connection and status"""
    try:
        # Execute simple query to verify database connection
        result = db.session.execute(text('SELECT 1'))
        result.scalar()
        result.close()
        
        return {
            "status": "healthy",
            "connection": "ok"
        }
    except Exception as e:
        current_app.logger.error(f"Database health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

def check_system_resources():
    """Get system resource information"""
    try:
        return {
            "cpu_usage": round(psutil.cpu_percent(), 2),
            "memory_usage": round(psutil.virtual_memory().percent, 2),
            "disk_usage": round(psutil.disk_usage('/').percent, 2)
        }
    except Exception as e:
        current_app.logger.error(f"System resource check failed: {str(e)}")
        return {
            "status": "error",
            "error": str(e)
        }

@bp.route("/reset-metrics", methods=["POST"])
@handle_api_error
def reset_metrics():
    """Reset performance metrics (admin only)"""
    # TODO: Add admin-only authorization
    performance_monitor.reset_metrics()
    return jsonify({"success": True, "message": "Performance metrics reset successfully"})