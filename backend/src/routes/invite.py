from flask import Blueprint, request, jsonify
from itsdangerous import URLSafeTimedSerializer
from src.models.user import User
from src.extensions import db, mail
from flask_mail import Message
import os
import logging

invite_bp = Blueprint("invite", __name__, url_prefix="/api/invite")
serializer = URLSafeTimedSerializer(os.getenv("SECRET_KEY"))

@invite_bp.route("/tenant", methods=["POST"])
def invite_tenant():
    data = request.get_json()
    email = data.get("email")
    landlord_id = data.get("landlord_id")
    if not email or not landlord_id:
        return jsonify({"message": "Missing required fields"}), 400

    token = serializer.dumps(email, salt="invite-salt")
    invite_url = f"{os.getenv('FRONTEND_URL')}/verify-invite/{token}"

    try:
        msg = Message(
            subject="You're Invited to Join Asset Anchor",
            sender=os.getenv("MAIL_USERNAME"),
            recipients=[email],
            body=f"You've been invited by your landlord. Click to join: {invite_url}"
        )
        mail.send(msg)
        logging.info(f"Invite sent to {email} by landlord {landlord_id}")
        return jsonify({"message": f"Invite sent to {email}"}), 200
    except Exception as e:
        logging.error(f"Email error: {e}")
        return jsonify({"message": "Failed to send invite"}), 500
