# backend/src/app.py

from flask import Flask, jsonify
from flask_cors import CORS
from flask_talisman import Talisman
from werkzeug.exceptions import HTTPException
from datetime import timedelta

from .extensions import db, jwt, migrate
from .config import Config

# Blueprint imports
from .routes import auth
from .routes import onboard
from .routes import maintenance
from .routes import payments
from .routes import properties
from .routes import tenants

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Security & CORS
    Talisman(app)
    CORS(app, supports_credentials=True)

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Register blueprints
    app.register_blueprint(auth.bp)
    app.register_blueprint(onboard.bp)  # ⬅️ New onboarding blueprint
    app.register_blueprint(maintenance.bp)
    app.register_blueprint(payments.bp)
    app.register_blueprint(properties.bp)
    app.register_blueprint(tenants.bp)

    # Error handlers
    @app.errorhandler(HTTPException)
    def handle_http_error(e):
        return jsonify({"error": e.description}), e.code

    @app.errorhandler(Exception)
    def handle_generic_error(e):
        return jsonify({"error": str(e)}), 500

    return app

# Entrypoint
app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
