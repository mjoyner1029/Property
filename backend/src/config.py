# backend/src/config.py
from __future__ import annotations

import os
import datetime
from datetime import timedelta

# Only load .env in non-production by default
from dotenv import load_dotenv


def _env(name: str, default: str = "") -> str:
    val = os.getenv(name)
    return val if val is not None else default


def _env_bool(name: str, default: bool = False) -> bool:
    v = os.getenv(name)
    if v is None:
        return default
    return str(v).strip().lower() in {"1", "true", "yes", "on"}


APP_ENV = _env("APP_ENV", _env("FLASK_ENV", "development")).strip().lower()
if APP_ENV != "production":
    # helpful locally; prod should use platform env
    load_dotenv()


def _normalize_db_url(url: str) -> str:
    # SQLAlchemy requires postgresql:// not postgres://
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


class Config:
    """
    Base configuration for the application.
    Environment-specific configurations inherit from this class.
    """

    # Application info
    VERSION = _env("APP_VERSION", "1.0.0")
    STARTED_AT = datetime.datetime.utcnow().isoformat()

    # Flask core settings
    FLASK_ENV = _env("FLASK_ENV", "development")
    SECRET_KEY = _env("SECRET_KEY", "changeme")  # override in prod
    DEBUG = _env_bool("DEBUG", False)
    TESTING = False

    # Logging
    LOG_LEVEL = _env("LOG_LEVEL", "INFO").upper()

    # JWT settings
    JWT_SECRET_KEY = _env("JWT_SECRET_KEY", _env("SECRET_KEY", "changeme"))
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    # If you use token revocation, keep these. (Flask-JWT-Extended v4+ does not require these flags)
    JWT_BLACKLIST_ENABLED = _env_bool("JWT_BLACKLIST_ENABLED", True)
    JWT_BLACKLIST_TOKEN_CHECKS = ["access", "refresh"]

    # Database
    SQLALCHEMY_DATABASE_URI = _normalize_db_url(
        _env("DATABASE_URL", "sqlite:///app.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Stripe
    STRIPE_PUBLIC_KEY = _env("STRIPE_PUBLIC_KEY")
    STRIPE_SECRET_KEY = _env("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET = _env("STRIPE_WEBHOOK_SECRET")
    STRIPE_REFRESH_URL = _env("STRIPE_REFRESH_URL", "http://localhost:3000/stripe/refresh")
    STRIPE_RETURN_URL = _env("STRIPE_RETURN_URL", "http://localhost:3000/dashboard")
    STRIPE_SUCCESS_URL = _env("STRIPE_SUCCESS_URL", "http://localhost:3000/payment/success")
    STRIPE_CANCEL_URL = _env("STRIPE_CANCEL_URL", "http://localhost:3000/payment/cancel")

    # Mail
    MAIL_SERVER = _env("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(_env("MAIL_PORT", "587"))
    MAIL_USE_TLS = _env_bool("MAIL_USE_TLS", True)
    MAIL_USERNAME = _env("MAIL_USERNAME")
    MAIL_PASSWORD = _env("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = _env("MAIL_DEFAULT_SENDER", _env("MAIL_USERNAME"))
    MAIL_SUPPRESS_SEND = _env_bool("MAIL_SUPPRESS_SEND", False)

    # Frontend URL for building links in emails
    FRONTEND_URL = _env("FRONTEND_URL", "http://localhost:3000")

    # CORS
    # Keep a string for easy pass-through to app.py; also provide a list for any code expecting it
    CORS_ALLOW_ORIGINS = _env("CORS_ALLOW_ORIGINS", _env("CORS_ORIGINS", "http://localhost:3000"))
    CORS_ORIGINS = [o.strip() for o in CORS_ALLOW_ORIGINS.split(",") if o.strip()]

    # Socket.IO
    SOCKETIO_MESSAGE_QUEUE = _env("SOCKETIO_MESSAGE_QUEUE")  # e.g. redis://host:6379/0

    # File uploads
    UPLOAD_FOLDER = _env("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH = int(_env("MAX_CONTENT_LENGTH", str(16 * 1024 * 1024)))  # 16 MB
    ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "doc", "docx", "xls", "xlsx"}

    # Security settings
    CSP_ENFORCE = _env_bool("CSP_ENFORCE", False)
    SESSION_COOKIE_SECURE = _env_bool("SESSION_COOKIE_SECURE", False)
    SESSION_COOKIE_HTTPONLY = _env_bool("SESSION_COOKIE_HTTPONLY", True)
    SESSION_COOKIE_SAMESITE = _env("SESSION_COOKIE_SAMESITE", "Lax")
    REMEMBER_COOKIE_SECURE = _env_bool("REMEMBER_COOKIE_SECURE", False)
    REMEMBER_COOKIE_HTTPONLY = _env_bool("REMEMBER_COOKIE_HTTPONLY", True)

    # Redis for caching and rate limiting
    REDIS_URL = _env("REDIS_URL")
    # Harmonize name with extensions.py (RATELIMIT_STORAGE_URI)
    RATELIMIT_STORAGE_URI = _env("RATELIMIT_STORAGE_URI", _env("REDIS_URL", "memory://"))
    RATELIMIT_ENABLED = _env_bool("RATELIMIT_ENABLED", True)
    # Comma-separated, e.g. "200 per minute,5000 per hour"
    RATELIMIT_DEFAULTS = _env("RATELIMIT_DEFAULTS", "")

    # Sentry for error tracking
    SENTRY_DSN = _env("SENTRY_DSN")
    SENTRY_ENABLED = _env_bool("SENTRY_ENABLED", APP_ENV == "production")
    SENTRY_TRACES_SAMPLE_RATE = _env("SENTRY_TRACES_SAMPLE_RATE", "0.2")
    SENTRY_PROFILES_SAMPLE_RATE = _env("SENTRY_PROFILES_SAMPLE_RATE", "0.0")

    # AWS S3 for file storage
    S3_BUCKET = _env("S3_BUCKET")
    S3_REGION = _env("S3_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID = _env("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = _env("AWS_SECRET_ACCESS_KEY")

    # Email provider
    EMAIL_PROVIDER = _env("EMAIL_PROVIDER", "smtp")  # "smtp" | "postmark" | "sendgrid" | ...
    EMAIL_API_KEY = _env("EMAIL_API_KEY")
    EMAIL_FROM = _env("EMAIL_FROM", "no-reply@assetanchor.io")

    # System/webhooks
    SYSTEM_WEBHOOK_SECRET = _env("SYSTEM_WEBHOOK_SECRET")

    # Twilio (for SMS)
    TWILIO_ACCOUNT_SID = _env("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = _env("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER = _env("TWILIO_PHONE_NUMBER")

    # Plaid (for financial connections)
    PLAID_CLIENT_ID = _env("PLAID_CLIENT_ID")
    PLAID_SECRET = _env("PLAID_SECRET")
    PLAID_ENV = _env("PLAID_ENV", "sandbox")
    PLAID_WEBHOOK_SECRET = _env("PLAID_WEBHOOK_SECRET")

    # Optional Content Security Policy (advanced): set via app.py if needed
    CONTENT_SECURITY_POLICY = None  # you can override in ProductionConfig


class DevelopmentConfig(Config):
    """Development environment specific configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = _normalize_db_url(
        _env("DATABASE_URL", "sqlite:///dev.db")
    )


class TestingConfig(Config):
    """Testing environment specific configuration."""
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = _normalize_db_url(
        _env("TEST_DATABASE_URL", "sqlite:///test.db")
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)
    MAIL_SUPPRESS_SEND = True
    RATELIMIT_ENABLED = False  # disable for tests by default


class ProductionConfig(Config):
    """Production environment specific configuration."""
    DEBUG = False

    # Security settings
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    JWT_COOKIE_SECURE = True  # if you ever use cookie-based JWT
    SESSION_COOKIE_SAMESITE = _env("SESSION_COOKIE_SAMESITE", "Lax")

    # Default to stricter CORS in production (override via env if needed)
    CORS_ALLOW_ORIGINS = _env(
        "CORS_ALLOW_ORIGINS",
        "https://assetanchor.io,https://www.assetanchor.io"
    )
    CORS_ORIGINS = [o.strip() for o in CORS_ALLOW_ORIGINS.split(",") if o.strip()]

    # Rate limiting store (prefer Redis)
    RATELIMIT_STORAGE_URI = _env("RATELIMIT_STORAGE_URI", _env("REDIS_URL", "memory://"))

    # JWT settings for production
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # Email provider defaults to Postmark in production unless overridden
    EMAIL_PROVIDER = _env("EMAIL_PROVIDER", "postmark")

    # Optional: example CSP that works with Stripe & GA; tweak in env/app.py if needed
    CONTENT_SECURITY_POLICY = {
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


# Map names to config classes
config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}


def get_config(config_name: str | None = None) -> Config:
    """Return the appropriate configuration object based on the environment name."""
    if not config_name:
        config_name = _env("FLASK_ENV", "development")
    return config_by_name.get(config_name, config_by_name["default"])()
