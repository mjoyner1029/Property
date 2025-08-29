from flask import Blueprint, jsonify, current_app
import platform
import os

api_bp = Blueprint("api_bp", __name__, url_prefix="/api")

@api_bp.get("/ping")
def ping():
    return jsonify({"status": "ok"}), 200

@api_bp.get("/status")
def status():
    """System status endpoint with basic version and environment info."""
    return jsonify({
        "status": "online",
        "version": current_app.config.get("VERSION", "1.0.0"),
        "environment": current_app.config.get("ENV", "development"),
        "python": platform.python_version(),
        "git_sha": os.environ.get("GIT_SHA", "unknown"),
    }), 200
