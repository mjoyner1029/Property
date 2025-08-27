"""
Extensions module for Asset Anchor API.
Initializes and configures all Flask extensions used in the application.
"""

from __future__ import annotations

import os
from typing import Any, Dict, Optional

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_talisman import Talisman
from flask_socketio import SocketIO
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Initialize extensions without binding to an app
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()
talisman = Talisman()
socketio = SocketIO()
mail = Mail()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
    strategy="fixed-window",
    headers_enabled=True
)

def init_extensions(app: Flask) -> None:
    """
    Initialize all Flask extensions with the application.

    Args:
        app: Flask application instance
    """
    # Initialize database
    db.init_app(app)
    
    # Initialize migrations
    migrate.init_app(app, db)
    
    # Initialize JWT
    jwt.init_app(app)
    
    # Configure CORS
    cors_config = _get_cors_config(app)
    cors.init_app(app, **cors_config)
    
    # Configure Talisman (HTTPS/security headers)
    talisman_config = _get_talisman_config(app)
    talisman.init_app(app, **talisman_config)
    
    # Initialize Socket.IO
    socketio_config = _get_socketio_config(app)
    socketio.init_app(app, **socketio_config)
    
    # Initialize Mail
    mail.init_app(app)
    
    # Initialize rate limiter
    limiter_config = _get_limiter_config(app)
    limiter.init_app(app, **limiter_config)
    
    # Register additional hooks
    _register_jwt_hooks(app)


def _get_cors_config(app: Flask) -> Dict[str, Any]:
    """Get configuration for CORS extension."""
    return {
        "resources": r"/*",
        "origins": app.config.get("CORS_ORIGINS", "*"),
        "methods": ["GET", "HEAD", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
        "expose_headers": ["Content-Type", "Authorization"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }


def _get_talisman_config(app: Flask) -> Dict[str, Any]:
    """Get configuration for Talisman extension."""
    # Default production CSP directives
    csp_directives = {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://*.sentry.io"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", "data:", "https://stripe.com", "https://*.stripe.com", "https://*.sentry.io"],
        'connect-src': ["'self'", "https://api.stripe.com", "https://*.sentry.io"],
        'frame-src': ["'self'", "https://js.stripe.com", "https://hooks.stripe.com", "https://*.stripe.com"],
        'font-src': ["'self'", "data:"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'", "https://api.stripe.com"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': "",
        'block-all-mixed-content': "",
    }
    
    # Add extra domains from environment if configured
    extra_csp_domains = app.config.get("EXTRA_CSP_DOMAINS")
    if extra_csp_domains and isinstance(extra_csp_domains, dict):
        for directive, domains in extra_csp_domains.items():
            if directive in csp_directives and isinstance(domains, list):
                csp_directives[directive].extend(domains)
    
    # In development, use a more permissive CSP
    if app.config.get("ENV") != "production":
        csp_directives = None  # Disable CSP in development

    return {
        "force_https": app.config.get("FORCE_HTTPS", True),
        "content_security_policy": csp_directives,
        "content_security_policy_report_only": not app.config.get("CSP_ENFORCE", True),
        "content_security_policy_report_uri": app.config.get("CSP_REPORT_URI"),
        # Allow frames for development tools in dev/test
        "frame_options": "DENY" if app.config.get("ENV") == "production" else None,
        # Force HTTPS for 1 year including subdomains
        "strict_transport_security": "max-age=31536000; includeSubDomains; preload",
        "strict_transport_security_preload": True,
        "session_cookie_secure": app.config.get("SESSION_COOKIE_SECURE", True),
        "session_cookie_http_only": True,
        "session_cookie_samesite": "Lax",
        "referrer_policy": "strict-origin-when-cross-origin",
        "feature_policy": {
            "geolocation": "'none'",
            "microphone": "'none'",
            "camera": "'none'",
            "payment": "'self'",
        },
        # X-Content-Type-Options to prevent MIME type sniffing
        "x_content_type_options": True,
        # X-XSS-Protection as an additional layer of protection
        "x_xss_protection": True
    }


def _get_socketio_config(app: Flask) -> Dict[str, Any]:
    """Get configuration for SocketIO extension."""
    return {
        "cors_allowed_origins": app.config.get("CORS_ORIGINS", "*"),
        "async_mode": "threading",  # Use threading for simpler deployment
        "logger": app.config.get("SOCKETIO_LOGGER", False),
        "engineio_logger": app.config.get("ENGINEIO_LOGGER", False),
    }


def _get_limiter_config(app: Flask) -> Dict[str, Any]:
    """Get configuration for Limiter extension."""
    return {
        "default_limits": app.config.get("RATELIMIT_DEFAULT", ["200 per day", "50 per hour"]),
        "storage_uri": app.config.get("RATELIMIT_STORAGE_URL", "memory://"),
        "strategy": "fixed-window",  # Use fixed window strategy for better performance
        "key_prefix": app.config.get("RATELIMIT_KEY_PREFIX", "assetanchor-limiter"),
        "headers_enabled": True,  # Add rate limit headers to responses
        "header_name_mapping": {
            "X-RateLimit-Limit": "X-RateLimit-Limit",
            "X-RateLimit-Remaining": "X-RateLimit-Remaining",
            "X-RateLimit-Reset": "X-RateLimit-Reset",
            "Retry-After": "Retry-After"
        },
        "swallow_errors": app.config.get("ENV") == "production",  # Don't let rate limit issues break the app in production
    }


def _register_jwt_hooks(app: Flask) -> None:
    """Register JWT hooks for customizing behavior."""
    
    @jwt.user_identity_loader
    def user_identity_lookup(user):
        """Convert user object to a JWT identity value."""
        return user.id if hasattr(user, "id") else user

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        """Convert JWT identity to a user object for @jwt_required()."""
        identity = jwt_data["sub"]
        # Import here to avoid circular imports
        from .models import User
        return User.query.filter_by(id=identity).first()
