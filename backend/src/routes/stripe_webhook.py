# backend/src/routes/stripe_webhook.py

"""
Stripe webhook endpoint with signature verification and limiter exemption.
Logs unhandled event types safely. Add your business logic where indicated.
"""

import os
import json
from flask import Blueprint, request, jsonify, current_app
from ..extensions import limiter

bp = Blueprint("stripe_webhook", __name__)

# Exempt the entire blueprint from rate limiting (webhooks must not be throttled)
limiter.exempt(bp)

try:
    import stripe
except Exception as e:
    stripe = None


def _get_stripe_endpoint_secret() -> str:
    return os.getenv("STRIPE_WEBHOOK_SECRET", "")


@bp.post("/api/stripe/webhook")
def stripe_webhook():
    if stripe is None:
        current_app.logger.error("Stripe library not installed; cannot process webhook")
        return jsonify({"error": "Stripe not available"}), 500

    endpoint_secret = _get_stripe_endpoint_secret()
    if not endpoint_secret:
        current_app.logger.error("STRIPE_WEBHOOK_SECRET not configured")
        return jsonify({"error": "Webhook secret not configured"}), 500

    payload = request.get_data(as_text=True)
    sig_header = request.headers.get("Stripe-Signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload=payload, sig_header=sig_header, secret=endpoint_secret
        )
    except stripe.error.SignatureVerificationError:
        current_app.logger.warning("Invalid Stripe signature")
        return jsonify({"error": "Invalid signature"}), 400
    except ValueError:
        current_app.logger.warning("Invalid Stripe payload")
        return jsonify({"error": "Invalid payload"}), 400
    except Exception:
        current_app.logger.exception("Error verifying Stripe webhook")
        return jsonify({"error": "Webhook verification failed"}), 400

    # Handle events
    try:
        event_type = event.get("type", "")
        data_obj = event.get("data", {}).get("object", {})
        current_app.logger.info(f"Stripe event received: {event_type}")

        if event_type == "checkout.session.completed":
            # Example: mark order as paid / create subscription, etc.
            _handle_checkout_session_completed(data_obj)
        elif event_type == "customer.subscription.updated":
            _handle_subscription_updated(data_obj)
        elif event_type == "customer.subscription.deleted":
            _handle_subscription_deleted(data_obj)
        elif event_type == "invoice.paid":
            _handle_invoice_paid(data_obj)
        elif event_type == "invoice.payment_failed":
            _handle_invoice_failed(data_obj)
        else:
            # Log and ignore unknown types
            current_app.logger.info(f"Unhandled Stripe event type: {event_type}")

        return jsonify({"received": True}), 200

    except Exception:
        current_app.logger.exception("Error handling Stripe webhook event")
        # Return 200 so Stripe doesn't keep retrying if your handler had a non-critical failure.
        return jsonify({"received": True}), 200


# ----- Handlers (no-op safe, add business logic as needed) -----

def _handle_checkout_session_completed(obj: dict) -> None:
    """
    Called when a Checkout Session completes.
    Implement: lookup session, attach user, set subscription/customer IDs, etc.
    """
    current_app.logger.debug(f"checkout.session.completed payload: {json.dumps(obj)}")


def _handle_subscription_updated(obj: dict) -> None:
    """
    Called when a subscription changes (status/plan/period).
    """
    current_app.logger.debug(f"customer.subscription.updated payload: {json.dumps(obj)}")


def _handle_subscription_deleted(obj: dict) -> None:
    """
    Called when a subscription is canceled or deleted.
    """
    current_app.logger.debug(f"customer.subscription.deleted payload: {json.dumps(obj)}")


def _handle_invoice_paid(obj: dict) -> None:
    """
    Called when an invoice is paid successfully.
    """
    current_app.logger.debug(f"invoice.paid payload: {json.dumps(obj)}")


def _handle_invoice_failed(obj: dict) -> None:
    """
    Called when an invoice payment fails.
    """
    current_app.logger.debug(f"invoice.payment_failed payload: {json.dumps(obj)}")
