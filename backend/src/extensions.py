# backend/src/extensions.py

import os
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_mail import Mail
from flask_cors import CORS
from flask_talisman import Talisman
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

APP_ENV = os.getenv("APP_ENV", os.getenv("FLASK_ENV", "development")).lower()

# ---- Sentry (enabled in prod if DSN set) ----
SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN and APP_ENV == "production":
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[FlaskIntegration()],
        traces_sample_rate=0.2,
        send_default_pii=False,
        environment=APP_ENV,
    )

# ---- Core extensions ----
db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()
mail = Mail()

# ---- Socket.IO ----
socketio = SocketIO(
    cors_allowed_origins=os.getenv('CORS_ORIGINS', '*').split(',') if APP_ENV == 'production' else "*"
)

# ---- CORS (configured at init_app in app.py) ----
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
cors = CORS(resources={
    r"/api/*": {
        "origins": CORS_ORIGINS,
        "supports_credentials": True,
        "expose_headers": [
            "Content-Disposition",
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset",
        ],
        "max_age": 600,
    }
})

# ---- Security headers / CSP ----
connect_src = [
    "'self'",
    'https://api.stripe.com',
    os.getenv('API_BASE_URL', 'https://api.assetanchor.io'),
    os.getenv('WS_BASE_URL', 'wss://api.assetanchor.io'),
    'https://www.google-analytics.com',
]
if SENTRY_DSN:
    connect_src.append('https://sentry.io')

csp = {
    'default-src': ["'self'"],
    'script-src': [
        "'self'",
        'https://js.stripe.com',
        'https://cdn.jsdelivr.net',
        'https://www.google-analytics.com',
        "'nonce-{nonce}'",
    ],
    'style-src': [
        "'self'",
        "'unsafe-inline'",  # Needed by many UI libs; prefer hashing where possible
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net',
    ],
    'img-src': [
        "'self'",
        'data:',
        'https://s3.amazonaws.com',
        'https://cdn.jsdelivr.net',
        'https://*.assetanchor.io',
        'https://*.stripe.com',
        'https://www.google-analytics.com',
        'https://stats.g.doubleclick.net',
    ],
    'connect-src': connect_src,
    'frame-src': [
        "'self'",
        'https://js.stripe.com',
        'https://hooks.stripe.com',
        'https://checkout.stripe.com',
    ],
    'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdn.jsdelivr.net',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    'report-uri': ['/api/csp-report'],
}
# Upgrade insecure requests only in prod
if APP_ENV == 'production':
    csp['upgrade-insecure-requests'] = []

talisman = Talisman(
    content_security_policy=csp,
    content_security_policy_report_only=(os.getenv("CSP_ENFORCE", "true").lower() != "true"),
    force_https=(APP_ENV == 'production'),
    strict_transport_security=True,
    strict_transport_security_max_age=31536000,
    strict_transport_security_include_subdomains=True,
    strict_transport_security_preload=True,
    frame_options='DENY',
    session_cookie_secure=(APP_ENV == 'production'),
    session_cookie_http_only=True,
    session_cookie_samesite='Lax',
    # Permissions-Policy (formerly Feature-Policy) is set via headers by Talisman internally when available.
    referrer_policy='same-origin',
)

# ---- Rate Limiting ----
REDIS_URL = os.getenv("REDIS_URL")
DISABLE_RATE_LIMIT = os.getenv("DISABLE_RATE_LIMIT", "false").lower() == "true"

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per minute", "5000 per hour"],
    storage_uri=os.getenv("RATELIMIT_STORAGE_URI") or (REDIS_URL if REDIS_URL else "memory://"),
    strategy="fixed-window",
    headers_enabled=True,
)
if DISABLE_RATE_LIMIT:
    limiter.enabled = False
