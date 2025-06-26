from flask import Blueprint, jsonify
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from src.models.user import User
from src.extensions import db
import os

verify_bp = Blueprint("verify_email", __name__)
serializer = URLSafeTimedSerializer(os.getenv("SECRET_KEY"))

@verify_bp.route("/api/verify/<token>", methods=["GET"])
def verify_email(token):
    try:
        email = serializer.loads(token, salt="email-verify", max_age=3600)
    except SignatureExpired:
        return jsonify({"message": "Verification link expired"}), 400
    except BadSignature:
        return jsonify({"message": "Invalid token"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    user.is_verified = True
    db.session.commit()
    return jsonify({"message": "Email verified successfully"}), 200
