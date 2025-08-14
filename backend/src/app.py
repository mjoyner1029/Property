# backend/src/app.py

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_talisman import Talisman
from .extensions import db, jwt, migrate, mail, socketio, talisman, cors, limiter
import os
import logging
import json
import platform
from datetime import datetime
import subprocess

def create_app(config_name='default'):
    app = Flask(__name__)
    
    # Load config
    from .config import config_by_name
    app.config.from_object(config_by_name[config_name])
    
    # Set up logging
    log_level = app.config.get('LOG_LEVEL', logging.INFO)
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Ensure upload directory exists
    os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    socketio.init_app(app)
    
    # Initialize security extensions
    cors.init_app(app)
    talisman.init_app(app, content_security_policy_nonce_in=['script-src'])
    limiter.init_app(app)
    
    # Set up rate limits for specific endpoints
    # Auth endpoints with stricter limits
    limiter.limit("10/minute;100/hour")(app.route('/api/auth/login', methods=['POST']))
    limiter.limit("5/minute;20/hour")(app.route('/api/auth/register', methods=['POST']))
    limiter.limit("3/minute;10/hour")(app.route('/api/auth/reset-password', methods=['POST']))
    limiter.limit("3/minute;10/hour")(app.route('/api/auth/forgot-password', methods=['POST']))
    
    # API endpoints that don't need rate limiting (webhooks need to accept all valid requests)
    limiter.exempt(app.route('/api/webhooks/stripe', methods=['POST']))
    limiter.exempt(app.route('/api/health', methods=['GET']))
    limiter.exempt(app.route('/api/status', methods=['GET']))
    
    # User management endpoints
    limiter.limit("20/minute")(app.route('/api/users/create', methods=['POST']))
    limiter.limit("30/minute")(app.route('/api/users/update', methods=['PUT']))
    
    # Payment and subscription endpoints
    limiter.limit("10/minute")(app.route('/api/payments/checkout', methods=['POST']))
    limiter.limit("20/minute")(app.route('/api/subscriptions', methods=['POST', 'PUT']))
    
    # Document upload endpoints
    limiter.limit("10/minute;50/hour")(app.route('/api/documents/upload', methods=['POST']))
    
    # Register blueprints one by one to avoid circular imports
    with app.app_context():
        # Auth routes
        from .routes.auth_routes import bp as auth_bp
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        
        # Test routes
        from .controllers.test.test_auth import test_auth_bp
        app.register_blueprint(test_auth_bp, url_prefix='/api/auth', name='test_auth_routes')
        
        # Test auth route (simplified for debugging)
        from .controllers.test.test_auth import test_auth_bp
        app.register_blueprint(test_auth_bp, url_prefix='/api/auth')
        
        # Admin routes
        from .routes.admin_routes import admin_bp
        app.register_blueprint(admin_bp, url_prefix='/api/admin')
        
        # Try to register other blueprints
        try:
            from .routes.notification_routes import notification_bp
            app.register_blueprint(notification_bp, url_prefix='/api/notifications')
            
            from .routes.property_routes import property_bp
            app.register_blueprint(property_bp, url_prefix='/api/properties')
            
            from .routes.tenant_routes import tenant_bp
            app.register_blueprint(tenant_bp, url_prefix='/api/tenants')
            
            from .routes.maintenance_routes import bp as maintenance_bp
            app.register_blueprint(maintenance_bp, url_prefix='/api/maintenance')
            
            # Add other blueprints as needed...
        except ImportError as e:
            app.logger.error(f"Failed to import a blueprint: {e}")
    
    # Health check endpoints are defined in status_routes.py
        
    # CSP Report endpoint
    @app.route('/api/csp-report', methods=['POST'])
    def csp_report():
        try:
            data = request.get_data(as_text=True)
            app.logger.warning(f"CSP violation: {data}")
            return jsonify({"status": "received"}), 204
        except Exception as e:
            app.logger.error(f"Error processing CSP report: {e}")
            return jsonify({"status": "error"}), 500
    
    # Register error handlers
    from .utils.error_handler import register_error_handlers
    register_error_handlers(app)
    
    # Initialize monitoring
    from .utils.monitoring import init_monitoring
    init_monitoring(app)
    
    # Initialize metrics for Prometheus
    if app.config.get('ENV') == 'production':
        try:
            from .routes.metrics_routes import init_metrics
            init_metrics(app)
        except ImportError:
            app.logger.warning("Metrics module not available, skipping metrics initialization")
    
    return app

# Remove this line to prevent app initialization at import time
# app = create_app()
