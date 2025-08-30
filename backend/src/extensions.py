"""
Extensions module for Ass# Ini# Initialize limiter with memory storage by default, will be updated in init_app if Redis is available
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    default_limits_deferred=True  # Defer limits to init_app
)ze limiter with memory storage by default, will be updated in init_app if Redis is available
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    default_limits_deferred=True  # Defer limits to init_app
)chor API.
Initializes and configures all Flask extensions used in the application.
"""

from __future__ import annotations

import os
from typing import Any, Dict, Optional

from flask import Flask, request
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
# Initialize with memory storage by default, will be updated in init_app if Redis is available
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=None,
    strategy="fixed-window"
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
    
    # Initialize rate limiter with appropriate configuration
    
    # For testing, ensure limiter is completely disabled
    if app.config.get("TESTING", False):
        # The most important part - disable rate limiting completely for tests
        app.config["RATELIMIT_ENABLED"] = False
        app.config["RATELIMIT_STORAGE_URI"] = "memory://"
        app.config["RATELIMIT_STORAGE_URL"] = "memory://"
        app.config["RATELIMIT_STRATEGY"] = "fixed-window"
        app.config["RATELIMIT_IN_MEMORY_FALLBACK_ENABLED"] = True
        app.config["RATELIMIT_DEFAULT"] = "1000000 per second"
        app.config["RATELIMIT_APPLICATION"] = "1000000 per second"
        app.config["RATELIMIT_APPLICATION_EXPIRES"] = 300
        app.config["RATELIMIT_HEADERS_ENABLED"] = False
        app.config["FLASK_LIMITER_ENABLED"] = False
        
        # Force limiter to recognize disabled state
        class MockLimiter:
            def __init__(self, *args, **kwargs):
                self.enabled = False
                
            def check(self, *args, **kwargs):
                return True
                
            def reset(self, *args, **kwargs):
                pass
                
            def clear(self, *args, **kwargs):
                pass
                
            def get_window_stats(self, *args, **kwargs):
                return None
                
            def hit(self, *args, **kwargs):
                return True
                
            def test(self, *args, **kwargs):
                return True
                
            def get_view_rate_limit(self, *args, **kwargs):
                return None
        
        # Create a completely disabled limiter
        class NoOpLimiter:
            """A completely disabled limiter that does nothing"""
            def __init__(self):
                self.enabled = False

            def init_app(self, *args, **kwargs):
                pass

            def limit(self, *args, **kwargs):
                return lambda fn: fn
                
            def shared_limit(self, *args, **kwargs):
                return lambda fn: fn

            def exempt(self, *args, **kwargs):
                return lambda fn: fn if callable(args[0]) else args[0]

            def request_filter(self, *args, **kwargs):
                return lambda fn: fn
                
            def reset(self):
                pass
                
            def check(self, *args, **kwargs):
                return True
                
            def get_application_limits(self, *args, **kwargs):
                return []
                
            def get_window_stats(self, *args, **kwargs):
                return None

        # Replace the limiter with our no-op version
        global limiter
        limiter = NoOpLimiter()
        
        # Set the limiter in the app extensions
        app.extensions['limiter'] = limiter
        
        # Also add before_request handlers to ensure rate limiting is bypassed
        @app.before_request
        def _disable_rate_limiting():
            request.environ.pop('flask_limiter.limits', None)
            
        # Override any potential limiter middleware in WSGI stack
        def _no_op_limiter_middleware(app):
            def middleware(environ, start_response):
                return app(environ, start_response)
            return middleware
            
        if hasattr(app, 'wsgi_app') and hasattr(app.wsgi_app, '__wrapped__'):
            # Unwrap any limiter middleware
            app.wsgi_app = app.wsgi_app.__wrapped__
        
        return  # Skip the rest of the setup for tests
    
    # Get limiter configuration and apply to app.config
    limiter_config = _get_limiter_config(app)
    
    # Initialize limiter with app
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
    
    # Ensure CSP is always applied in production
    if app.config.get("ENV") == "production" and csp_directives is None:
        csp_directives = {
            "default-src": ["'self'"],
            "script-src": ["'self'"],
            "style-src": ["'self'", "'unsafe-inline'"],
            "img-src": ["'self'", "data:"],
            "connect-src": ["'self'", "https://api.stripe.com"]
        }

    return {
        "force_https": True if app.config.get("ENV") == "production" else app.config.get("FORCE_HTTPS", False),
        "content_security_policy": csp_directives,
        "content_security_policy_report_only": False if app.config.get("ENV") == "production" else not app.config.get("CSP_ENFORCE", True),
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
    # Flask-Limiter 3.x accepts different parameters in init_app than earlier versions
    # Most configuration is done at Limiter creation time or via app.config
    
    # For tests, use a configuration that completely disables rate limiting
    if app.config.get("TESTING", False):
        return {
            "enabled": False,  # Disable rate limiting in tests
            "storage_uri": "memory://",
            "default_limits": ["10000 per second"],
            "application_limits": ["10000 per second"],
            "headers_enabled": False,
            "swallow_errors": True
        }
    
    # For production, use Redis if configured, otherwise use memory storage
    storage_uri = app.config.get("REDIS_URL", None)
    if storage_uri:
        app.config["RATELIMIT_STORAGE_URI"] = storage_uri
    
    # Set other rate limiting configuration through app.config
    app.config["RATELIMIT_STRATEGY"] = "fixed-window"
    app.config["RATELIMIT_HEADERS_ENABLED"] = True
    app.config["RATELIMIT_SWALLOW_ERRORS"] = app.config.get("RATELIMIT_SWALLOW_ERRORS", True)
    app.config["RATELIMIT_KEY_PREFIX"] = app.config.get("RATELIMIT_KEY_PREFIX", "assetanchor")
    
    # Return minimal configuration for init_app - most config is set via app.config
    return {}


def _register_jwt_hooks(app: Flask) -> None:
    """Register JWT hooks for customizing behavior."""
    
    @jwt.user_identity_loader
    def user_identity_lookup(user):
        """Convert user object to a JWT identity value."""
        # If user is a dict with id, just use the ID
        if isinstance(user, dict) and 'id' in user:
            return str(user['id'])
        elif hasattr(user, "id"):
            return str(user.id)
        else:
            # Ensure we always return a string for compatibility
            return str(user)

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        """Convert JWT identity to a user object for @jwt_required()."""
        identity = jwt_data["sub"]
        print(f"DEBUG - JWT lookup identity: {identity}, type: {type(identity)}")
        
        # Identity will be a string, but we need an int for the database lookup
        try:
            user_id = int(identity)
        except (ValueError, TypeError):
            print(f"WARNING: Could not convert JWT identity to int: {identity}")
            # If we can't convert to int, try to use as is (although this should not happen)
            user_id = identity
            
        # Import here to avoid circular imports
        from .models import User
        
        # Log what we're looking up
        print(f"DEBUG - Looking up user with ID: {user_id}, type: {type(user_id)}")
        
        user = User.query.filter_by(id=user_id).first()
        print(f"DEBUG - Found user: {user}")
        return user
        
    # Register JWT error handlers
    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        return {
            'message': f'Invalid token: {error_string}',
            'error': 'invalid_token'
        }, 401
    
    @jwt.expired_token_loader
    def expired_token_callback(_jwt_header, jwt_data):
        return {
            'message': 'Token has expired',
            'error': 'token_expired'
        }, 401
        
    @jwt.unauthorized_loader
    def unauthorized_callback(error_string):
        print(f"DEBUG - JWT unauthorized: {error_string}")
        return {
            'message': f'Missing or invalid Authorization header: {error_string}',
            'error': 'authorization_required'
        }, 401
