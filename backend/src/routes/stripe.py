# backend/src/routes/stripe.py

from flask import Blueprint, request, jsonify, current_app
import stripe
import os
from src.models.user import User
from src.models.payment import Payment
from src.extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity

bp = Blueprint("stripe", __name__, url_prefix="/api/stripe")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

@bp.route("/onboard/landlord", methods=["POST"])
@jwt_required()
def create_stripe_account():
    user_id = get_jwt_identity()["id"]
    user = User.query.get(user_id)
    if not user or user.role != "landlord":
        return jsonify({"error": "Unauthorized"}), 403

    if user.stripe_account_id:
        return jsonify({"url": stripe.Account.create_login_link(user.stripe_account_id).url})

    account = stripe.Account.create(
        type="express",
        country="US",
        email=user.email,
        capabilities={"transfers": {"requested": True}},
        business_type="individual"
    )
    user.stripe_account_id = account.id
    db.session.commit()

    account_link = stripe.AccountLink.create(
        account=account.id,
        refresh_url=os.getenv("STRIPE_REFRESH_URL"),
        return_url=os.getenv("STRIPE_RETURN_URL"),
        type="account_onboarding"
    )
    return jsonify({"url": account_link.url})

@bp.route("/create-checkout-session", methods=["POST"])
@jwt_required()
def create_checkout_session():
    data = request.get_json()
    landlord_id = data.get("landlord_id")
    amount = data.get("amount")
    currency = data.get("currency", "usd")
    user_id = get_jwt_identity()["id"]
    user = User.query.get(user_id)

    if not landlord_id or not amount:
        return jsonify({"error": "Missing required fields"}), 400

    landlord = User.query.get(landlord_id)
    if not landlord or not landlord.stripe_account_id:
        return jsonify({"error": "Landlord not onboarded with Stripe"}), 400

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": currency,
                    "product_data": {"name": "Rent Payment"},
                    "unit_amount": int(float(amount) * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=os.getenv("STRIPE_SUCCESS_URL"),
            cancel_url=os.getenv("STRIPE_CANCEL_URL"),
            payment_intent_data={
                "application_fee_amount": int(float(amount) * 100 * 0.03),  # 3% fee
                "transfer_data": {"destination": landlord.stripe_account_id},
            },
            customer_email=user.email
        )
        return jsonify({"sessionId": session.id})
    except Exception as e:
        current_app.logger.error(f"Stripe checkout session error: {e}")
        return jsonify({"error": "Stripe error"}), 500

@bp.route("/webhook", methods=["POST"])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get("Stripe-Signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError:
        return jsonify({"error": "Invalid payload"}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({"error": "Invalid signature"}), 400

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        # Mark payment as complete in your DB
        payment = Payment.query.filter_by(stripe_session_id=session["id"]).first()
        if payment:
            payment.status = "completed"
            db.session.commit()
            current_app.logger.info(f"Payment {payment.id} marked as completed.")

    return jsonify({"status": "success"}), 200
