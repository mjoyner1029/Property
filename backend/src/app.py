"""
The application factory for the Asset Anchor API.
Creates and configures Flask app with blueprints and extensions.
"""
from __future__ import annotations

import os
import logging
from typing import Optional

from flask import Flask, jsonify, request
import sentry_sdk
from werkzeug.exceptions import HTTPException

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
    """
    app = Flask(__name__)

    # Load configuration
    config_obj = get_config(config_name)
    app.config.from_object(config_obj)
    
    # Initialize extensions with the app
    init_extensions(app)

    # Register error handlers
    register_error_handlers(app)
    
    # Register health check endpoint
    register_health_check(app)
    
    # Configure Sentry if DSN is provided
    configure_sentry(app)
    
    # Register blueprints
    register_blueprints(app)

    return app


def register_blueprints(app: Flask) -> None:
    """Register all Flask blueprints."""
    # Feature flags for risk remediation - enable only completed modules
    ENABLE_AUTH = True
    ENABLE_API = True
    ENABLE_WEBHOOKS = True
    ENABLE_PAYMENTS = True
    
    # Import and register core blueprints
    if ENABLE_AUTH:
        try:
            from .routes.auth_routes import bp as auth_bp
            app.register_blueprint(auth_bp, url_prefix='/auth')
            app.logger.info("Registered auth_bp blueprint")
        except Exception as e:
            app.logger.warning(f"Failed to register auth_bp: {str(e)}")
    
    if ENABLE_API:
        try:
            from .routes.api_routes import api_bp
            app.register_blueprint(api_bp, url_prefix='/api')
            app.logger.info("Registered api_bp blueprint")
        except Exception as e:
            app.logger.warning(f"Failed to register api_bp: {str(e)}")
    
    if ENABLE_WEBHOOKS:
        try:
            from .routes.webhook_routes import webhook_bp
            app.register_blueprint(webhook_bp, url_prefix='/webhooks')
            app.logger.info("Registered webhook_bp blueprint")
        except Exception as e:
            app.logger.warning(f"Failed to register webhook_bp: {str(e)}")
    
    # Register health blueprint - always enabled
    from .routes.health_routes import health_bp
    app.register_blueprint(health_bp, url_prefix='/health')
    app.logger.info("Registered health_bp blueprint")


def register_error_handlers(app: Flask) -> None:
    """Register error handlers for various error types."""
    
    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        """Handle HTTPExceptions."""
        response = jsonify({
            'error': error.name,
            'message': error.description,
            'status_code': error.code
        })
        response.status_code = error.code
        return response

    @app.errorhandler(Exception)
    def handle_generic_exception(error):
        """Handle generic exceptions."""
        app.logger.exception("Unhandled exception: %s", str(error))
        response = jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred',
            'status_code': 500
        })
        response.status_code = 500
        return response


def register_health_check(app: Flask) -> None:
    """Register a health check endpoint."""
    
    @app.route('/health')
    def health():
        git_sha = os.environ.get('GIT_SHA', 'unknown')
        return jsonify({
            'status': 'healthy',
            'version': app.config.get('VERSION', '1.0.0'),
            'git_sha': git_sha
        })


def configure_sentry(app: Flask) -> None:
    """Configure Sentry if DSN is available in environment."""
    sentry_dsn = app.config.get('SENTRY_DSN') or os.environ.get('SENTRY_DSN')
    
    if sentry_dsn:
        environment = app.config.get('ENV', 'development')
        git_sha = os.environ.get('GIT_SHA', 'unknown')
        
        sentry_sdk.init(
            dsn=sentry_dsn,
            environment=environment,
            release=git_sha,
            traces_sample_rate=0.1,
            # Don't include sensitive data in reports
            send_default_pii=False
        )
