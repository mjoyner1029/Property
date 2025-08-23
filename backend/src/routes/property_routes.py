# backend/src/routes/property_routes.py
from __future__ import annotations

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..controllers.property_controller import (
    get_properties,
    get_property,
    create_property,
    update_property,
    delete_property,
)
from ..extensions import limiter

# app.py registers this at url_prefix="/api/properties"
property_bp = Blueprint("property", __name__)

def _ok(payload, code=200):
    return jsonify(payload), code

def _err(msg, code=400):
    return jsonify({"error": msg}), code


@property_bp.route("/", methods=["GET"])
@jwt_required()
@limiter.limit("240/hour")
def list_properties():
    """
    GET /api/properties
    Optional query params are passed through to the controller as filters.
    """
    try:
        # Common filters (extend as your controller supports them)
        filters = {
            k: v
            for k, v in request.args.items()
            if v not in (None, "", "null")
        }
        payload, status = get_properties(filters=filters)
        return _ok(payload, status)
    except Exception:
        current_app.logger.exception("Failed to list properties")
        return _err("Internal server error", 500)


@property_bp.route("/<int:property_id>", methods=["GET"])
@jwt_required()
@limiter.limit("480/hour")
def fetch_property(property_id: int):
    """
    GET /api/properties/<property_id>
    """
    try:
        payload, status = get_property(property_id)
        return _ok(payload, status)
    except Exception:
        current_app.logger.exception("Failed to get property %s", property_id)
        return _err("Internal server error", 500)


@property_bp.route("/", methods=["POST"])
@jwt_required()
@limiter.limit("60/hour")
def create_property_route():
    """
    POST /api/properties
    Body: JSON for property creation; passed to controller as-is.
    """
    try:
        data = request.get_json(silent=True) or {}
        if not data:
            return _err("Request body must be JSON", 400)
        # If your controller expects the creator/owner, include it:
        data.setdefault("created_by", get_jwt_identity())
        payload, status = create_property(data)
        return _ok(payload, status)
    except Exception:
        current_app.logger.exception("Failed to create property")
        return _err("Internal server error", 500)


@property_bp.route("/<int:property_id>", methods=["PUT"])
@jwt_required()
@limiter.limit("120/hour")
def update_property_route(property_id: int):
    """
    PUT /api/properties/<property_id>
    Body: JSON for property update.
    """
    try:
        data = request.get_json(silent=True) or {}
        if data is None:
            return _err("Request body must be JSON", 400)
        payload, status = update_property(property_id, data)
        return _ok(payload, status)
    except Exception:
        current_app.logger.exception("Failed to update property %s", property_id)
        return _err("Internal server error", 500)


@property_bp.route("/<int:property_id>", methods=["DELETE"])
@jwt_required()
@limiter.limit("60/hour")
def delete_property_route(property_id: int):
    """
    DELETE /api/properties/<property_id>
    """
    try:
        payload, status = delete_property(property_id)
        return _ok(payload, status)
    except Exception:
        current_app.logger.exception("Failed to delete property %s", property_id)
        return _err("Internal server error", 500)
