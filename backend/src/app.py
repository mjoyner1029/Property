from flask import Flask, jsonify
from flask_cors import CORS
from .extensions import db, jwt
from .config import Config
from .routes import auth, maintenance, payments, properties, tenants
from werkzeug.exceptions import HTTPException
from flask_talisman import Talisman
from datetime import timedelta

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, supports_credentials=True)
    Talisman(app)

    db.init_app(app)
    jwt.init_app(app)

    app.register_blueprint(auth.bp)
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
