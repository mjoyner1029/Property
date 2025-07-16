"""
Status endpoints for application health monitoring.
"""
from flask import Blueprint, jsonify
from datetime import datetime

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
        "service": "property-management-api"
    })

@bp.route("/version", methods=["GET"])
def version():
    """
    Return the current API version.
    """
    return jsonify({
        "version": "1.0.0",
        "environment": "production"
    })