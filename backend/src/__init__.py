from flask import Flask
from flask_cors import CORS
from flask_talisman import Talisman

# Import extensions
from .extensions import db, migrate, jwt, socketio, mail

# This file should be minimal and not try to import all routes
# We'll move route registration to the app.py file

__version__ = '1.0.0'

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

    return app
