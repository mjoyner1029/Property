# backend/src/app.py

from flask import Flask, jsonify, request
from werkzeug.middleware.proxy_fix import ProxyFix
import os
import logging

from .extensions import (
    db,
    jwt,
    migrate,
    mail,
    socketio,
    talisman,
    cors,
    limiter,
)

def create_app(config_name='default'):
    app = Flask(__name__)

    # Load config
    try:
        from .config import config_by_name
    except ImportError:
        from config import config_by_name
    app.config.from_object(config_by_name[config_name])

    # Logging (gunicorn-friendly)
    log_level = app.config.get('LOG_LEVEL', logging.INFO)
    logging.basicConfig(level=log_level, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
    app.logger.setLevel(log_level)

    # Ensure upload directory exists
    os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)

    # Respect X-Forwarded-* headers behind Render/Reverse proxies
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    # ---- Initialize extensions ----
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    socketio.init_app(
        app,
        cors_allowed_origins=app.config.get('CORS_ALLOW_ORIGINS', '*').split(','),
    )

    # Security headers + CORS + Rate Limiter
    cors.init_app(app)  # options pre-configured in extensions
    talisman.init_app(app, content_security_policy_nonce_in=['script-src'])
    limiter.init_app(app)

    # ---- Register blueprints (once each) ----
    with app.app_context():
        # Auth
        from .routes.auth_routes import bp as auth_bp
        app.register_blueprint(auth_bp, url_prefix='/api/auth')

        # Optional test routes (register once if present)
        try:
            from .controllers.test.test_auth import test_auth_bp
            app.register_blueprint(test_auth_bp, url_prefix='/api/auth')
        except Exception as e:
            app.logger.info(f"Test auth routes not available: {e}")

        # Admin (optional)
        try:
            from .routes.admin_routes import admin_bp
            app.register_blueprint(admin_bp, url_prefix='/api/admin')
        except Exception as e:
            app.logger.info(f"Admin routes not available: {e}")

        # Notifications / Properties / Tenants / Maintenance (optional)
        for mod, name, prefix in [
            ('.routes.notification_routes', 'notification_bp', '/api/notifications'),
            ('.routes.property_routes',     'property_bp',     '/api/properties'),
            ('.routes.tenant_routes',       'tenant_bp',       '/api/tenants'),
            ('.routes.maintenance_routes',  'bp',              '/api/maintenance'),
        ]:
            try:
                module = __import__(mod, fromlist=[name])
                bp = getattr(module, name)
                app.register_blueprint(bp, url_prefix=prefix)
            except Exception as e:
                app.logger.info(f"Skipping {mod}: {e}")

        # Health + Status (optional)
        for mod, name in [
            ('.routes.status_routes', 'bp'),
            ('.routes.health',        'bp'),
            ('.routes.stripe_webhook','bp'),  # Stripe webhook (new)
        ]:
            try:
                module = __import__(mod, fromlist=[name])
                bp = getattr(module, name)
                app.register_blueprint(bp)  # Blueprints define their own rules
            except Exception as e:
                app.logger.info(f"Skipping {mod}: {e}")

    # ---- CSP Report endpoint ----
    @app.route('/api/csp-report', methods=['POST'])
    def csp_report():
        try:
            data = request.get_data(as_text=True)
            app.logger.warning(f"CSP violation: {data}")
            return jsonify({"status": "received"}), 204
        except Exception as e:
            app.logger.error(f"Error processing CSP report: {e}")
            return jsonify({"status": "error"}), 500

    # ---- Error handlers ----
    from .utils.error_handler import register_error_handlers
    register_error_handlers(app)

    @app.errorhandler(429)
    def ratelimit_handler(e):
        # Flask-Limiter will still add rate-limit headers
        return jsonify({"error": "Rate limit exceeded"}), 429

    # ---- Monitoring (optional) ----
    try:
        from .utils.monitoring import init_monitoring
        init_monitoring(app)
    except Exception as e:
        app.logger.info(f"Monitoring not initialized: {e}")

    # ---- Prometheus metrics (optional) ----
    if app.config.get('ENV') == 'production':
        try:
            from .routes.metrics_routes import init_metrics
            init_metrics(app)
        except Exception:
            app.logger.warning("Metrics module not available, skipping metrics")

    return app

# Leave app factory pattern; do not instantiate app at import time
