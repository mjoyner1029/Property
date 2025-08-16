"""
Monitoring utilities for the application.
"""
import logging
import time
import json
from flask import request, g, current_app
from functools import wraps

logger = logging.getLogger(__name__)

def init_monitoring(app):
    """Initialize monitoring for the Flask app."""
    
    # Initialize Sentry for error tracking (production only)
    if not app.debug and not app.testing:
        sentry_dsn = app.config.get('SENTRY_DSN')
        if sentry_dsn:
            try:
                import sentry_sdk
                from sentry_sdk.integrations.flask import FlaskIntegration
                from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
                
                sentry_sdk.init(
                    dsn=sentry_dsn,
                    integrations=[
                        FlaskIntegration(),
                        SqlalchemyIntegration(),
                    ],
                    environment=app.config.get('APP_ENV', 'production'),
                    traces_sample_rate=0.25,  # Adjust sampling rate as needed
                    send_default_pii=False,  # Don't send PII by default
                )
                
                # Set up Sentry context processor
                @app.before_request
                def sentry_context():
                    from sentry_sdk import set_tag, set_user, set_context
                    
                    # Add request_id as a tag for traceability
                    request_id = request.headers.get('X-Request-ID', '')
                    if request_id:
                        set_tag("request_id", request_id)
                    
                    # Add user info if available
                    if hasattr(g, 'current_user') and g.current_user:
                        set_user({
                            "id": g.current_user.id,
                            "role": getattr(g.current_user, 'role', None),
                            # Don't include PII like email, name
                        })
                        
                        # Add additional context if needed
                        if hasattr(g.current_user, 'tenant_id') and g.current_user.tenant_id:
                            set_tag("tenant_id", g.current_user.tenant_id)
                    
                    # Add relevant request context
                    set_context("request", {
                        "url": request.url,
                        "method": request.method,
                        "referrer": request.referrer,
                    })
                
                app.logger.info("Sentry initialized for error monitoring")
            except ImportError:
                app.logger.warning("Sentry SDK not installed, error monitoring disabled")
            except Exception as e:
                app.logger.error(f"Failed to initialize Sentry: {e}")
    
    # Request tracking middleware
    @app.before_request
    def before_request():
        g.start_time = time.time()
        g.request_id = request.headers.get('X-Request-ID', '') or f"req-{time.time():.0f}"
    
    @app.after_request
    def after_request(response):
        if hasattr(g, 'start_time'):
            elapsed_time = time.time() - g.start_time
            
            # Log request details
            log_data = {
                'request_id': getattr(g, 'request_id', ''),
                'method': request.method,
                'path': request.path,
                'status': response.status_code,
                'duration_ms': round(elapsed_time * 1000, 2),
                'user_agent': request.user_agent.string,
                'ip': request.remote_addr
            }
            
            # Add user_id if authenticated (but not PII)
            if hasattr(g, 'current_user') and g.current_user:
                log_data['user_id'] = g.current_user.id
                if hasattr(g.current_user, 'role'):
                    log_data['user_role'] = g.current_user.role
                
            # Log different levels based on status code
            if response.status_code >= 500:
                logger.error(f"Request failed: {json.dumps(log_data)}")
            elif response.status_code >= 400:
                logger.warning(f"Request warning: {json.dumps(log_data)}")
            else:
                if app.config.get('DEBUG') or elapsed_time > 1.0:  # Log slow requests
                    logger.info(f"Request completed: {json.dumps(log_data)}")
            
            # Add performance timing header
            response.headers['X-Response-Time'] = f"{elapsed_time:.3f}s"
        
        return response
    
    # Add custom logger handlers if needed
    if not app.debug and not app.testing:
        # Configure more robust logging for production
        handler = logging.StreamHandler()
        handler.setLevel(logging.INFO)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        app.logger.addHandler(handler)
        app.logger.setLevel(logging.INFO)


def log_execution_time(func):
    """Decorator to log function execution time."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        elapsed_time = time.time() - start_time
        
        # Log slow functions (>100ms)
        if elapsed_time > 0.1:
            logger.info(f"SLOW EXECUTION: {func.__name__} took {elapsed_time:.3f}s")
        return result
    return wrapper
