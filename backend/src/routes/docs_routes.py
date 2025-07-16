"""
Routes for API documentation using Swagger UI.
"""
import os
from flask import Blueprint, jsonify, render_template, send_from_directory, current_app

bp = Blueprint("docs", __name__, url_prefix="/api/docs")

@bp.route("", methods=["GET"])
def api_docs():
    """
    Serve API documentation using Swagger UI.
    """
    # In production, redirect to hosted docs
    if current_app.config.get("FLASK_ENV") == "production":
        return jsonify({
            "message": "API documentation available at: https://docs.yourdomain.com"
        })
    
    # In development, serve Swagger UI
    return render_template("swagger.html")

@bp.route("/openapi.json", methods=["GET"])
def openapi_spec():
    """
    Serve OpenAPI specification file.
    """
    return send_from_directory(
        os.path.join(current_app.root_path, "static"), 
        "openapi.json"
    )