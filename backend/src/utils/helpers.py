# backend/src/utils/helpers.py
"""
General helper utilities for views, validation, and responses.
"""

from __future__ import annotations

import re
import json
import uuid
import traceback
from typing import Any, Callable, Dict, Iterable, Mapping, Optional, Tuple, Union

from flask import request, jsonify, current_app
from functools import wraps


# ---------------------------------------------------------------------
# ID / Parsing primitives
# ---------------------------------------------------------------------
def generate_unique_id(prefix: str = "") -> str:
    """
    Generate a unique identifier, optionally prefixed.
    """
    unique_id = str(uuid.uuid4())
    return f"{prefix}_{unique_id}" if prefix else unique_id


def _parse_bool(value: str) -> bool:
    return str(value).strip().lower() in {"true", "1", "yes", "on"}


def parse_query_params(
    allowed_params: Mapping[str, type],
    default_params: Optional[Mapping[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Parse and validate query parameters from `flask.request.args`.

    Args:
        allowed_params: mapping of {param_name: type} where type is one of
                        (str, int, float, bool, list)
        default_params: mapping of defaults

    Returns:
        dict of parsed parameters (defaults merged, only allowed keys included)
    """
    result: Dict[str, Any] = dict(default_params or {})

    for param, param_type in allowed_params.items():
        if param not in request.args:
            continue

        value = request.args.get(param, "")

        try:
            if param_type is int:
                result[param] = int(value)
            elif param_type is float:
                result[param] = float(value)
            elif param_type is bool:
                result[param] = _parse_bool(value)
            elif param_type is list:
                # Split on comma, drop empties, strip whitespace
                result[param] = [v.strip() for v in value.split(",") if v.strip()]
            else:
                # Default to string
                result[param] = value
        except (ValueError, TypeError):
            # Leave default intact if conversion fails
            current_app.logger.debug("Invalid value for query param %s=%r", param, value)

    return result


def get_pagination_params(
    *,
    page_param: str = "page",
    per_page_param: str = "per_page",
    default_page: int = 1,
    default_per_page: int = 20,
    max_per_page: int = 100,
) -> Tuple[int, int]:
    """
    Read and sanitize pagination params from the query string.
    """
    raw = parse_query_params(
        {page_param: int, per_page_param: int},
        {page_param: default_page, per_page_param: default_per_page},
    )
    page = max(1, int(raw.get(page_param, default_page)))
    per_page = max(1, min(max_per_page, int(raw.get(per_page_param, default_per_page))))
    return page, per_page


# ---------------------------------------------------------------------
# Pagination for SQLAlchemy queries
# ---------------------------------------------------------------------
def paginate(query, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
    """
    Paginate a SQLAlchemy query.

    Args:
        query: SQLAlchemy query object
        page: 1-based page index
        per_page: items per page (capped at 100)

    Returns:
        dict: {'items': [...], 'pagination': {...}}
    """
    page = max(1, int(page))
    per_page = max(1, min(100, int(per_page)))

    total = query.count()
    items = query.limit(per_page).offset((page - 1) * per_page).all()

    last_page = (total + per_page - 1) // per_page if total else 1
    has_next = page < last_page
    has_prev = page > 1

    return {
        "items": items,
        "pagination": {
            "total": total,
            "per_page": per_page,
            "current_page": page,
            "last_page": last_page,
            "has_next": has_next,
            "has_prev": has_prev,
            "next_page": page + 1 if has_next else None,
            "prev_page": page - 1 if has_prev else None,
        },
    }


# ---------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------
def error_response(
    message: str,
    status_code: int = 400,
    error_code: Optional[str] = None,
    details: Optional[Union[str, Dict[str, Any], Iterable[str]]] = None,
):
    """
    Standardized error response payload.
    """
    error_payload: Dict[str, Any] = {
        "success": False,
        "error": {"message": message, "status": status_code},
    }

    if error_code:
        error_payload["error"]["code"] = error_code
    if details is not None:
        error_payload["error"]["details"] = details

    # Propagate a request id if present
    rid = get_request_id()
    if rid:
        error_payload["request_id"] = rid

    resp = jsonify(error_payload)
    resp.status_code = status_code
    return resp


def success_response(
    data: Optional[Mapping[str, Any]] = None,
    message: Optional[str] = None,
    status_code: int = 200,
):
    """
    Standardized success response payload.
    """
    body: Dict[str, Any] = {}

    if data:
        body.update(dict(data))
    if message is not None:
        body["message"] = message

    rid = get_request_id()
    if rid:
        body["request_id"] = rid

    resp = jsonify(body)
    resp.status_code = status_code
    return resp


# ---------------------------------------------------------------------
# Logging / error handling
# ---------------------------------------------------------------------
def log_exception(e: BaseException) -> None:
    """
    Log an exception with detailed traceback and request metadata (if available).
    """
    trace = traceback.format_exc()
    meta = ""
    try:
        meta = f" | method={request.method} path={request.path} ip={get_client_ip()}"
    except Exception:
        pass
    current_app.logger.error("Exception: %s%s\n%s", str(e), meta, trace)


def handle_exceptions(
    *,
    status_code: int = 500,
    message: str = "Internal server error",
    log: bool = True,
):
    """
    Decorator to catch unhandled exceptions in a route and return a standard error payload.

    Example:
        @bp.get("/do-thing")
        @handle_exceptions(status_code=400, message="Failed to do thing")
        def do_thing():
            ...
    """

    def decorator(fn: Callable):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                return fn(*args, **kwargs)
            except Exception as e:
                if log:
                    log_exception(e)
                return error_response(message, status_code=status_code)

        return wrapper

    return decorator


def require_json(fn: Callable):
    """
    Decorator to enforce application/json requests.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not request.is_json:
            return error_response("Invalid content type; expected application/json", 415)
        return fn(*args, **kwargs)

    return wrapper


# ---------------------------------------------------------------------
# Request metadata helpers
# ---------------------------------------------------------------------
def get_client_ip() -> str:
    """
    Return the best-effort client IP (respects X-Forwarded-For).
    """
    xff = request.headers.get("X-Forwarded-For", "")
    if xff:
        # First IP is the original client
        return xff.split(",")[0].strip()
    return request.remote_addr or "unknown"


def get_request_id() -> str:
    """
    Return a request id if supplied by the client/proxy, otherwise empty string.
    (Common headers: X-Request-ID, X-Correlation-ID)
    """
    return (
        request.headers.get("X-Request-ID")
        or request.headers.get("X-Correlation-ID")
        or ""
    )


# ---------------------------------------------------------------------
# String / key transforms
# ---------------------------------------------------------------------
def camel_to_snake(name: str) -> str:
    """
    Convert camelCase or PascalCase to snake_case.
    """
    s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower()


def snake_to_camel(name: str) -> str:
    """
    Convert snake_case to camelCase.
    """
    components = name.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


def transform_keys(obj: Any, transform_function: Callable[[str], str]) -> Any:
    """
    Recursively transform dict keys using `transform_function`.
    """
    if isinstance(obj, list):
        return [transform_keys(item, transform_function) for item in obj]
    if isinstance(obj, dict):
        return {
            transform_function(str(key)): transform_keys(value, transform_function)
            if isinstance(value, (dict, list))
            else value
            for key, value in obj.items()
        }
    return obj


# ---------------------------------------------------------------------
# JSON helpers
# ---------------------------------------------------------------------
def safe_json_loads(text: str, default: Any = None) -> Any:
    """
    JSON parse with fallback default on error.
    """
    try:
        return json.loads(text)
    except Exception:
        return default


def safe_json_dumps(obj: Any, **kwargs) -> str:
    """
    JSON dumps with sensible defaults.
    """
    kwargs.setdefault("ensure_ascii", False)
    kwargs.setdefault("separators", (",", ":"))
    return json.dumps(obj, **kwargs)
