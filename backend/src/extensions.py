from __future__ import annotations

import os
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_mail import Mail
from flask_cors import CORS
from flask_talisman import Talisman
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration


# -----------------------------
# Env helpers
# -----------------------------
def _env(name: str, default: str = "") -> str:
    val = os.getenv(name)
    return val if val is not None else default


def _env_bool(name: str, default: bool = False) -> bool:
    v = os.getenv(name)
    if v is None:
        return default
    return str(v).strip().lower() in {"1", "true", "yes", "on"}


APP_ENV = _env("APP_ENV", _env("FLASK_ENV", "development")).strip().lower()
IS_PROD = APP_ENV == "production"

# -----------------------------
# Sentry (enabled only if DSN)
# -----------------------------
SENTRY_DSN = _env("SENTRY_DSN", "").strip()
SENTRY_ENABLED = _env_bool("SENTRY_ENABLED", default=IS_PROD)

if SENTRY_DSN and SENTRY_ENABLED:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[FlaskIntegration()],
        # Conservative defaults; override via env when investigating incidents
        traces_sample_rate=float(_env("SENTRY_TRACES_SAMPLE_RATE", "0.2")),
        profiles_sample_rate=float(_env("SENTRY_PROFILES_SAMPLE_RATE", "0.0")),
        send_default_pii=False,
        environment=APP_ENV,
    )

# -----------------------------
# Core extensions (unbound)
# -----------------------------
db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()
mail = Mail()

# -----------------------------
# Socket.IO (threading by default; app binds it)
# -----------------------------
# CORS origins for Socket.IO: prefer SOCKETIO_CORS_ORIGINS, fall back to CORS_ORIGINS, else "*"
_socketio_cors = _env("SOCKETIO_CORS_ORIGINS", _env("CORS_ORIGINS", "")).strip()
_socketio_cors_list = (
    [o.strip() for o in _socketio_cors.split(",") if o.strip()] if _socketio_cors else ["*"]
)

# Use a message queue (e.g., Redis) for multi-instance deployments
# e.g. SOCKETIO_MESSAGE_QUEUE=redis://localhost:6379/0
_socketio_message_queue = _env("SOCKETIO_MESSAGE_QUEUE", "").strip() or None

# Async mode: default to "threading" (plays nicely on Python 3.13 without eventlet/gevent)
_socketio_async_mode = (_env("SOCKETIO_ASYNC_MODE", "threading") or "threading").strip().lower()
if _socketio_async_mode in {"none", "null"}:
    _socketio_async_mode = "threading"

socketio = SocketIO(
    async_mode=_socketio_async_mode,
    logger=False,
    engineio_logger=False,
    cors_allowed_origins=_socketio_cors_list or "*",
    message_queue=_socketio_message_queue,
)

# -----------------------------
# CORS / Talisman placeholders
# -----------------------------
# Policies are initialized in app.py to keep a single source of truth.
cors = CORS()
talisman = Talisman()

# -----------------------------
# Rate Limiting
# -----------------------------
# Prefer explicit RATELIMIT_STORAGE_URI; else Redis if provided; else in-memory
ratelimit_storage_uri = _env("RATELIMIT_STORAGE_URI").strip()
if not ratelimit_storage_uri:
    redis_url = _env("REDIS_URL").strip()
    ratelimit_storage_uri = redis_url if redis_url else "memory://"

# Toggle globally via RATELIMIT_ENABLED (true by default)
ratelimit_enabled = _env_bool("RATELIMIT_ENABLED", default=True)

# Default limits can be overridden by RATELIMIT_DEFAULTS (comma-separated string)
_default_limits_env = _env("RATELIMIT_DEFAULTS", "").strip()
if _default_limits_env:
    default_limits = [s.strip() for s in _default_limits_env.split(",") if s.strip()]
else:
    default_limits = ["200 per minute", "5000 per hour"]

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=ratelimit_storage_uri,
    strategy="fixed-window",
    headers_enabled=True,
    default_limits=default_limits,
)
limiter.enabled = bool(ratelimit_enabled)
