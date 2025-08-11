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
cors = CORS(resources={r"/api/*": {"origins": os.getenv('CORS_ORIGINS', '*').split(',')}})

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
    'script-src': ["'self'", 'https://js.stripe.com'],
    'style-src': ["'self'", "'unsafe-inline'"],  # Unsafe-inline needed for MUI
    'img-src': ["'self'", 'data:', 'https://s3.amazonaws.com'],
    'connect-src': ["'self'", 'https://api.stripe.com', 'https://api.assetanchor.io'],
    'frame-src': ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'report-uri': ['/api/csp-report']
}

talisman = Talisman(
    content_security_policy=csp,
    content_security_policy_report_only=not CSP_ENFORCE,
    force_https=APP_ENV == 'production',
    strict_transport_security=True,
    strict_transport_security_max_age=31536000,
    strict_transport_security_include_subdomains=True,
    frame_options='DENY',
    session_cookie_secure=APP_ENV == 'production',
    session_cookie_http_only=True
)

# Rate limiting
REDIS_URL = os.getenv("REDIS_URL")
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["300 per minute"],
    storage_uri=REDIS_URL if REDIS_URL else "memory://",
)

# Email sending
mail = Mail()
