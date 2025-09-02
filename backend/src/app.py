"""
The application factory for the Asset Anchor API.
Creates and configures Flask app with blueprints and extensions.
"""
from __future__ import annotations

import os
import uuid
import logging
import json
from typing import Optional, Dict, Any
from datetime import datetime

from flask import Flask, jsonify, request, current_app
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix
import traceback
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from jinja2 import TemplateNotFound
from sqlalchemy.exc import SQLAlchemyError

from .config import get_config, get_env_flag
from .extensions import (
    db,
    migrate,
    jwt,
    cors,
    talisman,
    socketio,
    mail,
    limiter,
    init_extensions
)


def create_app(config_name: Optional[str] = None) -> Flask:
    """
    Application factory function that creates and configures a Flask app.

    Args:
        config_name (str, optional): The name of the configuration to use.
            If None, will use APP_ENV environment variable. Defaults to None.

    Returns:
        Flask: The configured Flask application.
    
    Raises:
        ValueError: If required configuration is missing in production
    """
    app = Flask(__name__)
    
    # Disable strict slashes to avoid 308 redirects when URLs differ only by trailing slash
    app.url_map.strict_slashes = False

    # Load configuration
    try:
        config_obj = get_config(config_name)
        app.config.from_object(config_obj)
    except ValueError as e:
        app.logger.critical(f"Configuration error: {str(e)}")
        raise  # Re-raise to fail fast in production

    # Configure logging
    configure_logging(app)
    
    # Configure Sentry before other initialization to catch any errors
    configure_sentry(app)
    
    # Configure ProxyFix for proper IP handling behind proxies
    configure_proxy_fix(app)
    
    # Configure rate limiting settings from environment
    # For testing, completely disable rate limiting
    if app.config.get("TESTING", False):
        app.config["RATELIMIT_ENABLED"] = False
        app.config["LIMITER_ENABLED"] = False
        app.config["FLASK_LIMITER_ENABLED"] = False
        app.config["RATELIMIT_STORAGE_URI"] = "memory://"
        app.config["RATELIMIT_STORAGE_URL"] = "memory://"
        app.config["RATELIMIT_DEFAULT"] = "10000 per second"
        # Also disable potential environment vars that might affect rate limiting
        os.environ["FLASK_LIMITER_ENABLED"] = "False"
        app.logger.info("Rate limiting is DISABLED for testing environment")
    else:
        # For production/development, configure from environment
        default_limits = os.environ.get(
            "RATELIMIT_DEFAULT", 
            app.config.get("RATELIMIT_DEFAULT", "3000 per day, 1000 per hour, 100 per minute")
        )
        app.config["RATELIMIT_DEFAULT"] = default_limits
        
        # Use Redis for storage if available, otherwise memory
        storage_uri = os.environ.get(
            "RATELIMIT_STORAGE_URL", 
            app.config.get("REDIS_URL", "memory://")
        )
        app.config["RATELIMIT_STORAGE_URI"] = storage_uri
        app.config["RATELIMIT_STORAGE_URL"] = storage_uri
        
        # Other rate limiting config
        app.config["RATELIMIT_HEADERS_ENABLED"] = True
        app.config["RATELIMIT_SWALLOW_ERRORS"] = app.config.get("RATELIMIT_SWALLOW_ERRORS", True)
        app.config["RATELIMIT_KEY_PREFIX"] = app.config.get("RATELIMIT_KEY_PREFIX", "assetanchor")
        app.config["RATELIMIT_ENABLED"] = True
        
        app.logger.info(f"Rate limiting configured with default limits: {default_limits}")
    
    # Initialize extensions with the app
    init_extensions(app)
    
    # Ensure rate limiter is fully disabled in test mode
    if app.config.get("TESTING", False):
        app.config["RATELIMIT_ENABLED"] = False
        app.config["LIMITER_ENABLED"] = False
        app.config["FLASK_LIMITER_ENABLED"] = False
        
        # If using Flask-Limiter v2+
        if hasattr(limiter, 'enabled'):
            limiter.enabled = False
        
        # Add direct monkey patch to disable the limiter's key rate limit function
        if hasattr(limiter, '_limiter'):
            # Replace the rate limiting function with a no-op
            limiter._limiter.hit = lambda *args, **kwargs: True
            limiter._limiter.get_window_stats = lambda *args, **kwargs: (0, 0, 0, 0)
            
        # For Flask-Limiter v1.x - use a before_request handler to bypass limits
        @app.before_request
        def bypass_limiter_in_tests():
            # Forcefully remove any limiter information from the request
            request.environ.pop('flask_limiter.limits', None)
            
            # Monkey patch the limiter directly for this request
            if hasattr(limiter, 'limiter'):
                old_check = limiter.limiter.check
                limiter.limiter.check = lambda *args, **kwargs: True
            
            # Add debug log to verify rate limiting is disabled
            app.logger.debug("Rate limiting disabled for testing")
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register health check endpoints
    register_health_checks(app)
    
    # Register blueprints
    register_blueprints(app)
    
    # Log application startup
    app.logger.info(f"Application started with {app.config.get('ENV')} configuration")

    # Force HTTPS in production
    if app.config.get("ENV") == "production":
        app.config['PREFERRED_URL_SCHEME'] = 'https'

    # Add test route for Sentry verification (only in development)
    if app.config.get("ENV") != "production":
        @app.route("/debug-sentry")
        def debug_sentry():
            app.logger.info("Testing Sentry integration - intentional error")
            division_by_zero = 1 / 0  # This will trigger a ZeroDivisionError
            return "This won't be reached"

    return app


def register_blueprints(app: Flask) -> None:
    """Register all Flask blueprints with standardized URL prefix structure."""
    # All API routes should be under /api
    API_PREFIX = '/api'
    
    # Feature flags for risk remediation - enable only completed modules
    ENABLE_AUTH = True
    ENABLE_CORE_API = True
    ENABLE_WEBHOOKS = True
    ENABLE_PAYMENTS = True
    ENABLE_PROPERTIES = True
    ENABLE_TENANTS = True
    ENABLE_MESSAGES = True
    ENABLE_NOTIFICATIONS = True
    ENABLE_ADMIN = True
    ENABLE_MFA = True
    ENABLE_DOCS = True
    
    blueprints = []
    
    # Authentication routes
    if ENABLE_AUTH:
        try:
            from .routes.auth_routes import bp as auth_bp
            blueprints.append((auth_bp, f'{API_PREFIX}/auth'))
            
            # MFA routes
            if ENABLE_MFA:
                try:
                    from .routes.mfa_routes import mfa_bp
                    blueprints.append((mfa_bp, f'{API_PREFIX}/auth/mfa'))
                except Exception as e:
                    app.logger.warning(f"Failed to load mfa_bp: {str(e)}")
        except Exception as e:
            app.logger.warning(f"Failed to load auth_bp: {str(e)}")
    
    # Core API routes
    if ENABLE_CORE_API:
        try:
            from .routes.api_routes import api_bp
            blueprints.append((api_bp, f'{API_PREFIX}'))
        except Exception as e:
            app.logger.warning(f"Failed to load api_bp: {str(e)}")
        
        # User routes
        try:
            from .routes.user_routes import user_bp
            blueprints.append((user_bp, f'{API_PREFIX}/users'))
        except Exception as e:
            app.logger.warning(f"Failed to load user_bp: {str(e)}")
            
        # Logs routes
        try:
            from .routes.logs_routes import logs_bp
            blueprints.append((logs_bp, f'{API_PREFIX}/logs'))
        except Exception as e:
            app.logger.warning(f"Failed to load logs_bp: {str(e)}")
            
        # Document routes
        try:
            from .routes.document_routes import document_bp
            blueprints.append((document_bp, f'{API_PREFIX}/documents'))
        except Exception as e:
            app.logger.warning(f"Failed to load document_bp: {str(e)}")
            
        # Onboarding routes
        try:
            from .routes.onboard_routes import bp as onboarding_bp
            blueprints.append((onboarding_bp, f'{API_PREFIX}/onboard'))
        except Exception as e:
            app.logger.warning(f"Failed to load onboarding_bp: {str(e)}")
    
    # Property management
    if ENABLE_PROPERTIES:
        try:
            from .routes.property_routes import property_bp
            blueprints.append((property_bp, f'{API_PREFIX}/properties'))
            
            # Unit routes
            try:
                from .routes.unit_routes import unit_bp
                blueprints.append((unit_bp, f'{API_PREFIX}/units'))
            except Exception as e:
                app.logger.warning(f"Failed to load unit_bp: {str(e)}")
        except Exception as e:
            app.logger.warning(f"Failed to load property_bp: {str(e)}")
    
    # Tenant management
    if ENABLE_TENANTS:
        try:
            from .routes.tenant_routes import tenant_bp
            blueprints.append((tenant_bp, f'{API_PREFIX}/tenants'))
        except Exception as e:
            app.logger.warning(f"Failed to load tenant_bp: {str(e)}")
    
        # Payment routes
    if ENABLE_PAYMENTS:
        try:
            from .routes.payment_routes import payment_bp
            blueprints.append((payment_bp, f'{API_PREFIX}/payments'))
        except Exception as e:
            app.logger.warning(f"Failed to load payment routes: {str(e)}")
            
        # Invoice routes
        try:
            from .routes.invoice_routes import invoice_bp
            blueprints.append((invoice_bp, f'{API_PREFIX}/invoices'))  # Register with API prefix
        except Exception as e:
            app.logger.warning(f"Failed to load invoice routes: {str(e)}")
        
        # Stripe-specific routes - separated to avoid failing all payment routes if stripe fails
        try:
            # Use the direct routes implementation
            from .routes.direct_stripe_routes import direct_stripe_bp
            blueprints.append((direct_stripe_bp, ''))  # Blueprint has explicitly prefixed routes
        except Exception as e:
            app.logger.warning(f"Failed to load stripe routes: {str(e)}")
    
    # Message routes
    if ENABLE_MESSAGES:
        try:
            from .routes.messages_routes import messages_bp
            blueprints.append((messages_bp, f'{API_PREFIX}/messages'))
        except Exception as e:
            app.logger.warning(f"Failed to load messages_bp: {str(e)}")
    
    # Notification routes
    if ENABLE_NOTIFICATIONS:
        try:
            from .routes.notification_routes import notification_bp
            blueprints.append((notification_bp, f'{API_PREFIX}/notifications'))
        except Exception as e:
            app.logger.warning(f"Failed to load notification_bp: {str(e)}")
    
    # Analytics routes
    try:
        from .routes.analytics_routes import analytics_bp
        blueprints.append((analytics_bp, f'{API_PREFIX}/analytics'))
    except Exception as e:
        app.logger.warning(f"Failed to load analytics_bp: {str(e)}")
    
    # Dashboard routes
    try:
        from .routes.dashboard_routes import dashboard_bp
        blueprints.append((dashboard_bp, f'{API_PREFIX}/dashboard'))
    except Exception as e:
        app.logger.warning(f"Failed to load dashboard_bp: {str(e)}")
    
    # Invitation routes
    try:
        from .routes.invite_routes import invite_bp
        blueprints.append((invite_bp, f'{API_PREFIX}/invites'))
    except Exception as e:
        app.logger.warning(f"Failed to load invite_bp: {str(e)}")
        
    # Lease routes
    try:
        from .routes.lease_routes import lease_bp
        blueprints.append((lease_bp, f'{API_PREFIX}/leases'))
    except Exception as e:
        app.logger.warning(f"Failed to load lease_bp: {str(e)}")
        
    # Maintenance routes
    try:
        from .routes.maintenance_routes import maintenance_bp
        blueprints.append((maintenance_bp, f'{API_PREFIX}/maintenance'))
    except Exception as e:
        app.logger.warning(f"Failed to load maintenance_bp: {str(e)}")
    
    # Admin routes
    if ENABLE_ADMIN:
        try:
            from .routes.admin_routes import admin_bp
            blueprints.append((admin_bp, f'{API_PREFIX}/admin'))
        except Exception as e:
            app.logger.warning(f"Failed to load admin_bp: {str(e)}")
    
    # Webhook routes - special case outside /api prefix
    if ENABLE_WEBHOOKS:
        try:
            from .routes.webhook_routes import webhook_bp
            blueprints.append((webhook_bp, '/webhooks'))
        except Exception as e:
            app.logger.warning(f"Failed to load webhook_bp: {str(e)}")
    
    # API Documentation
    if ENABLE_DOCS:
        try:
            from .routes.docs_routes import docs_bp
            blueprints.append((docs_bp, f'{API_PREFIX}/docs'))
        except Exception as e:
            app.logger.warning(f"Failed to load docs_bp: {str(e)}")
    
    # Health check routes - Always enabled and at root level for monitoring
    try:
        from .routes.health_routes import health_bp
        # Register both at API prefix and root level for flexibility
        blueprints.append((health_bp, f'{API_PREFIX}/health'))
        
        # Register a separate instance at root level for Render health checks
        from flask import Blueprint, jsonify
        from sqlalchemy import text
        
        health_root_bp = Blueprint('health_root', __name__)
        
        @health_root_bp.route('/healthz')
        @limiter.exempt
        def healthz():
            """Simple health check endpoint for Render"""
            return jsonify({"status": "ok"}), 200
            
        @health_root_bp.route('/readyz')
        @limiter.exempt
        def readyz():
            """Readiness probe that checks database connectivity"""
            try:
                # Check the database connection
                db.session.execute(text("SELECT 1"))
                return jsonify({"status": "ok", "db": "connected"}), 200
            except Exception as e:
                return jsonify({"status": "error", "message": str(e)}), 500
                
        blueprints.append((health_root_bp, ''))
    except Exception as e:
        app.logger.error(f"Failed to load health_bp: {str(e)}")
    
    # Register all blueprints
    for blueprint, url_prefix in blueprints:
        app.register_blueprint(blueprint, url_prefix=url_prefix)
        app.logger.info(f"Registered {blueprint.name} at {url_prefix}")
        
    # Log registration summary
    app.logger.info(f"Registered {len(blueprints)} blueprints")
    
    # Root route is defined in register_health_checks


def register_error_handlers(app: Flask) -> None:
    """Register error handlers for various error types."""
    
    # Import tracing utilities and required modules
    from .utils.tracing import initialize_request_context, clear_trace_context, log_with_context
    from sqlalchemy.exc import SQLAlchemyError, DatabaseError
    from werkzeug.exceptions import TooManyRequests, Unauthorized, Forbidden
    import traceback
    
    # Generate a trace ID for request tracking
    @app.before_request
    def before_request():
        """Initialize request context with trace ID and log request information."""
        # Generate and store trace ID
        trace_id = initialize_request_context()
        request.trace_id = trace_id
        
        # Add Production Security Check
        if app.config.get('ENV') == 'production':
            # Force HTTPS in production
            if not request.is_secure and not request.headers.get('X-Forwarded-Proto') == 'https':
                app.logger.warning(f"Non-HTTPS request received in production: {request.url}")
                
        # Log request details for debugging and audit trail
        if app.config.get('LOG_REQUESTS', False):
            # Don't log health check endpoints to reduce noise
            if not request.path.startswith('/health') and not request.path.startswith('/api/health'):
                log_with_context(
                    f"Request: {request.method} {request.path}",
                    level='debug',
                    remote_addr=request.remote_addr,
                    user_agent=request.user_agent.string if request.user_agent else None,
                    content_type=request.content_type
                )
    
    # Clean up trace context after request
    @app.teardown_request
    def teardown_request(exception=None):
        clear_trace_context()
    
    # Add trace ID and security headers to response
    @app.after_request
    def add_response_headers(response):
        """Add security and trace headers to responses."""
        if hasattr(request, 'trace_id'):
            response.headers['X-Trace-ID'] = request.trace_id
        
        # Add security headers if in production and not already set by Talisman
        if app.config.get('ENV') == 'production':
            if 'X-Content-Type-Options' not in response.headers:
                response.headers['X-Content-Type-Options'] = 'nosniff'
            if 'X-Frame-Options' not in response.headers:
                response.headers['X-Frame-Options'] = 'DENY'
            if 'X-XSS-Protection' not in response.headers:
                response.headers['X-XSS-Protection'] = '1; mode=block'
            if 'Cache-Control' not in response.headers and request.path != '/':
                # Add Cache-Control header for API endpoints, excluding static assets
                response.headers['Cache-Control'] = 'no-store, max-age=0'
            
        return response
    
    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        """Handle HTTPExceptions."""
        trace_id = getattr(request, 'trace_id', str(uuid.uuid4()))
        
        # Log the error with contextual info
        context_data = {
            'trace_id': trace_id,
            'path': request.path,
            'method': request.method,
            'remote_addr': request.remote_addr,
            'status_code': error.code,
            'error_name': error.name
        }
        
        # Rate limiting errors are expected, so log at lower level
        level = 'info' if isinstance(error, TooManyRequests) else 'warning'
        
        # Handle authentication/authorization errors with appropriate logging
        if isinstance(error, (Unauthorized, Forbidden)):
            # Add auth-specific context if available
            if hasattr(request, 'jwt_claims'):
                context_data['user_id'] = request.jwt_claims.get('sub')
                context_data['scopes'] = request.jwt_claims.get('scopes', [])
        
        log_with_context(
            f"HTTP Exception: {error.code} {error.name}",
            level=level,
            **context_data
        )
        
        # Return JSON response with error details and trace ID
        response = jsonify({
            'error': error.name,
            'message': error.description,
            'status_code': error.code,
            'trace_id': trace_id
        })
        response.status_code = error.code
        return response
    
    @app.errorhandler(SQLAlchemyError)
    def handle_database_error(error):
        """Handle database errors with appropriate logging."""
        trace_id = getattr(request, 'trace_id', str(uuid.uuid4()))
        
        # Log detailed error info but return generic message to user
        context_data = {
            'trace_id': trace_id,
            'path': request.path,
            'method': request.method,
            'error_type': error.__class__.__name__
        }
        
        # Get user ID from JWT if available
        if hasattr(request, 'jwt_claims'):
            context_data['user_id'] = request.jwt_claims.get('sub')
        
        # Log full error with stack trace for troubleshooting
        app.logger.error(
            f"Database error: {str(error)}",
            extra=context_data,
            exc_info=True  # Include stack trace
        )
        
        # Don't leak sensitive information in production
        if app.config.get('ENV') != 'production':
            message = f"Database error: {str(error)}"
        else:
            message = "A database error occurred. Please try again later."
        
        response = jsonify({
            'error': 'Database Error',
            'message': message,
            'status_code': 500,
            'trace_id': trace_id
        })
        response.status_code = 500
        return response

    @app.errorhandler(TemplateNotFound)
    def handle_template_not_found(error):
        """Handle Jinja2 template not found errors with JSON response."""
        trace_id = getattr(request, 'trace_id', str(uuid.uuid4()))
        
        # Log the exception with useful debugging information
        context_data = {
            'trace_id': trace_id,
            'path': request.path,
            'method': request.method,
            'template_name': str(error),
            'error_type': 'TemplateNotFound'
        }
        
        # Get user ID from JWT if available
        if hasattr(request, 'jwt_claims'):
            context_data['user_id'] = request.jwt_claims.get('sub')
        
        app.logger.error(
            f"Template not found: {str(error)}",
            extra=context_data
        )
        
        # Return JSON response instead of HTML error
        if app.config.get('ENV') != 'production':
            message = f"Template not found: {str(error)}"
        else:
            message = "Resource not available"
            
        response = jsonify({
            'error': 'Template Not Found',
            'message': message,
            'status_code': 404,
            'trace_id': trace_id
        })
        response.status_code = 404
        return response

    @app.errorhandler(Exception)
    def handle_generic_exception(error):
        """
        Handle generic exceptions and ensure proper logging.
        Logs structured error information with stack traces.
        """
        trace_id = getattr(request, 'trace_id', str(uuid.uuid4()))
        
        # Collect detailed context for logging
        context_data = {
            'trace_id': trace_id,
            'path': request.path,
            'method': request.method,
            'remote_addr': request.remote_addr,
            'error_type': error.__class__.__name__,
            'endpoint': request.endpoint
        }
        
        # Get user ID from JWT if available
        if hasattr(request, 'jwt_claims'):
            context_data['user_id'] = request.jwt_claims.get('sub')
        
        # Add request headers (excluding sensitive data)
        headers = dict(request.headers)
        sensitive_headers = ['authorization', 'cookie', 'set-cookie', 'x-auth-token']
        for header in sensitive_headers:
            if header.lower() in headers:
                headers[header.lower()] = "[REDACTED]"
        context_data['headers'] = headers
        
        # Get full stack trace for comprehensive logging
        stack_trace = traceback.format_exc()
        
        # Use structured logging with stack trace in context
        app.logger.error(
            f"Unhandled exception: {str(error)}",
            extra={
                'extra': context_data,
                'stack_trace': stack_trace,
                'exception_name': error.__class__.__name__,
                'exception_args': [str(arg) for arg in getattr(error, 'args', [])],
                'exception_module': error.__class__.__module__
            },
            exc_info=True  # Include exception info for Sentry and other integrations
        )
        
        # In development, include the error details
        if app.config.get('ENV') != 'production':
            message = str(error)
        else:
            message = 'An unexpected error occurred. Our team has been notified.'
        
        response = jsonify({
            'error': 'Internal Server Error',
            'message': message,
            'status_code': 500,
            'trace_id': trace_id
        })
        response.status_code = 500
        return response


def configure_logging(app: Flask) -> None:
    """
    Configure application logging with structured JSON format to stdout.
    Always outputs JSON format for better parsing and consistent logs across environments.
    """
    log_level_name = app.config.get('LOG_LEVEL', 'INFO')
    log_level = getattr(logging, log_level_name.upper(), logging.INFO)
    
    # Clear existing handlers to avoid duplication
    for handler in app.logger.handlers:
        app.logger.removeHandler(handler)
    
    # Set log level (default to INFO)
    app.logger.setLevel(log_level)
    
    # Create a custom JSON formatter for structured logging
    class JsonFormatter(logging.Formatter):
        def format(self, record):
            # Get trace ID from request context if available
            trace_id = None
            try:
                from flask import has_request_context, request
                if has_request_context() and hasattr(request, 'trace_id'):
                    trace_id = request.trace_id
            except Exception:
                pass
            
            # Create structured log record
            log_record = {
                "timestamp": datetime.utcnow().isoformat(),
                "level": record.levelname,
                "message": record.getMessage(),
                "module": record.module,
                "function": record.funcName,
                "line": record.lineno,
                "trace_id": trace_id or str(uuid.uuid4()),
                "environment": app.config.get('ENV', 'development')
            }
            
            # Add any extra attributes from the record
            if hasattr(record, 'extra') and isinstance(record.extra, dict):
                for key, value in record.extra.items():
                    log_record[key] = value
                    
            # Add exception info with full stack trace if present
            if record.exc_info:
                log_record['exception'] = self.formatException(record.exc_info)
                log_record['exception_type'] = record.exc_info[0].__name__
                
            # Add any additional context from record
            if hasattr(record, '__dict__'):
                for key, value in record.__dict__.items():
                    if key not in ('args', 'asctime', 'created', 'exc_info', 'exc_text', 
                                  'filename', 'funcName', 'id', 'levelname', 'levelno', 
                                  'lineno', 'module', 'msecs', 'message', 'msg', 'name', 
                                  'pathname', 'process', 'processName', 'relativeCreated', 
                                  'stack_info', 'thread', 'threadName', 'extra') and not key.startswith('_'):
                        log_record[key] = value
            
            return json.dumps(log_record)
    
    # Create a handler that outputs to stdout (not stderr)
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    app.logger.addHandler(handler)
    
    # Set the root logger to use our configuration
    root_logger = logging.getLogger()
    root_logger.handlers = []
    root_logger.addHandler(handler)
    root_logger.setLevel(log_level)


def configure_proxy_fix(app: Flask) -> None:
    """
    Configure ProxyFix middleware for proper handling of proxy headers.
    
    This ensures the application correctly handles X-Forwarded-* headers from proxies,
    which is critical for security features like HTTPS detection and client IP tracking.
    """
    # Apply in all environments to ensure consistent behavior
    # But with stricter settings in development to avoid security issues
    if app.config.get('ENV') == 'production':
        # Trust X-Forwarded-* headers from the proxy
        app.wsgi_app = ProxyFix(
            app.wsgi_app, 
            x_for=1,      # X-Forwarded-For
            x_proto=1,    # X-Forwarded-Proto
            x_host=1,     # X-Forwarded-Host
            x_port=1,     # X-Forwarded-Port (now enabled)
            x_prefix=1    # X-Forwarded-Prefix (now enabled)
        )
        app.logger.info("ProxyFix middleware configured with full proxy header support")
    else:
        # In development, still use ProxyFix but with limited trust
        app.wsgi_app = ProxyFix(
            app.wsgi_app,
            x_for=1, 
            x_proto=1,
            x_host=0,
            x_port=0, 
            x_prefix=0
        )
        app.logger.info("ProxyFix middleware configured with limited proxy header support for development")


def register_health_checks(app: Flask) -> None:
    """Register health check endpoints."""
    
    @app.route('/')
    def index():
        """Root endpoint for the API."""
        # Get dynamic feature flag statuses
        ENABLE_DOCS = app.config.get('ENABLE_DOCS', False)
        
        return jsonify({
            'name': 'Asset Anchor API',
            'version': app.config.get('VERSION', 'unknown'),
            'status': 'online',
            'environment': app.config.get('ENV', 'unknown'),
            'api_base_url': '/api',
            'documentation': '/api/docs' if ENABLE_DOCS else None,
            'health_check': '/api/health'
        })
    
    @app.route('/health')
    def health():
        """Basic health check endpoint."""
        git_sha = os.environ.get('GIT_SHA', 'unknown')
        return jsonify({
            'status': 'healthy',
            'version': app.config.get('VERSION', '1.0.0'),
            'git_sha': git_sha,
            'environment': app.config.get('ENV', 'development')
        })
    
    @app.route('/ready')
    def readiness():
        """Readiness check that verifies database connectivity."""
        try:
            # Check database connection
            db_ok = db.session.execute("SELECT 1").scalar() == 1
            
            # Check Redis if configured
            redis_ok = True
            if app.config.get('REDIS_URL'):
                try:
                    from redis import Redis
                    redis_client = Redis.from_url(app.config.get('REDIS_URL'))
                    redis_ok = redis_client.ping()
                except Exception as e:
                    app.logger.error(f"Redis health check failed: {e}")
                    redis_ok = False
            
            if db_ok and redis_ok:
                return jsonify({
                    'status': 'ready',
                    'database': 'connected',
                    'redis': 'connected' if redis_ok else 'not_configured',
                    'version': app.config.get('VERSION', '1.0.0')
                })
            else:
                status = {
                    'status': 'not_ready',
                    'database': 'connected' if db_ok else 'error',
                    'redis': 'connected' if redis_ok else 'error',
                    'version': app.config.get('VERSION', '1.0.0')
                }
                return jsonify(status), 503
        except Exception as e:
            app.logger.error(f"Readiness check failed: {e}")
            return jsonify({
                'status': 'not_ready',
                'error': str(e),
                'version': app.config.get('VERSION', '1.0.0')
            }), 503


def configure_sentry(app: Flask) -> None:
    """
    Configure Sentry for error tracking and performance monitoring.
    Initializes when SENTRY_DSN is available in environment.
    """
    # Check if Sentry is explicitly disabled
    if os.environ.get('DISABLE_SENTRY') == 'True' or app.config.get('TESTING', False):
        app.logger.warning("Sentry integration disabled. Error tracking not available.")
        return
        
    sentry_dsn = app.config.get('SENTRY_DSN') or os.environ.get('SENTRY_DSN')
    
    if sentry_dsn:
        environment = app.config.get('ENV', 'development')
        git_sha = os.environ.get('GIT_SHA', 'unknown')
        
        # Configure Sentry integrations
        integrations = [
            FlaskIntegration(),          # Flask integration
            SqlalchemyIntegration(),     # SQLAlchemy integration
            LoggingIntegration(          # Logging integration
                level=logging.INFO,      # Capture info and above as breadcrumbs
                event_level=logging.ERROR # Send error events to Sentry
            )
        ]
        
        # Try to add SocketIO integration if available
        try:
            from sentry_sdk.integrations.socketio import SocketioIntegration
            integrations.append(SocketioIntegration())
        except ImportError:
            app.logger.info("Sentry SocketIO integration not available")
            
        # Try to add Redis integration if available
        try:
            from sentry_sdk.integrations.redis import RedisIntegration
            integrations.append(RedisIntegration())
        except ImportError:
            app.logger.info("Sentry Redis integration not available")
        
        # Set consistent traces_sample_rate of 0.1 (10%) as specified in requirements
        traces_sample_rate = app.config.get('SENTRY_TRACES_SAMPLE_RATE', 0.1)
        
        # Initialize Sentry SDK
        sentry_sdk.init(
            dsn=sentry_dsn,
            environment=environment,
            release=git_sha,
            integrations=integrations,
            traces_sample_rate=traces_sample_rate,
            # Add data like request headers and IP for users
            send_default_pii=True,
            # Performance monitoring
            _experiments={
                "profiles_sample_rate": app.config.get('SENTRY_PROFILES_SAMPLE_RATE', 0.05),
            },
            # Add before_send hook to scrub sensitive data
            before_send=_sentry_before_send,
            # Set max breadcrumbs to avoid large events
            max_breadcrumbs=50,
            # Use in-app packages to filter stacktraces
            in_app_include=['src']
        )
        
        # Add custom tags
        with sentry_sdk.configure_scope() as scope:
            scope.set_tag('app_name', 'asset_anchor_api')
            scope.set_tag('version', app.config.get('VERSION', '1.0.0'))
        
        # Set up Flask-specific error handling
        @app.before_request
        def capture_request_info():
            # Make sure we add request data to any Sentry events
            if not hasattr(request, 'trace_id'):
                request.trace_id = str(uuid.uuid4())
            
            # Add trace ID to Sentry scope
            with sentry_sdk.configure_scope() as scope:
                scope.set_tag("trace_id", request.trace_id)
                scope.set_tag("endpoint", request.endpoint)
                # User data will be captured automatically with send_default_pii=True
        
        app.logger.info(f"Sentry initialized for {environment} environment with {traces_sample_rate*100}% trace sampling")
    else:
        app.logger.warning("Sentry DSN not configured. Error tracking disabled.")


def _sentry_before_send(event, hint):
    """
    Hook to scrub sensitive data from Sentry events.
    
    Args:
        event: The event dictionary
        hint: A dictionary containing additional information about the event
        
    Returns:
        The modified event or None to discard the event
    """
    # Import here to avoid circular imports
    import copy
    import re
    from flask import has_request_context, request, current_app
    
    # Make a deep copy to avoid modifying shared data
    event = copy.deepcopy(event)
    
    # Sensitive field patterns to redact
    sensitive_patterns = [
        re.compile(r'password', re.IGNORECASE),
        re.compile(r'passwd', re.IGNORECASE),
        re.compile(r'secret', re.IGNORECASE),
        re.compile(r'token', re.IGNORECASE),
        re.compile(r'auth', re.IGNORECASE),
        re.compile(r'key', re.IGNORECASE),
        re.compile(r'credential', re.IGNORECASE),
        re.compile(r'api[_-]?key', re.IGNORECASE),
        re.compile(r'access[_-]?key', re.IGNORECASE),
        re.compile(r'credit[_-]?card', re.IGNORECASE),
        re.compile(r'card[_-]?number', re.IGNORECASE),
        re.compile(r'ccnum', re.IGNORECASE),
        re.compile(r'cvv', re.IGNORECASE),
        re.compile(r'cvv2', re.IGNORECASE),
        re.compile(r'pin', re.IGNORECASE),
        re.compile(r'session', re.IGNORECASE),
        re.compile(r'ssn', re.IGNORECASE),
        re.compile(r'passphrase', re.IGNORECASE),
        re.compile(r'private[_-]?key', re.IGNORECASE),
    ]
    
    def should_redact(key):
        """Check if a key should be redacted"""
        for pattern in sensitive_patterns:
            if pattern.search(key):
                return True
        return False
    
    def redact_dict(data, path=""):
        """Recursively redact sensitive data in a dict"""
        if not isinstance(data, dict):
            return data
        
        for key, value in list(data.items()):
            # Check if this key should be redacted
            current_path = f"{path}.{key}" if path else key
            if should_redact(key):
                data[key] = "[REDACTED]"
            # Recursively check nested dicts
            elif isinstance(value, dict):
                data[key] = redact_dict(value, current_path)
            # Handle lists containing dicts
            elif isinstance(value, list):
                data[key] = [
                    redact_dict(item, f"{current_path}[{i}]") if isinstance(item, dict) else item
                    for i, item in enumerate(value)
                ]
        return data
    
    # Redact request data
    if 'request' in event:
        # Redact data field (POST bodies, etc.)
        if 'data' in event['request']:
            data = event['request'].get('data', {})
            if isinstance(data, dict):
                event['request']['data'] = redact_dict(data)
            elif isinstance(data, str):
                # For string data, try to parse as JSON first
                try:
                    import json
                    json_data = json.loads(data)
                    if isinstance(json_data, dict):
                        event['request']['data'] = json.dumps(redact_dict(json_data))
                except (json.JSONDecodeError, ValueError):
                    # If we can't parse as JSON, redact the entire string if it might contain sensitive data
                    for pattern in sensitive_patterns:
                        if pattern.search(data):
                            event['request']['data'] = "[REDACTED]"
                            break
        
        # Redact cookies
        if 'cookies' in event['request']:
            event['request']['cookies'] = "[REDACTED]"
        
        # Redact headers that might contain sensitive info
        if 'headers' in event['request']:
            headers = event['request']['headers']
            sensitive_headers = ['authorization', 'cookie', 'set-cookie', 'x-auth-token']
            for header in sensitive_headers:
                if header in headers:
                    headers[header] = "[REDACTED]"
    
    # Add trace ID from request context
    if has_request_context() and hasattr(request, 'trace_id'):
        if 'tags' not in event:
            event['tags'] = {}
        event['tags']['trace_id'] = request.trace_id
        event['tags']['endpoint'] = request.endpoint
    
    # If in dev environment, log what we're sending to Sentry
    if has_request_context() and current_app.config.get('ENV') != 'production':
        current_app.logger.debug(f"Sending event to Sentry: {event.get('event_id')}")
    
    return event
