# backend/src/routes/stripe_webhook.py

"""
Import and delegate to the canonical Stripe webhook implementation in src.webhooks.stripe
"""
from flask import Blueprint, request
from ..webhooks.stripe import bp as stripe_bp

bp = stripe_bp  # Use the blueprint from the canonical implementation
