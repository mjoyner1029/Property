# backend/src/app.py

from flask import Flask, jsonify
from flask_cors import CORS
from flask_talisman import Talisman
from werkzeug.exceptions import HTTPException

from src.extensions import db, jwt, migrate
from src.config import Config

# Blueprint imports
from src.routes import auth
from src.routes import onboard
from src.routes import maintenance
from src.routes import payments
from src.routes import properties
from src.routes import tenants
from src.routes import stripe
from src.routes import logs  # NEW: for frontend error logging

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # HTTPS and security config
    if app.config["FLASK_ENV"] == "production":
        Talisman(app)
        CORS(app, origins=["https://yourdomain.com"], supports_credentials=True)
    else:
        Talisman(app, content_security_policy=None, force_https=False)
        CORS(app, supports_credentials=True)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Register all blueprints
    app.register_blueprint(auth.bp)
    app.register_blueprint(onboard.bp)
    app.register_blueprint(maintenance.bp)
    app.register_blueprint(payments.bp)
    app.register_blueprint(properties.bp)
    app.register_blueprint(tenants.bp)
    app.register_blueprint(stripe.bp)
    app.register_blueprint(logs.bp)  # NEW

    # Error handling
    @app.errorhandler(HTTPException)
    def handle_http_error(e):
        return jsonify({"error": e.description}), e.code

    @app.errorhandler(Exception)
    def handle_generic_error(e):
        return jsonify({"error": str(e)}), 500

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
