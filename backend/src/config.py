"""
Configuration for the Asset Anchor API.

Environment variables are used to override default values.
"""

from __future__ import annotations

import os
import secrets
from typing import Any, Dict, Optional, Union


def get_env(key: str, default: Optional[str] = None) -> Optional[str]:
    """Get an environment variable or return a default value"""
    return os.environ.get(key, default)


def get_env_int(key: str, default: Optional[int] = None) -> Optional[int]:
    """Get an environment variable as integer or return a default value"""
    value = get_env(key)
    if value is not None:
        try:
            return int(value)
        except ValueError:
            pass
    return default


def get_env_float(key: str, default: Optional[float] = None) -> Optional[float]:
    """Get an environment variable as float or return a default value"""
    value = get_env(key)
    if value is not None:
        try:
            return float(value)
        except ValueError:
            pass
    return default


def get_env_bool(key: str, default: Optional[bool] = None) -> Optional[bool]:
    """Get an environment variable as boolean or return a default value"""
    value = get_env(key)
    if value is not None:
        return value.lower() in ('true', '1', 't', 'y', 'yes', 'on')
    return default


def get_env_list(key: str, default: Optional[list] = None, separator: str = ',') -> Optional[list]:
    """Get an environment variable as a list or return a default value"""
    value = get_env(key)
    if value is not None:
        return [item.strip() for item in value.split(separator) if item.strip()]
    return default


def get_env_dict(key: str, default: Optional[dict] = None, separator: str = ',', kv_separator: str = ':') -> Optional[dict]:
    """Get an environment variable as a dictionary or return a default value"""
    value = get_env_list(key, None, separator)
    if value is not None:
        result = {}
        for item in value:
            if kv_separator in item:
                k, v = item.split(kv_separator, 1)
                result[k.strip()] = v.strip()
        return result
    return default


def get_env_flag(key: str) -> bool:
    """Get an environment variable as a boolean flag, defaulting to False if not set"""
    return get_env_bool(key, False)


class BaseConfig:
    """Base configuration for all environments"""
    # App Settings
    DEBUG = False
    TESTING = False
    ENV = "development"  # Flask env
    SECRET_KEY = os.environ.get("SECRET_KEY", secrets.token_hex(32))
    VERSION = os.environ.get("VERSION", "1.0.0")
    
    # CORS
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
    
    # Database
    import pathlib
    BASE_DIR = pathlib.Path(__file__).resolve().parents[1]
    INSTANCE_DIR = BASE_DIR / "instance"
    INSTANCE_DIR.mkdir(exist_ok=True)

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{INSTANCE_DIR / 'app.db'}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 24  # 1 day
    JWT_REFRESH_TOKEN_EXPIRES = 60 * 60 * 24 * 30  # 30 days
    
    # Stripe
    STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")
    STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    
    # Twilio
    TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
    TWILIO_FROM_NUMBER = os.environ.get("TWILIO_FROM_NUMBER", "")
    
    # Sentry
    SENTRY_DSN = os.environ.get("SENTRY_DSN", "")
    
    # Rate Limiting
    RATELIMIT_DEFAULT = "100 per minute"
    RATELIMIT_STORAGE_URL = os.environ.get("REDIS_URL", "memory://")
    RATELIMIT_KEY_PREFIX = "assetanchor-limiter"
    
    # Mail
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", "587"))
    MAIL_USE_TLS = get_env_bool("MAIL_USE_TLS", True)
    MAIL_USE_SSL = get_env_bool("MAIL_USE_SSL", False)
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER", "")
    
    # Redis
    REDIS_URL = os.environ.get("REDIS_URL", "")
    
    # Security
    FORCE_HTTPS = get_env_bool("FORCE_HTTPS", True)
    SESSION_COOKIE_SECURE = get_env_bool("SESSION_COOKIE_SECURE", True)
    CSP_ENFORCE = get_env_bool("CSP_ENFORCE", True)
    CSP_REPORT_URI = get_env("CSP_REPORT_URI", "")
    EXTRA_CSP_DOMAINS = get_env_dict("EXTRA_CSP_DOMAINS", {})
    
    # Uploads
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB


class DevelopmentConfig(BaseConfig):
    """Development configuration"""
    DEBUG = True
    ENV = "development"
    
    # Security settings relaxed for development
    FORCE_HTTPS = False
    SESSION_COOKIE_SECURE = False
    
    # Use absolute path for SQLite database to avoid path issues
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", 
        "sqlite:///" + os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "instance", "dev.db"))
    )
    
    # Longer token expiration for development convenience
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 24 * 7  # 7 days in dev
    
    # Development-specific settings
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "DEBUG")
    LOG_REQUESTS = True  # Log all requests in development
    SQLALCHEMY_ECHO = get_env_bool("SQLALCHEMY_ECHO", False)  # SQL query logging
    
    # Development password policy (less strict)
    PASSWORD_MIN_LENGTH = 8
    PASSWORD_REQUIRE_UPPERCASE = False
    PASSWORD_REQUIRE_LOWERCASE = False
    PASSWORD_REQUIRE_NUMBERS = False
    PASSWORD_REQUIRE_SPECIAL = False
    
    # Sentry performance monitoring - higher sampling in dev
    SENTRY_TRACES_SAMPLE_RATE = 0.5  # 50% in development
    SENTRY_PROFILES_SAMPLE_RATE = 0.1  # 10% in development
    
    # Account security for development
    ACCOUNT_LOCKOUT_MAX_ATTEMPTS = 10
    ACCOUNT_LOCKOUT_WINDOW_MINUTES = 5
    ACCOUNT_LOCKOUT_DURATION_MINUTES = 5


class TestingConfig(BaseConfig):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    ENV = "testing"
    
    # Security settings relaxed for testing
    FORCE_HTTPS = False
    SESSION_COOKIE_SECURE = False
    
    # Use in-memory database for tests by default
    SQLALCHEMY_DATABASE_URI = os.environ.get("TEST_DATABASE_URL", "sqlite:///:memory:")
    
    # Test-specific Flask settings
    PRESERVE_CONTEXT_ON_EXCEPTION = False
    WTF_CSRF_ENABLED = False
    
    # Disable rate limiting in tests
    RATELIMIT_ENABLED = False
    
    # Short token expiration for tests
    JWT_ACCESS_TOKEN_EXPIRES = 60  # Short expiration for tests
    
    # Fast account lockout for testing that feature
    ACCOUNT_LOCKOUT_MAX_ATTEMPTS = 3
    ACCOUNT_LOCKOUT_WINDOW_MINUTES = 1
    ACCOUNT_LOCKOUT_DURATION_MINUTES = 1
    
    # Disable Sentry in tests
    SENTRY_DSN = None
    
    # Minimal password requirements for faster tests
    PASSWORD_MIN_LENGTH = 4
    PASSWORD_REQUIRE_UPPERCASE = False
    PASSWORD_REQUIRE_LOWERCASE = False
    PASSWORD_REQUIRE_NUMBERS = False
    PASSWORD_REQUIRE_SPECIAL = False
    
    # No asset compilation in tests
    ASSETS_DEBUG = True


class ProductionConfig(BaseConfig):
    """Production configuration"""
    ENV = "production"
    DEBUG = False
    
    # Required environment variables in production
    required_vars = [
        "SECRET_KEY", "JWT_SECRET_KEY", "DATABASE_URL", "CORS_ORIGINS",
        "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "SENTRY_DSN"
    ]
    
    def __init__(self):
        """Validate that required environment variables are set in production."""
        missing = []
        for var in self.required_vars:
            if not os.environ.get(var):
                missing.append(var)
        
        if missing:
            raise ValueError(
                f"Missing required environment variables for production: {', '.join(missing)}"
            )
            
        # Validate security configuration
        self._validate_security_config()
            
    def _validate_security_config(self):
        """Validate security-related configuration"""
        warnings = []
        errors = []
        
        # Check secret key length
        secret_key = os.environ.get("SECRET_KEY", "")
        if len(secret_key) < 32:
            errors.append("SECRET_KEY is too short (< 32 characters)")
        
        jwt_secret_key = os.environ.get("JWT_SECRET_KEY", "")
        if len(jwt_secret_key) < 32:
            errors.append("JWT_SECRET_KEY is too short (< 32 characters)")
            
        # Check if SECRET_KEY and JWT_SECRET_KEY are the same (bad practice)
        if secret_key and jwt_secret_key and secret_key == jwt_secret_key:
            warnings.append("SECRET_KEY and JWT_SECRET_KEY should be different values")
            
        # Check CORS origins
        cors_origins = os.environ.get("CORS_ORIGINS", "")
        if cors_origins == "*":
            errors.append("CORS_ORIGINS is set to wildcard '*', which is unsafe in production")
            
        # Check for recommended environment variables
        recommended_vars = ["MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_DEFAULT_SENDER"]
        missing_recommended = [var for var in recommended_vars if not os.environ.get(var)]
        if missing_recommended:
            warnings.append(f"Missing recommended environment variables: {', '.join(missing_recommended)}")
            
        # Raise exception if critical security errors found
        if errors:
            raise ValueError(f"Security configuration errors: {'; '.join(errors)}")
            
        # Log warnings but continue
        if warnings:
            import logging
            logger = logging.getLogger(__name__)
            for warning in warnings:
                logger.warning(f"Security warning: {warning}")
            
    # Override settings for production
    SECRET_KEY = os.environ.get("SECRET_KEY")  # Validated in __init__
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")  # Validated in __init__
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")  # Validated in __init__
    
    # Security settings
    FORCE_HTTPS = True
    SESSION_COOKIE_SECURE = True
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "https://assetanchor.io,https://www.assetanchor.io")
    CSP_ENFORCE = get_env_bool("CSP_ENFORCE", True)
    CSP_REPORT_URI = get_env("CSP_REPORT_URI", "")
    
    # Strong password policy
    PASSWORD_MIN_LENGTH = 12
    PASSWORD_REQUIRE_UPPERCASE = True
    PASSWORD_REQUIRE_LOWERCASE = True
    PASSWORD_REQUIRE_NUMBERS = True
    PASSWORD_REQUIRE_SPECIAL = True
    
    # Account security
    ACCOUNT_LOCKOUT_MAX_ATTEMPTS = 5
    ACCOUNT_LOCKOUT_WINDOW_MINUTES = 15
    ACCOUNT_LOCKOUT_DURATION_MINUTES = 30
    
    # JWT settings for production
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60  # 1 hour in production
    JWT_REFRESH_TOKEN_EXPIRES = 60 * 60 * 24 * 7  # 7 days in production
    JWT_COOKIE_SECURE = True
    JWT_COOKIE_CSRF_PROTECT = True
    JWT_COOKIE_SAMESITE = "Lax"
    
    # Rate limiting
    RATELIMIT_DEFAULT = ["3000 per day", "1000 per hour", "100 per minute"]
    RATELIMIT_STORAGE_URL = os.environ.get("REDIS_URL", "memory://")
    
    # Sentry performance monitoring
    SENTRY_TRACES_SAMPLE_RATE = 0.05  # 5% in production
    SENTRY_PROFILES_SAMPLE_RATE = 0.01  # 1% in production
    
    # Logging
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
    LOG_REQUESTS = get_env_bool("LOG_REQUESTS", False)  # Don't log all requests in prod by default


# Configuration dictionary
config_dict = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig
}


def get_config(config_name: Optional[str] = None) -> BaseConfig:
    """
    Get configuration class by name.
    
    Args:
        config_name: Name of the configuration to use.
            If None, will use APP_ENV environment variable.
    
    Returns:
        Configuration class
    
    Raises:
        ValueError: If required environment variables are missing in production
    """
    if config_name is None:
        config_name = os.environ.get("APP_ENV", "development")
    
    # Get config class from dictionary, default to development
    config_class = config_dict.get(config_name, config_dict["default"])
    
    # For production configs, we need to instantiate to trigger validation
    if config_name == "production":
        try:
            return config_class()
        except ValueError as e:
            # Re-raise with additional information
            raise ValueError(f"Production configuration error: {str(e)}") from e
    
    # For other environments, just return the class
    return config_class
