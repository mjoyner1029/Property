from flask import Blueprint, request, jsonify
from itsdangerous import URLSafeTimedSerializer
from src.models.user import User
from src.extensions import db, mail
from flask_mail import Message
import os

invite_bp = Blueprint("invite", __name__)
serializer = URLSafeTimedSerializer(os.getenv("SECRET_KEY"))

@invite_bp.route("/api/invite/tenant", methods=["POST"])
def invite_tenant():
    data = request.get_json()
    email = data.get("email")
    landlord_id = data.get("landlord_id")
    token = serializer.dumps(email, salt="invite-salt")

    invite_url = f"{os.getenv('FRONTEND_URL')}/verify-invite/{token}"

    try:
        msg = Message(
            subject="You're Invited to Join PropertyPilot",
            sender=os.getenv("MAIL_USERNAME"),
            recipients=[email],
            body=f"You've been invited by your landlord. Click to join: {invite_url}"
        )
        mail.send(msg)
        return jsonify({"message": f"Invite sent to {email}"}), 200
    except Exception as e:
        print(f"Email error: {e}")
        return jsonify({"message": "Failed to send invite"}), 500
