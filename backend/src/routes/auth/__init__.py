# backend/src/routes/auth/__init__.py

from flask import Blueprint

from .auth_routes import bp as auth_bp
from .token_routes import bp as token_bp

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# Register blueprints
bp.register_blueprint(auth_bp)
bp.register_blueprint(token_bp)

__all__ = ["bp"]
