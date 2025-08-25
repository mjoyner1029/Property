# backend/src/utils/performance.py
"""
Database and function performance utilities.

Enable SQL logging with:
  ENABLE_SLOW_QUERY_LOGGING=1
Configure threshold (milliseconds) with:
  SLOW_QUERY_THRESHOLD=100  (default 100ms)
Optionally override via Flask app config:
  app.config["ENABLE_SLOW_QUERY_LOGGING"] = True/False
  app.config["SLOW_QUERY_THRESHOLD"] = 100
"""

from __future__ import annotations

import logging
import os
import time
from functools import wraps
from typing import Any, Callable, Optional

from sqlalchemy import event
from sqlalchemy.engine import Engine

try:
    # Add request context details if Flask is available
    from flask import has_request_context, request
except Exception:  # pragma: no cover
    has_request_context = lambda: False  # type: ignore
    request = None  # type: ignore


# ----------------------------
# Helpers
# ----------------------------
def _env_bool(name: str, default: bool = False) -> bool:
    v = os.getenv(name)
    return default if v is None else str(v).strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    v = os.getenv(name)
    if v is None:
        return default
    try:
        return int(v)
    except ValueError:
        return default


# ----------------------------
# Logging setup
# ----------------------------
LOG_DIR = os.getenv("LOG_DIR", "logs")
os.makedirs(LOG_DIR, exist_ok=True)

logger = logging.getLogger("slow_query")
if not logger.handlers:  # avoid duplicate handlers when reloaded
    file_handler = logging.FileHandler(os.path.join(LOG_DIR, "slow_queries.log"))
    file_handler.setFormatter(
        logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    )
    logger.addHandler(file_handler)
    # Mirror to stderr in dev for quick visibility
    if _env_bool("SLOW_QUERY_STDERR", True):
        stderr_handler = logging.StreamHandler()
        stderr_handler.setFormatter(
            logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
        )
        logger.addHandler(stderr_handler)
logger.setLevel(logging.INFO)
logger.propagate = False

# Defaults (can be overridden in init_slow_query_logging via app.config)
ENABLE_SLOW_QUERY_LOGGING = _env_bool("ENABLE_SLOW_QUERY_LOGGING", False)
SLOW_QUERY_THRESHOLD = _env_int("SLOW_QUERY_THRESHOLD", 100)  # milliseconds

# Internal guard to ensure event listeners are attached only once per process
_LISTENERS_ATTACHED = False


# ----------------------------
# SQLAlchemy slow-query logging
# ----------------------------
def init_slow_query_logging(app: Optional[Any] = None) -> None:
    """
    Initialize slow query logging for SQLAlchemy if enabled.
    Reads config from Flask app (if provided) with env fallback.
    Safe to call multiple times; listeners attach once.
    """
    global ENABLE_SLOW_QUERY_LOGGING, SLOW_QUERY_THRESHOLD, _LISTENERS_ATTACHED

    if app is not None:
        ENABLE_SLOW_QUERY_LOGGING = bool(
            app.config.get("ENABLE_SLOW_QUERY_LOGGING", ENABLE_SLOW_QUERY_LOGGING)
        )
        SLOW_QUERY_THRESHOLD = int(
            app.config.get("SLOW_QUERY_THRESHOLD", SLOW_QUERY_THRESHOLD)
        )

    if not ENABLE_SLOW_QUERY_LOGGING:
        logger.info("Slow query logging disabled.")
        return

    if _LISTENERS_ATTACHED:
        # Already set up
        logger.debug("Slow query listeners already attached; skipping re-attach.")
        return

    logger.info("Slow query logging enabled. Threshold: %dms", SLOW_QUERY_THRESHOLD)

    @event.listens_for(Engine, "before_cursor_execute")
    def _before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        context._query_start_time = time.time()

    @event.listens_for(Engine, "after_cursor_execute")
    def _after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        start = getattr(context, "_query_start_time", None)
        if start is None:  # safety
            return
        total_time_ms = int((time.time() - start) * 1000)

        if total_time_ms >= SLOW_QUERY_THRESHOLD:
            # Enrich with request metadata when available
            req_meta = ""
            if has_request_context():
                try:
                    req_meta = (
                        f"\nURL: {request.method} {request.path}"
                        f"\nRemote: {request.remote_addr}"
                        f"\nUA: {request.headers.get('User-Agent', '-')}"
                    )
                except Exception:  # pragma: no cover
                    req_meta = ""

            logger.warning(
                "Slow query detected: %dms%s\nStatement: %s\nParameters: %r\n%s",
                total_time_ms,
                req_meta,
                statement,
                parameters,
                "=" * 80,
            )

    _LISTENERS_ATTACHED = True


# ----------------------------
# Generic function performance
# ----------------------------
def track_function_performance(threshold_ms: int = 100) -> Callable:
    """
    Decorator to log a WARNING if function execution exceeds `threshold_ms`.

    Usage:
        @track_function_performance(250)
        def compute(...):
            ...
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not ENABLE_SLOW_QUERY_LOGGING:
                return func(*args, **kwargs)

            start = time.time()
            try:
                return func(*args, **kwargs)
            finally:
                duration_ms = int((time.time() - start) * 1000)
                if duration_ms > threshold_ms:
                    # Include request info when present
                    meta = ""
                    if has_request_context():
                        try:
                            meta = f" ({request.method} {request.path})"
                        except Exception:  # pragma: no cover
                            meta = ""
                    logger.warning(
                        "Slow function: %s.%s took %dms%s",
                        func.__module__,
                        getattr(func, "__qualname__", func.__name__),
                        duration_ms,
                        meta,
                    )

        return wrapper

    return decorator
