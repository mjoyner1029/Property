"""
Extensions module for Asset Anchor API.
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
from sqlalchemy import MetaData

# Define naming convention for database constraints
naming_convention = {
    "pk": "pk_%(table_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "ix": "ix_%(table_name)s_%(column_0_name)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
}

# Initialize extensions without binding to an app
db = SQLAlchemy(metadata=MetaData(naming_convention=naming_convention))
migrate = Migrate(compare_type=True, render_as_batch=True)
jwt = JWTManager()
cors = CORS()
talisman = Talisman()
socketio = SocketIO()
mail = Mail()
# Initialize limiter with memory storage by default, will be updated in init_app if Redis is available
# We don't set default_limits here as they'll be loaded from the environment in init_app
if os.environ.get("FLASK_ENV") == "testing" or os.environ.get("TESTING") == "True":
    # For testing, use a no-op limiter
    class NoOpDecorator:
        def __init__(self, *args, **kwargs):
            pass
        
        def __call__(self, *args, **kwargs):
            if len(args) == 1 and callable(args[0]):
                return args[0]
            return self
    
    class NoOpLimiter:
        def __init__(self, *args, **kwargs):
            self.enabled = False
            
        def init_app(self, app, **kwargs):
            app.extensions['limiter'] = self
            # Ensure all rate limiting is disabled in app config
            app.config["RATELIMIT_ENABLED"] = False
            app.config["LIMITER_ENABLED"] = False
            app.config["FLASK_LIMITER_ENABLED"] = False
            app.config["RATELIMIT_STORAGE_URI"] = "memory://"
            app.config["RATELIMIT_DEFAULT"] = "1000000 per second"
            
        def limit(self, *args, **kwargs):
            return NoOpDecorator()
            
        def shared_limit(self, *args, **kwargs):
            return NoOpDecorator()
            
        def exempt(self, *args, **kwargs):
            return NoOpDecorator()
            
        def request_filter(self, *args, **kwargs):
            return NoOpDecorator()
            
    limiter = NoOpLimiter()
else:
    # For production/development, use actual limiter
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=None,  # We'll set these in init_app from environment
        storage_uri=None,
        strategy="fixed-window"
    )

def init_extensions(app: Flask) -> Flask:
    """
    Initialize all Flask extensions with the application.

    Args:
        app: Flask application instance
        
    Returns:
        Flask application instance with initialized extensions
    """
    # Initialize database - using correct initialization for the SQLAlchemy version
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    # Initialize migrations
    migrate.init_app(app, db)
    
    # Initialize JWT
    jwt.init_app(app)
    
    # Configure CORS
    cors_config = _get_cors_config(app)
    cors.init_app(app, **cors_config)
    
    # Configure Talisman (HTTPS/security headers) - only fully enabled in production
    env = app.config.get("ENV", "development")
    talisman_config = _get_talisman_config(app)
    
    # For production, apply full Talisman configuration
    # For development/testing, use minimal config for better DX
    talisman.init_app(app, **talisman_config)
    
    # Log security settings
    if env == "production":
        app.logger.info("Production security settings enabled with HSTS and CSP")
    else:
        app.logger.info("Development security settings - strict security headers disabled for better DX")
    
    # Initialize Socket.IO
    socketio_config = _get_socketio_config(app)
    socketio.init_app(app, **socketio_config)
    
    # Initialize Mail
    mail.init_app(app)
    
    # Initialize rate limiter with appropriate configuration

    # For testing, ensure limiter is completely disabled
    if app.config.get("TESTING", False):
        # Set environment variable to ensure NoOpLimiter is used
        os.environ["FLASK_ENV"] = "testing"
        os.environ["TESTING"] = "True"
        
        # The most important part - disable rate limiting completely for tests
        app.config["RATELIMIT_ENABLED"] = False
        app.config["LIMITER_ENABLED"] = False
        app.config["FLASK_LIMITER_ENABLED"] = False
        app.config["RATELIMIT_STORAGE_URI"] = "memory://"
        app.config["RATELIMIT_STORAGE_URL"] = "memory://"
        app.config["RATELIMIT_DEFAULT"] = "1000000 per second"
        app.config["RATELIMIT_APPLICATION"] = "1000000 per second"
        app.config["RATELIMIT_HEADERS_ENABLED"] = False

        # Add before_request handlers to ensure rate limiting is bypassed
        @app.before_request
        def _disable_rate_limiting():
            if 'flask_limiter.limits' in request.environ:
                request.environ.pop('flask_limiter.limits', None)
        
        # Set the NoOpLimiter in the app extensions
        if isinstance(limiter, NoOpLimiter):
            limiter.init_app(app)
        else:
            app.extensions['limiter'] = limiter
            
        # Add app-level filter to bypass rate limiting
        @app.before_request
        def bypass_all_rate_limits():
            return None
            
        # Continue with rest of the function for non-test cases
    else:
        # Get limiter configuration and apply to app.config
        limiter_config = _get_limiter_config(app)
    
        # Initialize limiter with app
        limiter.init_app(app)    # Register additional hooks
        
        # Disable rate limiting during tests - force disable
        if app.config.get("TESTING"):
            limiter.enabled = False
            
            # Add app-level handler to ensure rate limits are bypassed in tests
            @app.before_request
            def bypass_rate_limits_in_tests():
                if 'flask_limiter.limits' in request.environ:
                    request.environ.pop('flask_limiter.limits', None)
            
    _register_jwt_hooks(app)
    
    # Return the app instance
    return app


def _get_cors_config(app: Flask) -> Dict[str, Any]:
    """Get configuration for CORS extension."""
    
    # Use the CORS_ORIGINS that has already been parsed in config.py
    origins = app.config.get("CORS_ORIGINS", "*")
    
    # Ensure proper format for CORS origins
    if not isinstance(origins, list) and origins != "*":
        # If somehow the config value wasn't properly parsed yet
        if isinstance(origins, str):
            # Split by comma and strip whitespace
            origins = [origin.strip() for origin in origins.split(",") if origin.strip()]
        else:
            # Fallback to safe default
            origins = ["http://localhost:3000"]
    
    # Ensure localhost origins are included for development
    env = app.config.get("ENV", "development")
    if env != "production":
        localhost_origins = [
            "http://localhost:3000",
            "http://localhost:3001", 
            "http://localhost:3002",
            "http://localhost:5000",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5000"
        ]
        
        # If origins is a list, extend it; if it's "*", keep it as wildcard for development
        if isinstance(origins, list):
            # Add localhost origins only if they're not already in the list
            for origin in localhost_origins:
                if origin not in origins:
                    origins.append(origin)
        # Keep "*" as-is for development testing, but log a warning
        elif origins == "*" and env != "testing":
            app.logger.warning("Using wildcard CORS origin '*' in development. Consider using explicit origins.")
    
    # Expose additional headers for auth and rate limiting
    expose_headers = [
        "Content-Type", 
        "Authorization", 
        "X-RateLimit-Limit", 
        "X-RateLimit-Remaining", 
        "X-RateLimit-Reset",
        "Retry-After"
    ]
    
    return {
        "resources": r"/*",
        "origins": origins,
        "methods": ["GET", "HEAD", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
        "expose_headers": expose_headers,
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Cache-Control"],
        "supports_credentials": True,
        "vary_header": True,
        "send_wildcard": False,  # Don't send '*' in Access-Control-Allow-Origin
        "always_send": True      # Always send CORS headers for allowed origins
    }


def _get_talisman_config(app: Flask) -> Dict[str, Any]:
    """Get configuration for Talisman extension."""
    env = app.config.get("ENV", "development")
    testing = app.config.get("TESTING", False)
    
    # Disable Talisman completely in test environment
    if testing:
        return {"force_https": False, "content_security_policy": None}
    
    # Only apply strict security settings in production
    if env != "production":
        # In development, use minimal Talisman config for better DX
        return {
            "force_https": False,
            "content_security_policy": None,
            "force_file_save": False,
            "strict_transport_security": None,
            "session_cookie_secure": False,
            "frame_options": None
        }
    
    # Production configuration with strict security settings
    
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
    
    # Parse CORS origins to add to connect-src
    origins = app.config.get("CORS_ORIGINS", "")
    if isinstance(origins, str) and origins and origins != "*":
        for origin in origins.split(","):
            origin = origin.strip()
            if origin and origin not in csp_directives["connect-src"]:
                csp_directives["connect-src"].append(origin)
    
    return {
        "force_https": True,
        "content_security_policy": csp_directives,
        "content_security_policy_report_only": False,
        "content_security_policy_report_uri": app.config.get("CSP_REPORT_URI"),
        "frame_options": "DENY",
        # Force HTTPS for 1 year including subdomains
        "strict_transport_security": "max-age=31536000; includeSubDomains; preload",
        "strict_transport_security_preload": True,
        "session_cookie_secure": True,
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
        app.config["RATELIMIT_ENABLED"] = False
        app.config["RATELIMIT_STORAGE_URI"] = "memory://"
        app.config["RATELIMIT_STRATEGY"] = "fixed-window"
        app.config["RATELIMIT_DEFAULT"] = "10000 per second"
        app.config["RATELIMIT_APPLICATION"] = "10000 per second"
        app.config["RATELIMIT_HEADERS_ENABLED"] = False
        app.config["FLASK_LIMITER_ENABLED"] = False
        
        return {}  # Return empty dict as we're configuring via app.config
    
    # For production, use Redis if configured, otherwise use memory storage
    storage_uri = app.config.get("REDIS_URL", None)
    if storage_uri:
        app.config["RATELIMIT_STORAGE_URI"] = storage_uri
        
    # Set environment-aware default limits
    default_limits = os.environ.get(
        "RATELIMIT_DEFAULT", 
        app.config.get("RATELIMIT_DEFAULT", "3000 per day, 1000 per hour, 100 per minute")
    )
    
    # Set other rate limiting configuration through app.config
    app.config["RATELIMIT_DEFAULT"] = default_limits
    app.config["RATELIMIT_STRATEGY"] = "fixed-window"
    app.config["RATELIMIT_HEADERS_ENABLED"] = True
    app.config["RATELIMIT_SWALLOW_ERRORS"] = app.config.get("RATELIMIT_SWALLOW_ERRORS", True)
    app.config["RATELIMIT_KEY_PREFIX"] = app.config.get("RATELIMIT_KEY_PREFIX", "assetanchor")
    app.config["RATELIMIT_ENABLED"] = True
    
    app.logger.info(f"Rate limiting configured with default limits: {default_limits}")
    if storage_uri:
        app.logger.info(f"Using Redis for rate limiting storage: {storage_uri}")
    else:
        app.logger.warning("Using in-memory storage for rate limiting - not recommended for production")
    
    # Return an empty dict as we're configuring via app.config
    # This avoids compatibility issues with Flask-Limiter versions
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
