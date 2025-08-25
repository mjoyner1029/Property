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
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///dev.db")
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
    
    # Uploads
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB


class DevelopmentConfig(BaseConfig):
    """Development configuration"""
    DEBUG = True
    ENV = "development"
    FORCE_HTTPS = False
    SESSION_COOKIE_SECURE = False
    # Use absolute path for SQLite database to avoid path issues
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", 
        "sqlite:///" + os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "instance", "dev.db"))
    )
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 24 * 7  # 7 days in dev


class TestingConfig(BaseConfig):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    ENV = "testing"
    FORCE_HTTPS = False
    SESSION_COOKIE_SECURE = False
    SQLALCHEMY_DATABASE_URI = os.environ.get("TEST_DATABASE_URL", "sqlite:///:memory:")
    PRESERVE_CONTEXT_ON_EXCEPTION = False
    RATELIMIT_ENABLED = False
    JWT_ACCESS_TOKEN_EXPIRES = 60  # Short expiration for tests


class ProductionConfig(BaseConfig):
    """Production configuration"""
    ENV = "production"
    DEBUG = False
    
    # These should be set in environment variables
    SECRET_KEY = os.environ.get("SECRET_KEY")  # Will raise error if not set
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")  # Will raise error if not set
    
    # Security
    FORCE_HTTPS = True
    SESSION_COOKIE_SECURE = True


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
    """
    if config_name is None:
        config_name = os.environ.get("APP_ENV", "development")
    
    # Get config from dictionary, default to development
    return config_dict.get(config_name, config_dict["default"])
