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

# Define environment variables
APP_ENV = os.getenv("APP_ENV", os.getenv("FLASK_ENV", "development")).lower()

# Initialize Sentry only in production if DSN is provided
sentry_dsn = os.getenv('SENTRY_DSN')
if sentry_dsn and APP_ENV == "production":
    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[FlaskIntegration()],
        traces_sample_rate=0.2,
        send_default_pii=False,
        environment=APP_ENV,
    )

# Database ORM
db = SQLAlchemy()

# JWT Authentication
jwt = JWTManager()

# Cross-Origin Resource Sharing
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
cors = CORS(
    resources={
        r"/api/*": {
            "origins": CORS_ORIGINS,
            "supports_credentials": True,
            "expose_headers": ["Content-Disposition", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
            "max_age": 600  # Cache preflight requests for 10 minutes
        }
    }
)

# Database migrations
migrate = Migrate()

# Real-time communication
socketio = SocketIO(
    cors_allowed_origins=os.getenv('CORS_ORIGINS', '*').split(',') 
    if os.getenv('FLASK_ENV') == 'production' 
    else "*"
)

# Security headers with configurable CSP enforcement
# See docs/SECURITY_CHECKLIST.md for CSP configuration details
CSP_ENFORCE = os.getenv("CSP_ENFORCE", "false").lower() == "true"
csp = {
    'default-src': ["'self'"],
    'script-src': ["'self'", 'https://js.stripe.com', "'nonce-{nonce}'"],
    'style-src': ["'self'", "'unsafe-inline'"],  # Unsafe-inline needed for MUI
    'img-src': ["'self'", 'data:', 'https://s3.amazonaws.com', 'https://*.assetanchor.io', 'https://*.stripe.com'],
    'connect-src': [
        "'self'", 
        'https://api.stripe.com', 
        'https://api.assetanchor.io',
        'https://sentry.io' if os.getenv('SENTRY_DSN') else None
    ],
    'frame-src': ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com', 'https://checkout.stripe.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    'report-uri': ['/api/csp-report'],
    'upgrade-insecure-requests': [] if APP_ENV == 'production' else None
}

talisman = Talisman(
    content_security_policy=csp,
    content_security_policy_report_only=not CSP_ENFORCE,
    force_https=APP_ENV == 'production',
    strict_transport_security=True,
    strict_transport_security_max_age=31536000, # 1 year in seconds
    strict_transport_security_include_subdomains=True,
    strict_transport_security_preload=True,
    frame_options='DENY',
    session_cookie_secure=APP_ENV == 'production',
    session_cookie_http_only=True,
    session_cookie_samesite='Lax',
    feature_policy={
        'geolocation': "'none'",
        'microphone': "'none'",
        'camera': "'none'",
        'payment': "'self'"
    },
    referrer_policy='same-origin'
)

# Rate limiting
REDIS_URL = os.getenv("REDIS_URL")
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per minute", "5000 per hour"],
    storage_uri=REDIS_URL if REDIS_URL else "memory://",
    strategy="fixed-window-elastic-expiry",
    headers_enabled=True,
    fail_callback=lambda _: ({"error": "Rate limit exceeded", "status": 429}, 429)
)

# Email sending
mail = Mail()
