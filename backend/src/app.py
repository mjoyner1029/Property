# backend/src/app.py

import logging
import os
import time
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_talisman import Talisman
from .extensions import db, jwt, migrate, mail, socketio
from .utils.monitoring import setup_request_logging

# Configure logging
def setup_logging(app):
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    log_level = logging.DEBUG if app.debug else logging.INFO
    log_format = '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    
    # File handler for all logs
    file_handler = logging.FileHandler(os.path.join(log_dir, 'asset_anchor.log'))
    file_handler.setFormatter(logging.Formatter(log_format))
    
    # Error file handler for errors only
    error_file_handler = logging.FileHandler(os.path.join(log_dir, 'errors.log'))
    error_file_handler.setLevel(logging.ERROR)
    error_file_handler.setFormatter(logging.Formatter(log_format))
    
    # Root logger configuration
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(error_file_handler)
    
    # Application logger
    app_logger = logging.getLogger('asset_anchor')
    app_logger.setLevel(log_level)
    
    return app_logger

def create_app(config_name='default'):
    # Record start time for uptime calculation
    start_time = time.time()
    
    app = Flask(__name__)
    
    # Store start time on app
    app.start_time = start_time
    
    # Load config
    from config import config_by_name
    app.config.from_object(config_by_name[config_name])
    
    # Setup logging
    logger = setup_logging(app)
    logger.info(f"Starting Asset Anchor backend with config: {config_name}")
    
    # Ensure upload directory exists
    os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    socketio.init_app(app)
    
    # Enable CORS
    CORS(app, supports_credentials=True)
    
    # Set up request logging and monitoring
    setup_request_logging(app)
    
    # Register blueprints one by one to avoid circular imports
    with app.app_context():
        # Auth routes
        from .routes.auth_routes import bp as auth_bp
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        
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
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy"}), 200
    
    return app

# Remove this line to prevent app initialization at import time
# app = create_app()
