# backend/src/config.py
from __future__ import annotations

import os
import datetime
import logging
from typing import Any, Dict, List, Optional
from datetime import timedelta

from dotenv import load_dotenv


# ----------------------------
# Env helpers
# ----------------------------
def _env(name: str, default: Optional[str] = None) -> str:
    val = os.getenv(name)
    if val is None:
        return "" if default is None else default
    return val


def _env_bool(name: str, default: bool = False) -> bool:
    v = os.getenv(name)
    if v is None:
        return default
    return str(v).strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    v = os.getenv(name)
    if v is None:
        return default
    try:
        return int(v)
    except ValueError:
        return default


def _env_float(name: str, default: float) -> float:
    v = os.getenv(name)
    if v is None:
        return default
    try:
        return float(v)
    except ValueError:
        return default


def _normalize_db_url(url: str) -> str:
    # SQLAlchemy requires postgresql:// not postgres://
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


# ----------------------------
# Environment bootstrap
# ----------------------------
APP_ENV = _env("APP_ENV", _env("FLASK_ENV", "development")).strip().lower()
# Load .env locally; production should rely on platform secrets
if APP_ENV not in {"production", "prod"}:
    load_dotenv()


# ----------------------------
# Base Config
# ----------------------------
class Config:
    """
    Base configuration for the application.
    Environment-specific configurations inherit from this class.
    """

    # App meta
    VERSION = _env("APP_VERSION", "1.0.0")
    STARTED_AT = datetime.datetime.utcnow().isoformat()

    # Flask core
    FLASK_ENV = _env("FLASK_ENV", "development")
    SECRET_KEY = _env("SECRET_KEY", "changeme")  # MUST override in production
    DEBUG = _env_bool("DEBUG", False)
    TESTING = False

    # Logging
    LOG_LEVEL = _env("LOG_LEVEL", "INFO").upper()

    # Database
    SQLALCHEMY_DATABASE_URI = _normalize_db_url(
        _env("DATABASE_URL", "sqlite:///app.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Sensible engine defaults; override via env if needed
    SQLALCHEMY_ENGINE_OPTIONS: Dict[str, Any] = {
        "pool_pre_ping": True,
        "pool_recycle": _env_int("DB_POOL_RECYCLE_SECS", 300),
    }

    # JWT
    JWT_SECRET_KEY = _env("JWT_SECRET_KEY", _env("SECRET_KEY", "changeme"))
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=_env_int("JWT_ACCESS_EXPIRES_HOURS", 1))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=_env_int("JWT_REFRESH_EXPIRES_DAYS", 30))
    # Legacy options (some codebases still reference these)
    JWT_BLACKLIST_ENABLED = _env_bool("JWT_BLACKLIST_ENABLED", True)
    JWT_BLACKLIST_TOKEN_CHECKS = ["access", "refresh"]

    # CORS
    # Accept CSV string (e.g., "http://localhost:3000,https://staging.assetanchor.io")
    CORS_ALLOW_ORIGINS = _env(
        "CORS_ALLOW_ORIGINS",
        _env("CORS_ORIGINS", "http://localhost:3000"),
    )
    CORS_ORIGINS: List[str] = [o.strip() for o in CORS_ALLOW_ORIGINS.split(",") if o.strip()]
    CORS_SUPPORTS_CREDENTIALS = _env_bool("CORS_SUPPORTS_CREDENTIALS", True)
    CORS_ALLOW_HEADERS = _env(
        "CORS_ALLOW_HEADERS",
        "Authorization, Content-Type, X-Requested-With, X-CSRF-Token",
    )
    CORS_EXPOSE_HEADERS = _env(
        "CORS_EXPOSE_HEADERS",
        "Authorization, Content-Disposition, Content-Type, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
    )

    # Socket.IO
    SOCKETIO_MESSAGE_QUEUE = _env("SOCKETIO_MESSAGE_QUEUE")  # e.g., redis://host:6379/0
    SOCKETIO_CORS_ALLOWED_ORIGINS = CORS_ORIGINS

    # Uploads
    UPLOAD_FOLDER = _env("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH = _env_int("MAX_CONTENT_LENGTH", 16 * 1024 * 1024)  # 16MB
    ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "doc", "docx", "xls", "xlsx"}

    # Email
    MAIL_SERVER = _env("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = _env_int("MAIL_PORT", 587)
    MAIL_USE_TLS = _env_bool("MAIL_USE_TLS", True)
    MAIL_USE_SSL = _env_bool("MAIL_USE_SSL", False)
    MAIL_USERNAME = _env("MAIL_USERNAME", "")
    MAIL_PASSWORD = _env("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = _env("MAIL_DEFAULT_SENDER", _env("MAIL_USERNAME", ""))
    MAIL_SUPPRESS_SEND = _env_bool("MAIL_SUPPRESS_SEND", False)
    FRONTEND_URL = _env("FRONTEND_URL", "http://localhost:3000")

    # Stripe
    STRIPE_PUBLIC_KEY = _env("STRIPE_PUBLIC_KEY", "")
    STRIPE_SECRET_KEY = _env("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET = _env("STRIPE_WEBHOOK_SECRET", "")
    STRIPE_REFRESH_URL = _env("STRIPE_REFRESH_URL", f"{FRONTEND_URL}/stripe/refresh")
    STRIPE_RETURN_URL = _env("STRIPE_RETURN_URL", f"{FRONTEND_URL}/dashboard")
    STRIPE_SUCCESS_URL = _env("STRIPE_SUCCESS_URL", f"{FRONTEND_URL}/payment/success")
    STRIPE_CANCEL_URL = _env("STRIPE_CANCEL_URL", f"{FRONTEND_URL}/payment/cancel")

    # Redis / Rate Limiting
    REDIS_URL = _env("REDIS_URL", "")
    RATELIMIT_ENABLED = _env_bool("RATELIMIT_ENABLED", True)
    RATELIMIT_STORAGE_URI = _env("RATELIMIT_STORAGE_URI", _env("REDIS_URL", "memory://"))
    # CSV like "200 per minute, 5000 per hour"
    RATELIMIT_DEFAULTS = _env("RATELIMIT_DEFAULTS", "")
    RATELIMIT_DEFAULTS_LIST: List[str] = [
        r.strip() for r in RATELIMIT_DEFAULTS.split(",") if r.strip()
    ]

    # Security / Cookies
    CSP_ENFORCE = _env_bool("CSP_ENFORCE", False)
    SESSION_COOKIE_SECURE = _env_bool("SESSION_COOKIE_SECURE", False)
    SESSION_COOKIE_HTTPONLY = _env_bool("SESSION_COOKIE_HTTPONLY", True)
    SESSION_COOKIE_SAMESITE = _env("SESSION_COOKIE_SAMESITE", "Lax")
    REMEMBER_COOKIE_SECURE = _env_bool("REMEMBER_COOKIE_SECURE", False)
    REMEMBER_COOKIE_HTTPONLY = _env_bool("REMEMBER_COOKIE_HTTPONLY", True)
    # Optional CSP (Flask-Talisman format)
    CONTENT_SECURITY_POLICY: Optional[Dict[str, Any]] = None

    # Sentry
    SENTRY_DSN = _env("SENTRY_DSN", "")
    SENTRY_ENABLED = _env_bool("SENTRY_ENABLED", APP_ENV == "production")
    SENTRY_TRACES_SAMPLE_RATE = _env_float("SENTRY_TRACES_SAMPLE_RATE", 0.2)
    SENTRY_PROFILES_SAMPLE_RATE = _env_float("SENTRY_PROFILES_SAMPLE_RATE", 0.0)

    # S3
    S3_BUCKET = _env("S3_BUCKET", "")
    S3_REGION = _env("S3_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID = _env("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY = _env("AWS_SECRET_ACCESS_KEY", "")

    # Email provider (API-based)
    EMAIL_PROVIDER = _env("EMAIL_PROVIDER", "smtp")  # smtp | postmark | sendgrid | ...
    EMAIL_API_KEY = _env("EMAIL_API_KEY", "")
    EMAIL_FROM = _env("EMAIL_FROM", "no-reply@assetanchor.io")

    # System/Webhooks
    SYSTEM_WEBHOOK_SECRET = _env("SYSTEM_WEBHOOK_SECRET", "")

    # Telephony (optional)
    TWILIO_ACCOUNT_SID = _env("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN = _env("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER = _env("TWILIO_PHONE_NUMBER", "")

    # Financial connections (optional)
    PLAID_CLIENT_ID = _env("PLAID_CLIENT_ID", "")
    PLAID_SECRET = _env("PLAID_SECRET", "")
    PLAID_ENV = _env("PLAID_ENV", "sandbox")
    PLAID_WEBHOOK_SECRET = _env("PLAID_WEBHOOK_SECRET", "")

    @classmethod
    def init_logging(cls) -> None:
        level = getattr(logging, cls.LOG_LEVEL, logging.INFO)
        logging.basicConfig(level=level)
        logging.getLogger("alembic").setLevel(level)

    @staticmethod
    def validate(instance: "Config") -> None:
        # Hook for environment-specific validation (overridden in ProductionConfig)
        return


# ----------------------------
# Dev / Test / Prod Configs
# ----------------------------
class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = _normalize_db_url(
        _env("DATABASE_URL", "sqlite:///dev.db")
    )
    # Relax defaults for local dev
    RATELIMIT_ENABLED = _env_bool("RATELIMIT_ENABLED", True)


class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = _normalize_db_url(
        _env("TEST_DATABASE_URL", "sqlite:///test.db")
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)
    MAIL_SUPPRESS_SEND = True
    RATELIMIT_ENABLED = False  # Disable limiter in tests by default


class ProductionConfig(Config):
    DEBUG = False

    # Strict cookies
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    # If you ever switch to cookie-based JWT:
    JWT_COOKIE_SECURE = True  # type: ignore[attr-defined]

    # CORS tightened by default (override via env)
    CORS_ALLOW_ORIGINS = _env(
        "CORS_ALLOW_ORIGINS",
        "https://assetanchor.io,https://www.assetanchor.io",
    )
    CORS_ORIGINS: List[str] = [o.strip() for o in CORS_ALLOW_ORIGINS.split(",") if o.strip()]

    # Use Redis for limiter in prod (fallback to memory if unset, but not recommended)
    RATELIMIT_STORAGE_URI = _env("RATELIMIT_STORAGE_URI", _env("REDIS_URL", "memory://"))

    # Shorter access tokens in prod
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=_env_int("JWT_ACCESS_EXPIRES_MIN", 30))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=_env_int("JWT_REFRESH_EXPIRES_DAYS", 30))

    # Reasonable default CSP compatible with Stripe; Talisman will inject nonce
    CONTENT_SECURITY_POLICY: Dict[str, Any] = {
        "default-src": "'self'",
        "base-uri": "'self'",
        "form-action": "'self'",
        "img-src": ["'self'", "data:", "https://*.assetanchor.io", "https://*.stripe.com"],
        "connect-src": [
            "'self'",
            "https://api.stripe.com",
            _env("API_BASE_URL", ""),
            _env("WS_BASE_URL", ""),
            "https://www.google-analytics.com",
        ],
        "script-src": ["'self'", "https://js.stripe.com", "'nonce-{nonce}'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "frame-src": ["'self'", "https://js.stripe.com", "https://checkout.stripe.com", "https://hooks.stripe.com"],
        "object-src": "'none'",
        "frame-ancestors": "'none'",
        "report-uri": ["/api/csp-report"],
    }

    @staticmethod
    def validate(instance: "ProductionConfig") -> None:
        # Fail fast on obviously unsafe prod configs
        if instance.SECRET_KEY == "changeme" or not instance.SECRET_KEY:
            raise ValueError("SECRET_KEY must be set in production.")
        if not instance.JWT_SECRET_KEY or instance.JWT_SECRET_KEY == "changeme":
            raise ValueError("JWT_SECRET_KEY must be set in production.")
        # Warn (not fail) on missing non-critical prod integrations
        if not instance.STRIPE_SECRET_KEY:
            logging.warning("STRIPE_SECRET_KEY not set; Stripe features will be disabled.")
        if not instance.STRIPE_WEBHOOK_SECRET:
            logging.warning("STRIPE_WEBHOOK_SECRET not set; webhook verification will fail.")
        if instance.SENTRY_ENABLED and not instance.SENTRY_DSN:
            logging.warning("SENTRY_ENABLED is true but SENTRY_DSN is empty.")


# ----------------------------
# Factory
# ----------------------------
config_by_name: Dict[str, type[Config]] = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}


def get_config(config_name: Optional[str] = None) -> Config:
    """
    Return the appropriate configuration object based on the environment name.
    Also initializes logging and runs environment-specific validation.
    """
    if not config_name:
        config_name = _env("FLASK_ENV", "development")

    cls = config_by_name.get(config_name, config_by_name["default"])
    cfg = cls()  # type: ignore[call-arg]
    cls.init_logging()
    # Run validation hook (prod enforces secrets)
    cls.validate(cfg)  # type: ignore[arg-type]
    return cfg
