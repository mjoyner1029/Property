from flask import Flask
from flask_cors import CORS
from flask_talisman import Talisman

from .extensions import db, migrate, jwt, socketio, mail
from .routes.auth_routes import bp as auth_bp
from .routes.admin_routes import admin_bp
from .routes.notification_routes import notifications_bp
from .routes.messaging_routes import messages_bp
from .routes.invite_routes import invite_bp
from .routes.verify_email_routes import verify_bp
from .routes.maintenance_routes import bp as maintenance_bp
from .routes.payment_routes import bp as payments_bp
from .routes.property_routes import bp as properties_bp
from .routes.tenant_routes import bp as tenants_bp
from .routes.logs_routes import bp as logs_bp
from .webhooks import init_webhooks

def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")

    # Security and CORS
    CORS(app, supports_credentials=True, origins=["https://your-frontend.com"])
    Talisman(app, content_security_policy=None)

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    socketio.init_app(app)
    mail.init_app(app)

    # Routes
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(messages_bp)
    app.register_blueprint(invite_bp)
    app.register_blueprint(verify_bp)
    app.register_blueprint(maintenance_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(properties_bp)
    app.register_blueprint(tenants_bp)
    app.register_blueprint(logs_bp)

    # Initialize the new webhooks system
    init_webhooks(app)

    return app
