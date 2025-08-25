# backend/src/routes/stripe_webhook.py

"""
Import and delegate to the canonical Stripe webhook implementation in src.webhooks.stripe
"""
from flask import Blueprint
from ..webhooks.stripe import bp as stripe_bp

bp = Blueprint("stripe_webhook_delegate", __name__)

# Use the canonical implementation from webhooks.stripe
# This file exists for backward compatibility and will delegate
# to the canonical implementation.
