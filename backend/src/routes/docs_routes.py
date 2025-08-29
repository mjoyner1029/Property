"""
Routes for API documentation using Swagger UI.
"""
import os
from flask import Blueprint, jsonify, send_from_directory, current_app

# Rename from bp to docs_bp for consistency
docs_bp = Blueprint("docs", __name__, url_prefix="/api/docs")

@docs_bp.route("", methods=["GET"])
def api_docs():
    """
    Serve API documentation using Swagger UI.
    """
    # Simple JSON response as requested
    return jsonify({
        "message": "See API documentation",
        "info": "Documentation available at /api/docs/openapi.json"
    })

@docs_bp.route("/openapi.json", methods=["GET"])
def openapi_spec():
    """
    Serve OpenAPI specification file.
    """
    return send_from_directory(
        os.path.join(current_app.root_path, "static"), 
        "openapi.json"
    )