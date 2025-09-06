# wsgi.py
"""
WSGI entry point for the Asset Anchor application.
Use with gunicorn:
  gunicorn wsgi:app --workers 2 --threads 4 --worker-class gthread --timeout 120
"""

from __future__ import annotations

import os
import sys
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Ensure project root (this file's dir) is on sys.path so `src` imports work
ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Choose config: prefer FLASK_CONFIG, else APP_ENV / FLASK_ENV, else 'default'
def _pick_config_name() -> str:
    cfg = os.getenv("FLASK_CONFIG")
    if cfg:
        return cfg
    app_env = os.getenv("APP_ENV", os.getenv("FLASK_ENV", "development")).strip().lower()
    # Map common aliases -> our config keys
    aliases = {
        "dev": "development",
        "development": "development",
        "test": "testing",
        "testing": "testing",
        "prod": "production",
        "production": "production",
        "default": "default",
    }
    return aliases.get(app_env, "default")

CONFIG_NAME = _pick_config_name()

# Import app factory (re-exported by src/__init__.py)
from src import create_app  # noqa: E402

# Create the Flask application (app factory reads config/env safely)
app = create_app(CONFIG_NAME)

# Production-specific verifications (fail fast if critical env is missing)
if CONFIG_NAME == "production":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    logging.info("Starting Asset Anchor in production mode with config '%s'", CONFIG_NAME)

    required_vars = ["SECRET_KEY", "JWT_SECRET_KEY", "DATABASE_URL"]
    missing = [v for v in required_vars if not os.getenv(v)]
    if missing:
        raise EnvironmentError(f"Missing required environment variables: {', '.join(missing)}")

    # Helpful warning for old Postgres URLs (SQLAlchemy needs postgresql://)
    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        logging.warning("DATABASE_URL uses 'postgres://'. Consider switching to 'postgresql://' for SQLAlchemy compatibility.")

if __name__ == "__main__":
    # Dev convenience: run with the built-in server
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "5050"))
    debug = os.getenv("DEBUG", "0").strip().lower() in {"1", "true", "yes", "on"}
    app.run(host=host, port=port, debug=debug)
