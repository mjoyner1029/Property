from flask import Blueprint, request, jsonify
import stripe
import os

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
webhook_bp = Blueprint("webhooks", __name__, url_prefix="/api/webhooks")

@webhook_bp.route("/stripe", methods=["POST"])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get("Stripe-Signature")
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError as e:
        return jsonify({"error": "Invalid payload"}), 400
    except stripe.error.SignatureVerificationError as e:
        return jsonify({"error": "Invalid signature"}), 400

    # Handle event types
    if event["type"] == "payment_intent.succeeded":
        print("Payment succeeded")
    return jsonify({"status": "success"}), 200
