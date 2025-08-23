# backend/src/controllers/logs_controller.py
from __future__ import annotations

from datetime import datetime
from typing import List, Tuple, Optional, Dict, Any

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError

from ..models.user import User
from ..extensions import db, limiter
from ..utils.role_required import role_required

logs_bp = Blueprint("logs", __name__)

# -----------------------------------------------------------------------------
# Placeholder "model" — replace with your real SQLAlchemy model and queries
# -----------------------------------------------------------------------------
class SystemLog:
    def __init__(self, id: int, user_id: int, action: str, resource: str, details: str, ip_address: str, created_at: datetime):
        self.id = id
        self.user_id = user_id
        self.action = action
        self.resource = resource
        self.details = details
        self.ip_address = ip_address
        self.created_at = created_at

    @staticmethod
    def get_logs(page: int = 1, per_page: int = 20, action_filter: Optional[str] = None,
                 resource_filter: Optional[str] = None, start: Optional[datetime] = None,
                 end: Optional[datetime] = None, user_id: Optional[int] = None) -> Tuple[List["SystemLog"], int]:
        """
        Placeholder for actual database query (apply filters and pagination).
        Replace with a query like:
          q = RealLogModel.query
          if action_filter: q = q.filter(RealLogModel.action == action_filter)
          ...
          items = q.order_by(RealLogModel.created_at.desc()).paginate(page=page, per_page=per_page)
          return items.items, items.total
        """
        sample = [
            SystemLog(1, 1, "login", "auth", "User logged in", "192.168.1.1", datetime.utcnow()),
            SystemLog(2, 2, "create", "property", "Created new property", "192.168.1.2", datetime.utcnow()),
            SystemLog(3, 1, "update", "user", "Updated profile", "192.168.1.1", datetime.utcnow()),
        ]
        # naive filter just for demonstration
        out = []
        for s in sample:
            if action_filter and s.action != action_filter:
                continue
            if resource_filter and s.resource != resource_filter:
                continue
            if user_id and s.user_id != user_id:
                continue
            if start and s.created_at < start:
                continue
            if end and s.created_at > end:
                continue
            out.append(s)
        total = len(out)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        return out[start_idx:end_idx], total

    @staticmethod
    def get_log(log_id: int) -> Optional["SystemLog"]:
        """Placeholder for getting a specific log."""
        if log_id == 1:
            return SystemLog(1, 1, "login", "auth", "User logged in", "192.168.1.1", datetime.utcnow())
        return None

    def to_dict(self) -> Dict[str, Any]:
        user = User.query.get(self.user_id)
        username = user.name if user else "Unknown"
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": username,
            "action": self.action,
            "resource": self.resource,
            "details": self.details,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# -----------------------------------------------------------------------------
# Utilities
# -----------------------------------------------------------------------------
def _json() -> dict:
    return request.get_json(silent=True) or {}

def _parse_dt(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        # Accept ISO strings; extend as needed
        return datetime.fromisoformat(s)
    except Exception:
        return None

def _ok(payload, code: int = 200):
    return jsonify(payload), code

def _err(msg: str, code: int = 400):
    return jsonify({"error": msg}), code


def log_activity(user_id: int, action: str, resource: str, details: str, request_obj=None) -> bool:
    """
    Utility to log server-side activity (stub).
    Replace with real DB write including ip_address and created_at.
    """
    try:
        ip_address = getattr(request_obj, "remote_addr", None) if request_obj else None
        ip_address = ip_address or request.remote_addr or "unknown"
        current_app.logger.info(
            "ACTIVITY: user_id=%s action=%s resource=%s ip=%s details=%s",
            user_id, action, resource, ip_address, details[:500],
        )
        # Real implementation:
        # log = RealLogModel(user_id=user_id, action=action, resource=resource,
        #                    details=details, ip_address=ip_address, created_at=datetime.utcnow())
        # db.session.add(log); db.session.commit()
        return True
    except Exception:
        current_app.logger.exception("Failed to log activity")
        return False


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------

@logs_bp.route("/logs", methods=["GET"])
@jwt_required()
@role_required("admin")
@limiter.limit("120/hour")
def get_logs():
    """Get system logs with filtering and pagination (admin only)."""
    try:
        page = max(1, int(request.args.get("page", 1)))
        per_page = int(request.args.get("per_page", 20))
        per_page = max(1, min(per_page, 200))  # clamp

        action_filter = request.args.get("action") or None
        resource_filter = request.args.get("resource") or None
        start_date = _parse_dt(request.args.get("start_date"))
        end_date = _parse_dt(request.args.get("end_date"))
        user_id = request.args.get("user_id", type=int)

        logs, total = SystemLog.get_logs(
            page=page,
            per_page=per_page,
            action_filter=action_filter,
            resource_filter=resource_filter,
            start=start_date,
            end=end_date,
            user_id=user_id,
        )

        return _ok(
            {
                "logs": [l.to_dict() for l in logs],
                "total": total,
                "page": page,
                "per_page": per_page,
            }
        )
    except Exception:
        current_app.logger.exception("Failed to fetch logs")
        return _err("Internal server error", 500)


@logs_bp.route("/logs/<int:log_id>", methods=["GET"])
@jwt_required()
@role_required("admin")
@limiter.limit("240/hour")
def get_log_details(log_id: int):
    """Get details for a specific log entry (admin only)."""
    try:
        log = SystemLog.get_log(log_id)
        if not log:
            return _err("Log not found", 404)
        return _ok(log.to_dict())
    except Exception:
        current_app.logger.exception("Failed to fetch log details")
        return _err("Internal server error", 500)


@logs_bp.route("/logs/clear", methods=["POST"])
@jwt_required()
@role_required("admin")
@limiter.limit("20/hour")
def clear_logs():
    """
    Clear logs (admin only).
    In a real implementation, accept optional filters to delete a subset of records.
    """
    try:
        # Example: data = _json(); apply filters; db.session.query(...).delete()
        # db.session.commit(); return count
        cleared = 0
        return _ok({"message": "Logs cleared successfully", "count": cleared})
    except SQLAlchemyError as exc:
        current_app.logger.exception("DB error clearing logs")
        return _err("Database error", 500)
    except Exception:
        current_app.logger.exception("Unexpected error clearing logs")
        return _err("Internal server error", 500)


@logs_bp.route("/frontend-error", methods=["POST"])
@limiter.limit("60/minute")  # no auth; protect with rate limit
def frontend_error():
    """
    Log client-side errors from the frontend.
    Body: { message, stack, url, user_id? }
    Auth is optional; we avoid decoding JWTs here.
    """
    data = _json()
    try:
        error_message = (data.get("message") or "Unknown error")[:1000]
        error_stack = (data.get("stack") or "")[:4000]
        error_url = (data.get("url") or "")[:1000]
        user_agent = request.headers.get("User-Agent", "")
        reported_user_id = data.get("user_id")

        # If the request is authenticated, prefer that user id
        auth_user_id = None
        try:
            if "Authorization" in request.headers:
                # Only safe to call within a JWT context; here we just avoid raising
                auth_user_id = get_jwt_identity()
        except Exception:
            auth_user_id = None

        uid = auth_user_id or reported_user_id

        current_app.logger.error(
            "FRONTEND ERROR: %s\nURL: %s\nUser ID: %s\nUser Agent: %s\nStack: %s",
            error_message, error_url, uid, user_agent, error_stack
        )

        # Real implementation: persist to DB
        # db.session.add(ClientErrorLog(...)); db.session.commit()

        return _ok({"message": "Error logged"}), 200

    except Exception:
        current_app.logger.exception("Failed to log frontend error")
        return _err("Failed to log error", 500)
