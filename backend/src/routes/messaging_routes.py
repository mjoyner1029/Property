# backend/src/routes/messages_routes.py
from __future__ import annotations

from typing import Any, Tuple

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..controllers.messaging_controller import (
    get_threads,
    create_thread,
    get_messages,
    send_message,
    mark_as_read,
    mark_thread_as_read,
    get_unread_count,
    get_contacts,
)
from ..extensions import limiter

# app.py should register this at url_prefix="/api/messages"
messaging_bp = Blueprint("messages", __name__)

# --- helpers -----------------------------------------------------------------

def _ok(payload, code=200):
    return jsonify(payload), code

def _err(msg, code=400):
    return jsonify({"error": msg}), code

def _normalize_response(result: Any):
    """
    Controllers may return (dict, status), a Flask Response, or just dict.
    Normalize to a Flask response.
    """
    # If it's already a Flask Response, just return it
    from flask.wrappers import Response
    if isinstance(result, Response):
        return result

    # If (payload, status) tuple
    if isinstance(result, tuple) and len(result) == 2:
        payload, status = result
        return _ok(payload, status)

    # Otherwise assume dict payload, 200 OK
    return _ok(result, 200)

# --- routes ------------------------------------------------------------------

@messaging_bp.route("/threads", methods=["GET"])
@jwt_required()
@limiter.limit("240/hour")
def list_threads():
    """
    GET /api/messages/threads
    Optional query params:
      - page (int)
      - per_page (int)
    """
    try:
        user_id = get_jwt_identity()
        # Pass through query params; controller may or may not use them
        params = dict(request.args)
        result = get_threads(user_id=user_id, **params)  # safe: kwargs-only usage if implemented
        return _normalize_response(result)
    except Exception:
        current_app.logger.exception("Failed to list message threads")
        return _err("Internal server error", 500)


@messaging_bp.route("/threads/<int:other_user_id>", methods=["POST"])
@jwt_required()
@limiter.limit("60/hour")
def create_thread_route(other_user_id: int):
    """
    POST /api/messages/threads/<other_user_id>
    Body may include metadata (subject, initial message, etc.) depending on controller.
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json(silent=True) or {}
        result = create_thread(user_id=user_id, other_user_id=other_user_id, data=data)
        return _normalize_response(result)
    except Exception:
        current_app.logger.exception("Failed to create thread with user %s", other_user_id)
        return _err("Internal server error", 500)


@messaging_bp.route("/threads/<int:thread_id>/messages", methods=["GET"])
@jwt_required()
@limiter.limit("480/hour")
def list_messages(thread_id: int):
    """
    GET /api/messages/threads/<thread_id>/messages
    Optional query params:
      - page (int)
      - per_page (int)
      - since_id (int)
    """
    try:
        user_id = get_jwt_identity()
        params = dict(request.args)
        result = get_messages(user_id=user_id, thread_id=thread_id, **params)
        return _normalize_response(result)
    except Exception:
        current_app.logger.exception("Failed to get messages for thread %s", thread_id)
        return _err("Internal server error", 500)


@messaging_bp.route("/threads/<int:thread_id>/messages", methods=["POST"])
@jwt_required()
@limiter.limit("120/hour")
def send_message_route(thread_id: int):
    """
    POST /api/messages/threads/<thread_id>/messages
    Body:
      - message (str) required
      - attachments? (list) optional
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json(silent=True) or {}
        if not data:
            return _err("Request body must be JSON", 400)
        result = send_message(user_id=user_id, thread_id=thread_id, data=data)
        return _normalize_response(result)
    except Exception:
        current_app.logger.exception("Failed to send message in thread %s", thread_id)
        return _err("Internal server error", 500)


@messaging_bp.route("/messages/<int:message_id>/read", methods=["PUT"])
@jwt_required()
@limiter.limit("240/hour")
def mark_message_read(message_id: int):
    """
    PUT /api/messages/messages/<message_id>/read
    """
    try:
        user_id = get_jwt_identity()
        result = mark_as_read(user_id=user_id, message_id=message_id)
        return _normalize_response(result)
    except Exception:
        current_app.logger.exception("Failed to mark message %s as read", message_id)
        return _err("Internal server error", 500)


@messaging_bp.route("/threads/<int:thread_id>/read", methods=["PUT"])
@jwt_required()
@limiter.limit("120/hour")
def mark_thread_read(thread_id: int):
    """
    PUT /api/messages/threads/<thread_id>/read
    """
    try:
        user_id = get_jwt_identity()
        result = mark_thread_as_read(user_id=user_id, thread_id=thread_id)
        return _normalize_response(result)
    except Exception:
        current_app.logger.exception("Failed to mark thread %s as read", thread_id)
        return _err("Internal server error", 500)


@messaging_bp.route("/unread-count", methods=["GET"])
@jwt_required()
@limiter.limit("960/hour")
def unread_count():
    """
    GET /api/messages/unread-count
    """
    try:
        user_id = get_jwt_identity()
        result = get_unread_count(user_id=user_id)
        return _normalize_response(result)
    except Exception:
        current_app.logger.exception("Failed to get unread count")
        return _err("Internal server error", 500)


@messaging_bp.route("/contacts", methods=["GET"])
@jwt_required()
@limiter.limit("480/hour")
def contacts():
    """
    GET /api/messages/contacts
    Optional query params: search (str), page/per_page
    """
    try:
        user_id = get_jwt_identity()
        params = dict(request.args)
        result = get_contacts(user_id=user_id, **params)
        return _normalize_response(result)
    except Exception:
        current_app.logger.exception("Failed to get contacts")
        return _err("Internal server error", 500)
