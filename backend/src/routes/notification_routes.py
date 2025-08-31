# backend/src/routes/notification_routes.py
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..models.notification import Notification
from ..models.user import User
from ..extensions import db, limiter

# app.py registers this at url_prefix="/api/notifications"
notification_bp = Blueprint("notifications", __name__)

def _ok(payload, code=200):
    return jsonify(payload), code

def _err(msg, code=400):
    return jsonify({"error": msg}), code


@notification_bp.route("/", methods=["GET"])
@jwt_required()
@limiter.limit("480/hour")
def get_notifications():
    """
    Get notifications for the current user.
    Query params:
      - page (int, default 1)
      - per_page (int, default 20, max 100)
      - only_unread (bool)
    """
    uid = get_jwt_identity()
    try:
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(max(1, int(request.args.get("per_page", 20))), 100)
        only_unread = str(request.args.get("only_unread", "false")).lower() in {"1", "true", "yes", "on"}

        q = Notification.query.filter_by(user_id=uid)
        
        # Handle either is_read or read field
        if hasattr(Notification, 'is_read') and only_unread:
            q = q.filter_by(is_read=False)
        elif hasattr(Notification, 'read') and only_unread:
            q = q.filter_by(read=False)

        # Unread first, most recent first
        if hasattr(Notification, 'is_read'):
            q = q.order_by(Notification.is_read.asc(), Notification.created_at.desc())
        else:
            q = q.order_by(Notification.read.asc(), Notification.created_at.desc())

        pagination = q.paginate(page=page, per_page=per_page, error_out=False)
        return _ok({
            "notifications": [n.to_dict() for n in pagination.items],
            "total": pagination.total,
            "pages": pagination.pages,
            "page": page,
            "per_page": per_page,
        })
    except Exception as e:
        current_app.logger.exception("Failed to get notifications for user %s: %s", uid, str(e))
        return _err("Internal server error", 500)


@notification_bp.route("/<int:notification_id>", methods=["GET"])
@jwt_required()
@limiter.limit("960/hour")
def get_notification(notification_id: int):
    """Get a specific notification belonging to the current user."""
    uid = get_jwt_identity()
    try:
        n = Notification.query.filter_by(id=notification_id, user_id=uid).first()
        if not n:
            return _err("Notification not found", 404)
        return _ok({"notification": n.to_dict()})
    except Exception:
        current_app.logger.exception("Failed to get notification %s", notification_id)
        return _err("Internal server error", 500)


@notification_bp.route("/<int:notification_id>/read", methods=["PUT", "POST"])
@jwt_required()
@limiter.limit("240/hour")
def mark_as_read(notification_id: int):
    """Mark a notification as read."""
    uid = get_jwt_identity()
    try:
        n = Notification.query.filter_by(id=notification_id, user_id=uid).first()
        if not n:
            return _err("Notification not found", 404)
        
        # Update both read fields for compatibility
        if hasattr(n, 'is_read'):
            n.is_read = True
        if hasattr(n, 'read'):
            n.read = True
            
        n.read_at = datetime.utcnow()
        n.updated_at = datetime.utcnow()
        db.session.commit()
        
        return _ok({"message": "Notification marked as read", "notification": n.to_dict()})
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception("Failed to mark notification %s as read: %s", notification_id, str(e))
        return _err("Internal server error", 500)


@notification_bp.route("/mark-all-read", methods=["PUT", "POST"])
@jwt_required()
@limiter.limit("60/hour")
def mark_all_read():
    """Mark all notifications as read for the current user."""
    uid = get_jwt_identity()
    try:
        # Build query based on which field is present
        if hasattr(Notification, 'is_read'):
            q = Notification.query.filter_by(user_id=uid, is_read=False)
        else:
            q = Notification.query.filter_by(user_id=uid, read=False)
            
        now = datetime.utcnow()
        updated = 0
        for n in q.all():
            if hasattr(n, 'is_read'):
                n.is_read = True
            if hasattr(n, 'read'):
                n.read = True
            n.read_at = now
            n.updated_at = now
            updated += 1
            
        db.session.commit()
        return _ok({"message": "All notifications marked as read", "count": updated})
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception("Failed to mark all notifications read for user %s: %s", uid, str(e))
        return _err("Internal server error", 500)


@notification_bp.route("/<int:notification_id>", methods=["DELETE"])
@jwt_required()
@limiter.limit("120/hour")
def delete_notification(notification_id: int):
    """Delete a single notification."""
    uid = get_jwt_identity()
    try:
        n = Notification.query.filter_by(id=notification_id, user_id=uid).first()
        if not n:
            return _err("Notification not found", 404)
        db.session.delete(n)
        db.session.commit()
        return _ok({"message": "Notification deleted"})
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Failed to delete notification %s", notification_id)
        return _err("Internal server error", 500)


@notification_bp.route("/read-all", methods=["PUT", "POST"])
@jwt_required()
@limiter.limit("60/hour")
def read_all_notifications():
    """Alias for mark_all_read (legacy endpoint support)"""
    return mark_all_read()


@notification_bp.route("/clear-all", methods=["DELETE"])
@jwt_required()
@limiter.limit("30/hour")
def clear_all_notifications():
    """Delete all notifications for the current user."""
    uid = get_jwt_identity()
    try:
        q = Notification.query.filter_by(user_id=uid)
        count = q.count()
        # If you prefer a single SQL DELETE, ensure your ORM model supports it safely
        for n in q.all():
            db.session.delete(n)
        db.session.commit()
        return _ok({"message": "All notifications cleared", "count": count})
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Failed to clear notifications for user %s", uid)
        return _err("Internal server error", 500)


@notification_bp.route("/unread-count", methods=["GET"])
@jwt_required()
@limiter.limit("960/hour")
def get_unread_count():
    """Get count of unread notifications for the current user."""
    uid = get_jwt_identity()
    try:
        count = Notification.query.filter_by(user_id=uid, is_read=False).count()
        return _ok({"unread_count": count})
    except Exception:
        current_app.logger.exception("Failed to get unread count for user %s", uid)
        return _err("Internal server error", 500)


@notification_bp.route("/send", methods=["POST"])
@jwt_required()
@limiter.limit("60/hour")
def create_notification():
    """Create a new notification for the current user."""
    uid = get_jwt_identity()
    data: Dict[str, Any] = request.get_json(silent=True) or {}
    try:
        message = (data.get("message") or "").strip()
        if not message:
            return _err("Field 'message' is required", 400)

        n = Notification(
            user_id=uid,
            message=message,
            is_read=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.session.add(n)
        db.session.commit()
        return _ok({"message": "Notification created", "notification": n.to_dict()}, 201)
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Failed to create notification for user %s", uid)
        return _err("Internal server error", 500)


@notification_bp.route("/broadcast", methods=["POST"])
@jwt_required()
@limiter.limit("10/hour")
def broadcast_notification():
    """Send a notification to all users (admin-only if you wire role_required)."""
    data: Dict[str, Any] = request.get_json(silent=True) or {}
    try:
        message = (data.get("message") or "").strip()
        if not message:
            return _err("Field 'message' is required", 400)

        users = User.query.with_entities(User.id).all()
        if not users:
            return _ok({"message": "No users to notify", "notifications": []}, 201)

        notifications = []
        now = datetime.utcnow()
        for (user_id,) in users:
            n = Notification(
                user_id=user_id,
                message=message,
                is_read=False,
                created_at=now,
                updated_at=now,
            )
            db.session.add(n)
            notifications.append(n)

        db.session.commit()
        return _ok(
            {
                "message": "Notification broadcasted to all users",
                "count": len(notifications),
                "notifications": [n.to_dict() for n in notifications],
            },
            201,
        )
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Failed to broadcast notification")
        return _err("Internal server error", 500)
