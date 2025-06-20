# backend/src/routes/stripe.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.services.stripe_service import create_connect_account, create_account_link
from src.models.stripe_account import StripeAccount
from src.extensions import db

bp = Blueprint("stripe", __name__, url_prefix="/api/stripe")

@bp.route("/connect", methods=["POST"])
@jwt_required()
def stripe_connect():
    user_id = get_jwt_identity()["id"]
    account = create_connect_account(user_id)
    link = create_account_link(account.id)

    stripe_record = StripeAccount(user_id=user_id, stripe_id=account.id, account_type="landlord")
    db.session.add(stripe_record)
    db.session.commit()

    return jsonify({"url": link.url})
