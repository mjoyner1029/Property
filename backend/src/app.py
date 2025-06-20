from flask import Flask, jsonify
from flask_cors import CORS
from flask_talisman import Talisman
from werkzeug.exceptions import HTTPException
from datetime import timedelta

from src.extensions import db, jwt, migrate
from src.config import Config

# Blueprint imports (absolute)
from src.routes import auth
from src.routes import onboard
from src.routes import maintenance
from src.routes import payments
from src.routes import properties
from src.routes import tenants

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Disable CSP and HTTPS enforcement for local development
    Talisman(app, content_security_policy=None, force_https=False)
    CORS(app, supports_credentials=True)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    app.register_blueprint(auth.bp)
    app.register_blueprint(onboard.bp)
    app.register_blueprint(maintenance.bp)
    app.register_blueprint(payments.bp)
    app.register_blueprint(properties.bp)
    app.register_blueprint(tenants.bp)

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
