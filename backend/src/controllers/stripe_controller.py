import stripe
from flask import Blueprint, request, jsonify, current_app
from src.extensions import db
from src.models.stripe_account import StripeAccount
from flask_jwt_extended import jwt_required, get_jwt_identity
import os

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

stripe_bp = Blueprint('stripe', __name__)

@stripe_bp.route('/api/stripe/create-connect-link', methods=['POST'])
@jwt_required()
def create_connect_account():
    user_id = get_jwt_identity()
    data = request.get_json()
    account_type = data.get("account_type", "express")  # or "standard"
    email = data.get("email")
    if not email:
        return jsonify({"error": "Email is required"}), 400

    try:
        account = stripe.Account.create(
            type=account_type,
            country="US",
            email=email,
            capabilities={"transfers": {"requested": True}},
        )
        # Save to DB
        stripe_account = StripeAccount(user_id=user_id, stripe_id=account.id, account_type=account_type)
        db.session.add(stripe_account)
        db.session.commit()

        link = stripe.AccountLink.create(
            account=account.id,
            refresh_url=os.getenv("STRIPE_REFRESH_URL", "http://localhost:3000/stripe/refresh"),
            return_url=os.getenv("STRIPE_RETURN_URL", "http://localhost:3000/dashboard"),
            type="account_onboarding",
        )

        return jsonify({"url": link.url})
    except Exception as e:
        current_app.logger.error(f"Stripe connect error: {e}")
        return jsonify({"error": "Stripe account creation failed"}), 500
