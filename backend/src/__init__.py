### backend/src/__init__.py

from flask import Flask
from flask_cors import CORS
from .extensions import db, migrate
from .routes.auth import auth_bp
# import other blueprints as needed

def create_app():
    app = Flask(__name__)

    app.config.from_object("config.Config")

    CORS(app)  # Enable CORS

    db.init_app(app)
    migrate.init_app(app, db)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    # Register other blueprints here

    return app
