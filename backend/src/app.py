# backend/src/app.py

from flask import Flask, jsonify
from flask_cors import CORS
from flask_talisman import Talisman
from werkzeug.exceptions import HTTPException
import os
import logging

# Fix relative imports
from .extensions import db, jwt, migrate, mail, socketio
from .config import Config

# Blueprint imports
from .routes import auth_routes
from .routes import onboard_routes
from .routes import maintenance_routes
from .routes import payment_routes
from .routes import property_routes
from .routes import tenant_routes
from .routes import stripe_routes
from .routes import logs_routes
from .routes import admin_routes
from .routes import notification_routes
from .routes import messaging_routes
from .routes import invite_routes
from .routes import verify_email_routes
from .routes import status_routes  # New status routes
from .routes import docs_routes    # New docs routes

# Import webhooks initialization
from .webhooks import init_webhooks

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Configure logging
    if not app.debug:
        logging.basicConfig(
            level=getattr(logging, app.config.get('LOG_LEVEL', 'INFO')),
            format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]',
            handlers=[
                logging.StreamHandler(),
                logging.FileHandler(os.path.join('logs', 'app.log'))
            ]
        )

    # HTTPS and security config
    if app.config.get("FLASK_ENV") == "production":
        Talisman(app)
        CORS(app, origins=app.config.get("CORS_ORIGINS", ["https://yourdomain.com"]), supports_credentials=True)
    else:
        Talisman(app, content_security_policy=None, force_https=False)
        CORS(app, supports_credentials=True)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)
    socketio.init_app(app)

    # Register all blueprints
    app.register_blueprint(auth_routes.bp)
    app.register_blueprint(onboard_routes.bp)
    app.register_blueprint(maintenance_routes.bp)
    app.register_blueprint(payment_routes.bp)
    app.register_blueprint(property_routes.bp)
    app.register_blueprint(tenant_routes.bp)
    app.register_blueprint(stripe_routes.bp)
    app.register_blueprint(logs_routes.bp)
    app.register_blueprint(admin_routes.admin_bp)
    app.register_blueprint(notification_routes.notifications_bp)
    app.register_blueprint(messaging_routes.messages_bp)
    app.register_blueprint(invite_routes.invite_bp)
    app.register_blueprint(verify_email_routes.verify_bp)
    app.register_blueprint(status_routes.bp)  # Register status routes
    app.register_blueprint(docs_routes.bp)    # Register docs routes
    
    # Initialize webhooks
    init_webhooks(app)

    # Create upload directory if it doesn't exist
    os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)

    # Error handling
    @app.errorhandler(HTTPException)
    def handle_http_error(e):
        response = jsonify({"error": e.description, "code": e.code})
        response.status_code = e.code
        return response

    @app.errorhandler(Exception)
    def handle_generic_error(e):
        app.logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
        response = jsonify({"error": "Internal server error", "code": 500})
        response.status_code = 500
        return response

    # Create database tables if in development and tables don't exist
    if app.config.get("FLASK_ENV") == "development":
        with app.app_context():
            db.create_all()

    return app

app = create_app()

if __name__ == "__main__":
    socketio.run(app, debug=Config.DEBUG)
