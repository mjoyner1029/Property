# backend/src/controllers/logs_controller.py
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple, List

from flask import Blueprint, request, jsonify, current_app, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import or_, and_, text

from ..extensions import db, limiter
from ..utils.role_required import role_required

# If you already have a SystemLog model in models/system_log.py,
# the import below will use it. Otherwise, a minimal fallback is defined.
try:
    from ..models.system_log import SystemLog  # type: ignore
    HAS_REAL_MODEL = True
except Exception:  # pragma: no cover - fallback for local iteration
    HAS_REAL_MODEL = False

    class SystemLog(db.Model):  # minimal fallback so routes don't crash in dev
        __tablename__ = "system_logs"

        id = db.Column(db.Integer, primary_key=True)
        user_id = db.Column(db.Integer, nullable=True, index=True)
        action = db.Column(db.String(64), nullable=False, index=True)
        resource = db.Column(db.String(128), nullable=True, index=True)
        details = db.Column(db.Text, nullable=True)
        ip_address = db.Column(db.String(64), nullable=True)
        user_agent = db.Column(db.String(256), nullable=True)
        meta = db.Column(db.JSON, nullable=True)
        created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

        def to_dict(self) -> Dict[str, Any]:
            return {
                "id": self.id,
                "user_id": self.user_id,
                "username": None,  # real model should join to User
                "action": self.action,
                "resource": self.resource,
                "details": self.details,
                "ip_address": self.ip_address,
                "user_agent": self.user_agent,
                "meta": self.meta,
                "created_at": self.created_at.replace(tzinfo=timezone.utc).isoformat(),
            }


# If available, use your existing User model to enrich log serialization.
try:
    from ..models.user import User
except Exception:  # pragma: no cover
    User = None  # type: ignore


logs_bp = Blueprint("logs", __name__, url_prefix="")

# --------------------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------------------
def _json() -> dict:
    return request.get_json(silent=True) or {}

def _ok(payload: Any, status: int = 200):
    return jsonify(payload), status

def _err(message: str, status: int = 400):
    return jsonify({"error": message}), status

def _parse_int(value: Any, default: int, *, minimum: Optional[int] = None, maximum: Optional[int] = None) -> int:
    try:
        i = int(value)
    except (TypeError, ValueError):
        return default
    if minimum is not None:
        i = max(minimum, i)
    if maximum is not None:
        i = min(maximum, i)
    return i

def _parse_iso_dt(s: Optional[str]) -> Optional[datetime]:
    """
    Accept common ISO-8601 forms including with trailing 'Z'.
    Return a timezone-aware UTC datetime.
    """
    if not s:
        return None
    try:
        s = s.strip()
        if s.endswith("Z"):
            # Python fromisoformat doesn't accept 'Z'
            dt = datetime.fromisoformat(s[:-1]).replace(tzinfo=timezone.utc)
        else:
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
        return dt
    except Exception:
        return None

def _serialize_log(row: SystemLog) -> Dict[str, Any]:
    # Try to enrich with user name if we have a User model
    username = None
    if User and getattr(row, "user_id", None):
        try:
            u = db.session.get(User, row.user_id)
            if u:
                username = getattr(u, "full_name", None) or getattr(u, "name", None) or getattr(u, "email", None)
        except Exception:
            username = None
    if hasattr(row, "to_dict"):
        base = row.to_dict()  # model can override
        if "username" not in base:
            base["username"] = username
        # Ensure created_at is serialized
        if isinstance(base.get("created_at"), datetime):
            base["created_at"] = base["created_at"].astimezone(timezone.utc).isoformat()
        return base

    # Generic fallback
    return {
        "id": row.id,
        "user_id": row.user_id,
        "username": username,
        "action": row.action,
        "resource": row.resource,
        "details": row.details,
        "ip_address": row.ip_address,
        "user_agent": row.user_agent,
        "meta": getattr(row, "meta", None),
        "created_at": (row.created_at or datetime.utcnow().replace(tzinfo=timezone.utc)).isoformat(),
    }

def _apply_filters(q, *, action: Optional[str], resource: Optional[str], user_id: Optional[int],
                   start: Optional[datetime], end: Optional[datetime], search: Optional[str]):
    if action:
        q = q.filter(SystemLog.action == action)
    if resource:
        q = q.filter(SystemLog.resource == resource)
    if user_id:
        q = q.filter(SystemLog.user_id == user_id)
    if start:
        q = q.filter(SystemLog.created_at >= start.replace(tzinfo=None))
    if end:
        q = q.filter(SystemLog.created_at <= end.replace(tzinfo=None))
    if search:
        like = f"%{search.strip()}%"
        q = q.filter(
            or_(
                SystemLog.details.ilike(like),
                SystemLog.ip_address.ilike(like),
                SystemLog.user_agent.ilike(like),
                SystemLog.resource.ilike(like),
                SystemLog.action.ilike(like),
            )
        )
    return q

def _parse_sort(sort_param: Optional[str]) -> Tuple[Any, bool]:
    """
    sort=field or sort=-field
    Supports: created_at (default), action, resource, user_id
    """
    field = "created_at"
    desc = True
    if sort_param:
        sort_param = sort_param.strip()
        desc = sort_param.startswith("-")
        sort_clean = sort_param[1:] if desc else sort_param
        if sort_clean in {"created_at", "action", "resource", "user_id"}:
            field = sort_clean
    column = getattr(SystemLog, field)
    return column, desc

def _as_csv(rows: List[SystemLog]) -> str:
    # Minimal CSV export. Escape commas/newlines.
    def esc(s: Optional[str]) -> str:
        if s is None:
            return ""
        s = str(s)
        if any(c in s for c in [",", "\n", '"']):
            return '"' + s.replace('"', '""') + '"'
        return s

    header = ["id", "user_id", "username", "action", "resource", "details", "ip_address", "user_agent", "created_at"]
    lines = [",".join(header)]
    for r in rows:
        d = _serialize_log(r)
        lines.append(",".join([esc(d.get(k)) for k in header]))
    return "\n".join(lines)


# --------------------------------------------------------------------------------------
# Public helper to log activity from other controllers/services
# --------------------------------------------------------------------------------------
def log_activity(
    action: str,
    resource: str,
    details: str = "",
    *,
    user_id: Optional[int] = None,
    meta: Optional[Dict[str, Any]] = None,
    request_obj=None,
) -> bool:
    """
    Persist an activity log row and also write to app logger.
    Returns True on success, False otherwise. Safe for use in except blocks.
    """
    try:
        ip_address = None
        user_agent = None
        if request_obj is None:
            request_obj = request
        if request_obj is not None:
            ip_address = request_obj.headers.get("X-Forwarded-For", "").split(",")[0].strip() or request_obj.remote_addr
            user_agent = request_obj.headers.get("User-Agent")

        # Prefer JWT identity if not explicitly provided
        actual_user_id = user_id
        if actual_user_id is None:
            try:
                actual_user_id = get_jwt_identity()
            except Exception:
                actual_user_id = None

        now = datetime.utcnow()

        # Persist to DB if model/table exists
        if db and SystemLog:
            row = SystemLog(
                user_id=actual_user_id,
                action=action,
                resource=resource,
                details=(details or "")[:4000],
                ip_address=(ip_address or "")[:64],
                user_agent=(user_agent or "")[:256],
                meta=meta or None,
                created_at=now,
            )
            db.session.add(row)
            db.session.commit()

        # Always log to application logger
        current_app.logger.info(
            "ACTIVITY user_id=%s action=%s resource=%s ip=%s ua=%s meta=%s details=%s",
            actual_user_id,
            action,
            resource,
            ip_address,
            (user_agent or "")[:120],
            (meta or {}),
            (details or "")[:500],
        )
        return True
    except Exception:  # pragma: no cover - do not raise from logger
        current_app.logger.exception("log_activity failed")
        try:
            if db.session.is_active:
                db.session.rollback()
        except Exception:
            pass
        return False


# --------------------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------------------

@logs_bp.route("/logs", methods=["GET"])
@jwt_required()
@role_required("admin")
@limiter.limit("120/hour")
def list_logs():
    """
    List logs with filters, pagination, search, sorting, and optional CSV export.

    Query params:
      page (int, default 1)
      per_page (int, default 20, max 200)
      action, resource (str)
      user_id (int)
      start_date, end_date (ISO-8601, accept trailing 'Z')
      q (str) - free-text search in details/ip/user_agent/resource/action
      sort (str) - e.g., '-created_at' (default), 'action', 'resource', 'user_id'
      export (str) - 'csv' to download CSV, otherwise JSON
    """
    try:
        page = _parse_int(request.args.get("page"), default=1, minimum=1)
        per_page = _parse_int(request.args.get("per_page"), default=20, minimum=1, maximum=200)

        action_filter = (request.args.get("action") or "").strip() or None
        resource_filter = (request.args.get("resource") or "").strip() or None
        user_id = request.args.get("user_id", type=int)
        start = _parse_iso_dt(request.args.get("start_date"))
        end = _parse_iso_dt(request.args.get("end_date"))
        search = (request.args.get("q") or "").strip() or None
        export = (request.args.get("export") or "").lower().strip() or None

        q = SystemLog.query
        q = _apply_filters(
            q,
            action=action_filter,
            resource=resource_filter,
            user_id=user_id,
            start=start,
            end=end,
            search=search,
        )

        sort_col, sort_desc = _parse_sort(request.args.get("sort"))
        q = q.order_by(sort_col.desc() if sort_desc else sort_col.asc())

        if export == "csv":
            # Respect filters; export all matching rows (cap at reasonable max to avoid abuse)
            capped = q.limit(10000).all()
            csv_str = _as_csv(capped)
            filename = f"system_logs_{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}.csv"
            return Response(
                csv_str,
                mimetype="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}"},
            )

        # JSON pagination
        items = q.paginate(page=page, per_page=per_page, error_out=False)
        return _ok(
            {
                "logs": [_serialize_log(r) for r in items.items],
                "total": items.total,
                "page": items.page,
                "per_page": items.per_page,
                "pages": items.pages,
            }
        )
    except Exception:
        current_app.logger.exception("Failed to list logs")
        return _err("Internal server error", 500)


@logs_bp.route("/logs/<int:log_id>", methods=["GET"])
@jwt_required()
@role_required("admin")
@limiter.limit("240/hour")
def get_log(log_id: int):
    """Get a single log by id (admin only)."""
    try:
        row = db.session.get(SystemLog, log_id)
        if not row:
            return _err("Log not found", 404)
        return _ok(_serialize_log(row))
    except Exception:
        current_app.logger.exception("Failed to fetch log")
        return _err("Internal server error", 500)


@logs_bp.route("/logs", methods=["POST"])
@jwt_required()
@role_required("admin")
@limiter.limit("60/minute")
def create_log():
    """
    Manually create a log entry (admin only).
    Body: { action:str, resource:str, details?:str, user_id?:int, meta?:object }
    """
    data = _json()
    try:
        action = (data.get("action") or "").strip()
        resource = (data.get("resource") or "").strip()
        details = (data.get("details") or "").strip()
        user_id = data.get("user_id")
        meta = data.get("meta") if isinstance(data.get("meta"), dict) else None

        if not action or not resource:
            return _err("action and resource are required", 422)

        if user_id is None:
            try:
                user_id = get_jwt_identity()
            except Exception:
                user_id = None

        ok = log_activity(
            action=action,
            resource=resource,
            details=details,
            user_id=user_id,
            meta=meta,
        )
        if not ok:
            return _err("Failed to write log", 500)

        # Return last inserted row if possible (best-effort)
        row = (
            SystemLog.query.order_by(SystemLog.id.desc()).first()
            if HAS_REAL_MODEL
            else None
        )
        return _ok({"message": "Log created", "log": _serialize_log(row) if row else None}, 201)
    except Exception:
        current_app.logger.exception("Failed to create log")
        return _err("Internal server error", 500)


@logs_bp.route("/logs/clear", methods=["POST"])
@jwt_required()
@role_required("admin")
@limiter.limit("20/hour")
def clear_logs():
    """
    Clear logs with optional filters (admin only).
    Body (all optional): { action, resource, user_id, start_date, end_date, q }
    Returns count of deleted rows.
    """
    data = _json()
    try:
        action_filter = (data.get("action") or "").strip() or None
        resource_filter = (data.get("resource") or "").strip() or None
        user_id = data.get("user_id")
        start = _parse_iso_dt(data.get("start_date"))
        end = _parse_iso_dt(data.get("end_date"))
        search = (data.get("q") or "").strip() or None

        q = SystemLog.query
        q = _apply_filters(
            q,
            action=action_filter,
            resource=resource_filter,
            user_id=user_id,
            start=start,
            end=end,
            search=search,
        )

        # Use synchronize_session=False for performance; logs are append-only
        count = q.delete(synchronize_session=False)
        db.session.commit()

        return _ok({"message": "Logs cleared", "count": int(count)})
    except SQLAlchemyError:
        current_app.logger.exception("DB error while clearing logs")
        db.session.rollback()
        return _err("Database error", 500)
    except Exception:
        current_app.logger.exception("Unexpected error while clearing logs")
        db.session.rollback()
        return _err("Internal server error", 500)


@logs_bp.route("/frontend-error", methods=["POST"])
@limiter.limit("60/minute")  # public endpoint, rate limited
def frontend_error():
    """
    Log client-side errors from the frontend (no auth required).
    Body:
      {
        "message": str,
        "stack": str,
        "url": str,
        "user_id": int?,     // optional (frontend-known)
        "meta": object?      // optional, small JSON (e.g., browser info)
      }
    """
    data = _json()
    try:
        msg = (data.get("message") or "Unknown error")[:1000]
        stack = (data.get("stack") or "")[:6000]
        url = (data.get("url") or "")[:1000]
        reported_uid = data.get("user_id")
        meta = data.get("meta") if isinstance(data.get("meta"), dict) else {}

        # Prefer authenticated identity if present (do not enforce)
        auth_uid = None
        try:
            if "Authorization" in request.headers:
                auth_uid = get_jwt_identity()
        except Exception:
            auth_uid = None
        user_id = auth_uid or reported_uid

        ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or request.remote_addr
        ua = request.headers.get("User-Agent", "")

        # Persist & log
        log_activity(
            action="frontend_error",
            resource="client",
            details=f"{msg}\nURL: {url}\nStack: {stack[:2000]}",
            user_id=user_id,
            meta={"url": url, "user_agent": ua[:256], "extra": meta},
        )

        current_app.logger.error(
            "FRONTEND ERROR user_id=%s ip=%s ua=%s url=%s msg=%s stack=%s",
            user_id, ip, ua[:120], url, msg, stack[:1000]
        )

        return _ok({"message": "Error logged"})
    except Exception:
        current_app.logger.exception("Failed to log frontend error")
        return _err("Failed to log error", 500)
