import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask core settings
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    SECRET_KEY = os.getenv("SECRET_KEY", "changeme")

    # JWT settings
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "changeme")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Stripe
    STRIPE_PUBLIC_KEY = os.getenv("STRIPE_PUBLIC_KEY")
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
    STRIPE_REFRESH_URL = os.getenv("STRIPE_REFRESH_URL", "http://localhost:3000/stripe/refresh")
    STRIPE_RETURN_URL = os.getenv("STRIPE_RETURN_URL", "http://localhost:3000/dashboard")
    STRIPE_SUCCESS_URL = os.getenv("STRIPE_SUCCESS_URL", "http://localhost:3000/success")
    STRIPE_CANCEL_URL = os.getenv("STRIPE_CANCEL_URL", "http://localhost:3000/cancel")

    # Mail
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", MAIL_USERNAME)

    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

    # SocketIO
    SOCKETIO_MESSAGE_QUEUE = os.getenv("SOCKETIO_MESSAGE_QUEUE")

    # Other settings as needed...
