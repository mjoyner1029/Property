# backend/src/app.py
from __future__ import annotations

import logging
import os
from importlib import import_module

from flask import Flask, jsonify, request
from werkzeug.middleware.proxy_fix import ProxyFix

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


def _load_config(app: Flask, config_name: str) -> None:
    """
    Load config from .config.config_by_name with a safe fallback.
    """
    try:
        try:
            from .config import config_by_name  # type: ignore
        except ImportError:
            from config import config_by_name  # type: ignore

        if config_name not in config_by_name:
            app.logger.warning(
                "Unknown config '%s'; falling back to 'default'", config_name
            )
            config_name = "default"
        app.config.from_object(config_by_name[config_name])
    except Exception as exc:
        # Absolute last resort sane defaults
        app.logger.error("Failed to load config: %s", exc)
        app.config.update(
            SECRET_KEY=os.environ.get("SECRET_KEY", "change-me"),
            SQLALCHEMY_DATABASE_URI=os.environ.get("DATABASE_URL", "sqlite:///app.db"),
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            ENV=os.environ.get("FLASK_ENV", "production"),
            DEBUG=os.environ.get("FLASK_DEBUG", "0") == "1",
            UPLOAD_FOLDER=os.environ.get("UPLOAD_FOLDER", "uploads"),
            CORS_ALLOW_ORIGINS=os.environ.get("CORS_ALLOW_ORIGINS", "").strip(),
            LOG_LEVEL=os.environ.get("LOG_LEVEL", "INFO"),
        )


def _init_logging(app: Flask) -> None:
    level_name = str(app.config.get("LOG_LEVEL", "INFO")).upper()
    level = getattr(logging, level_name, logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    app.logger.setLevel(level)


def _init_security_and_middlewares(app: Flask) -> None:
    # Ensure upload directory exists
    os.makedirs(app.config.get("UPLOAD_FOLDER", "uploads"), exist_ok=True)

    # Respect X-Forwarded-* headers behind proxies (Render/NGINX/etc.)
    # Include x_port to preserve correct URL generation
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

    # ---- Security Headers (Talisman) ----
    # Strong defaults; loosen via config if you embed external scripts.
    csp = app.config.get(
        "CONTENT_SECURITY_POLICY",
        {
            "default-src": "'self'",
            "base-uri": "'self'",
            "form-action": "'self'",
            "img-src": "'self' data:",
            "connect-src": "'self'",
            "script-src": ["'self'"],
            "style-src": ["'self'", "'unsafe-inline'"],
            "frame-ancestors": "'none'",
            "object-src": "'none'",
        },
    )
    talisman.init_app(
        app,
        content_security_policy=csp,
        content_security_policy_nonce_in=["script-src"],
        force_https=app.config.get("ENV") == "production",
        strict_transport_security=True,
        session_cookie_secure=app.config.get("ENV") == "production",
        frame_options="DENY",
        referrer_policy="no-referrer",
    )

    # ---- CORS ----
    # Accept comma-separated list or wildcard. Prefer explicit allowlist in prod.
    raw = app.config.get("CORS_ALLOW_ORIGINS", "").strip()
    if raw:
        origins = [o.strip() for o in raw.split(",") if o.strip()]
    else:
        # Default to frontend URL env if present, else no CORS (not '*')
        fe = os.environ.get("FRONTEND_URL", "").strip()
        origins = [fe] if fe else []
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": origins or []}},
        supports_credentials=True,
        expose_headers=[
            "Content-Type",
            "Authorization",
            "Content-Disposition",      # <-- expose filenames on downloads
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset",
        ],
        max_age=86400,
    )

    # ---- Rate Limiter ----
    limiter_enabled = app.config.get("RATELIMIT_ENABLED", True)
    limiter.enabled = bool(limiter_enabled)
    limiter.init_app(app)


def _init_extensions(app: Flask) -> None:
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)

    # Socket.IO
    allowed = app.config.get("CORS_ALLOW_ORIGINS", "*")
    sio_origins = (
        [o.strip() for o in allowed.split(",") if o.strip()] if allowed else ["*"]
    )
    socketio.init_app(
        app,
        cors_allowed_origins=sio_origins or "*",
        async_mode=app.config.get("SOCKETIO_ASYNC_MODE", None),
        logger=False,
        engineio_logger=False,
    )


def _register_blueprint(app: Flask, module_path: str, attr: str, prefix: str | None) -> None:
    try:
        module = import_module(module_path)
        bp = getattr(module, attr)
        if prefix:
            app.register_blueprint(bp, url_prefix=prefix)
        else:
            app.register_blueprint(bp)
        app.logger.debug("Registered blueprint: %s.%s -> %s", module_path, attr, prefix or "")
    except Exception as exc:
        app.logger.info("Skipping %s (%s): %s", module_path, attr, exc)


def _register_blueprints(app: Flask) -> None:
    with app.app_context():
        # Auth (+ optional test helpers)
        _register_blueprint(app, ".routes.auth.auth_routes", "bp", "/api/auth")
        _register_blueprint(app, ".controllers.test.test_auth", "test_auth_bp", "/api/auth")

        # Domain controllers / admin
        _register_blueprint(app, ".controllers.landlord_controller", "landlord_bp", "/api/landlords")
        _register_blueprint(app, ".routes.admin_routes", "admin_bp", "/api/admin")

        # Logging / telemetry
        _register_blueprint(app, ".controllers.logs_controller", "logs_bp", "/api")

        # Messaging
        _register_blueprint(app, ".routes.messages_routes", "messaging_bp", "/api/messages")

        # Other domain routes (optional)
        _register_blueprint(app, ".routes.notification_routes", "notification_bp", "/api/notifications")
        _register_blueprint(app, ".routes.property_routes", "property_bp", "/api/properties")
        _register_blueprint(app, ".routes.tenant_routes", "tenant_bp", "/api/tenants")
        _register_blueprint(app, ".routes.maintenance_routes", "bp", "/api/maintenance")

        # Health / status / webhook (blueprints define their own rules)
        _register_blueprint(app, ".routes.status_routes", "bp", None)
        _register_blueprint(app, ".routes.health", "bp", None)
        _register_blueprint(app, ".routes.stripe_webhook", "bp", None)

        # Metrics (prod only)
        if app.config.get("ENV") == "production":
            _register_blueprint(app, ".routes.metrics_routes", "metrics_bp", "/metrics")


def _register_error_handlers(app: Flask) -> None:
    # Centralized app errors
    try:
        from .utils.error_handler import register_error_handlers
        register_error_handlers(app)
    except Exception as exc:
        app.logger.warning("Custom error handlers not loaded: %s", exc)

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({"error": "Rate limit exceeded"}), 429

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500


def _init_monitoring(app: Flask) -> None:
    try:
        from .utils.monitoring import init_monitoring
        init_monitoring(app)
    except Exception as exc:
        app.logger.info("Monitoring not initialized: %s", exc)


def create_app(config_name: str | None = None) -> Flask:
    # Allow env override; default to 'default'
    config_name = config_name or os.environ.get("FLASK_CONFIG", "default")

    app = Flask(__name__)

    _load_config(app, config_name)
    _init_logging(app)
    _init_security_and_middlewares(app)
    _init_extensions(app)
    _register_blueprints(app)
    _register_error_handlers(app)
    _init_monitoring(app)

    # CSP violation reports
    @app.route("/api/csp-report", methods=["POST"])
    def csp_report():
        try:
            data = request.get_data(as_text=True)
            app.logger.warning("CSP violation: %s", data)
            # 204: received, no content
            return jsonify({"status": "received"}), 204
        except Exception as exc:
            app.logger.error("Error processing CSP report: %s", exc)
            return jsonify({"status": "error"}), 500

    return app

# App factory pattern only; do not instantiate at import-time.
