# backend/src/__init__.py
from __future__ import annotations

__version__ = "1.0.0"

# Re-export the app factory from app.py so WSGI (gunicorn) can do:
#   from src import create_app
#   app = create_app()
from .app import create_app  # noqa: F401
