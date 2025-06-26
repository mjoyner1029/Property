from flask import Flask
from flask_cors import CORS
from flask_talisman import Talisman

from .extensions import db, migrate, jwt
from .routes.auth import bp as auth_bp
from .routes.admin import admin_bp
from .routes.notifications import notifications_bp
from .routes.messages import messages_bp
from .routes.invite import invite_bp
from .routes.verify_email import verify_bp
from .socketio import socketio

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

    # Routes
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(messages_bp)
    app.register_blueprint(invite_bp)
    app.register_blueprint(verify_bp)

    return app
