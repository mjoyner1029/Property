from flask import Flask
from flask_cors import CORS
from .extensions import db, migrate, jwt
from .routes.auth import bp as auth_bp
from .routes.admin import admin_bp
from .routes.notifications import notifications_bp
from .routes.messages import messages_bp
from .socketio import socketio

def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")

    CORS(app)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(messages_bp)

    socketio.init_app(app)

    return app
