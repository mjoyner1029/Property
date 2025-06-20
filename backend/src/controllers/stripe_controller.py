import stripe
from flask import Blueprint, request, jsonify
from config import Config
from models import db, StripeAccount
from flask_jwt_extended import jwt_required, get_jwt_identity

stripe.api_key = Config.STRIPE_SECRET_KEY

stripe_bp = Blueprint('stripe', __name__)

@stripe_bp.route('/api/stripe/create-connect-link', methods=['POST'])
@jwt_required()
def create_connect_account():
    user_id = get_jwt_identity()
    data = request.get_json()
    account_type = data.get("account_type", "express")  # or "standard"

    account = stripe.Account.create(
        type=account_type,
        country="US",
        email=data["email"],
        capabilities={"transfers": {"requested": True}},
    )

    # Save to DB
    stripe_account = StripeAccount(user_id=user_id, stripe_id=account.id, account_type=account_type)
    db.session.add(stripe_account)
    db.session.commit()

    link = stripe.AccountLink.create(
        account=account.id,
        refresh_url="http://localhost:3000/stripe/refresh",
        return_url="http://localhost:3000/dashboard",
        type="account_onboarding",
    )

    return jsonify({"url": link.url})
