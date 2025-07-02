from flask import Blueprint, request, jsonify, current_app
import stripe
import os

webhooks_bp = Blueprint("webhooks", __name__)
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

@webhooks_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except stripe.error.SignatureVerificationError:
        return jsonify(success=False), 400

    if event['type'] == 'invoice.payment_succeeded':
        current_app.logger.info("Stripe webhook: Payment succeeded")
        # TODO: Update payment status in your database here

    return jsonify(success=True)