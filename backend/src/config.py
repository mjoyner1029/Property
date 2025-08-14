import os
import datetime
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """
    Base configuration for the application.
    Environment-specific configurations inherit from this class.
    """
    # Application info
    VERSION = "1.0.0"
    STARTED_AT = datetime.datetime.utcnow().isoformat()
    
    # Flask core settings
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    SECRET_KEY = os.getenv("SECRET_KEY", "changeme")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    TESTING = False

    # JWT settings
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "changeme")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ["access", "refresh"]

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Stripe
    STRIPE_PUBLIC_KEY = os.getenv("STRIPE_PUBLIC_KEY")
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
    STRIPE_REFRESH_URL = os.getenv("STRIPE_REFRESH_URL", "http://localhost:3000/stripe/refresh")
    STRIPE_RETURN_URL = os.getenv("STRIPE_RETURN_URL", "http://localhost:3000/dashboard")
    STRIPE_SUCCESS_URL = os.getenv("STRIPE_SUCCESS_URL", "http://localhost:3000/payment/success")
    STRIPE_CANCEL_URL = os.getenv("STRIPE_CANCEL_URL", "http://localhost:3000/payment/cancel")

    # Mail
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", MAIL_USERNAME)
    MAIL_SUPPRESS_SEND = os.getenv("MAIL_SUPPRESS_SEND", "false").lower() == "true"

    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

    # SocketIO
    SOCKETIO_MESSAGE_QUEUE = os.getenv("SOCKETIO_MESSAGE_QUEUE")
    
    # File uploads
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024))  # 16 MB by default
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx'}
    
    # Frontend URL for building links in emails
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Security settings
    CSP_ENFORCE = os.getenv("CSP_ENFORCE", "false").lower() == "true"
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SECURE = False
    REMEMBER_COOKIE_HTTPONLY = True
    
    # Redis for caching and rate limiting
    REDIS_URL = os.getenv("REDIS_URL")
    RATELIMIT_STORAGE_URL = os.getenv("REDIS_URL", "memory://")
    
    # Sentry for error tracking
    SENTRY_DSN = os.getenv("SENTRY_DSN")
    
    # AWS S3 for file storage
    S3_BUCKET = os.getenv("S3_BUCKET")
    S3_REGION = os.getenv("S3_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
    
    # Email provider
    EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "smtp")
    EMAIL_API_KEY = os.getenv("EMAIL_API_KEY")
    EMAIL_FROM = os.getenv("EMAIL_FROM", "no-reply@assetanchor.io")
    
    # Webhooks
    SYSTEM_WEBHOOK_SECRET = os.getenv("SYSTEM_WEBHOOK_SECRET")
    
    # Twilio (for SMS)
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
    
    # Plaid (for financial connections)
    PLAID_CLIENT_ID = os.getenv("PLAID_CLIENT_ID")
    PLAID_SECRET = os.getenv("PLAID_SECRET")
    PLAID_ENV = os.getenv("PLAID_ENV", "sandbox")
    PLAID_WEBHOOK_SECRET = os.getenv("PLAID_WEBHOOK_SECRET")
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")


class DevelopmentConfig(Config):
    """Development environment specific configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///dev.db")
    

class TestingConfig(Config):
    """Testing environment specific configuration."""
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv("TEST_DATABASE_URL", "sqlite:///test.db")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)
    MAIL_SUPPRESS_SEND = True


class ProductionConfig(Config):
    """Production environment specific configuration."""
    # Ensure debug is off in production
    DEBUG = False
    
    # Security settings
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    JWT_COOKIE_SECURE = True
    
    # Default to stricter CORS in production
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "https://assetanchor.io,https://www.assetanchor.io").split(",")
    
    # Rate limiting with Redis
    RATELIMIT_STORAGE_URL = os.getenv("REDIS_URL", "memory://")
    
    # JWT settings for production
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)  # 30 minutes
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)    # 30 days
    
    # Email provider defaults to Postmark in production
    EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "postmark")
    

# Create a dictionary mapping environment names to config classes
config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig
}

# Function to get the config based on environment name
def get_config(config_name=None):
    """Returns the appropriate configuration object based on the environment name."""
    if not config_name:
        config_name = os.getenv("FLASK_ENV", "development")
    return config_by_name.get(config_name, config_by_name["default"])
