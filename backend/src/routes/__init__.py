"""Routes package for the Asset Anchor API."""

from flask import Blueprint

# Create main blueprints
auth_bp = Blueprint('auth', __name__)
api_bp = Blueprint('api', __name__)
webhook_bp = Blueprint('webhooks', __name__)
