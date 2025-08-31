# backend/src/routes/auth/token_routes.py

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    jwt_required, get_jwt_identity, create_access_token, get_jwt
)
from datetime import datetime, timezone, timedelta

from ...models.user import User
from ...models.token_blocklist import TokenBlocklist
from ...extensions import db, jwt

bp = Blueprint("auth_tokens", __name__)

@bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh_token():
    """
    Refresh an expired access token.
    
    Returns:
        dict: New access token
    """
    identity = get_jwt_identity()
    user = db.session.get(User, identity)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if not user.is_verified:
        return jsonify({"error": "Email not verified"}), 403
    
    # Generate fresh access token with original claims
    access_token = create_access_token(
        identity=identity,
        additional_claims={"role": user.role}
    )
    
    return jsonify({
        "access_token": access_token,
        "user": user.to_dict()
    }), 200

@bp.route("/validate", methods=["POST"])
@jwt_required()
def validate_token():
    """
    Validate the current access token.
    
    Returns:
        dict: User information if token is valid
    """
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "valid": True,
        "user": user.to_dict()
    }), 200

@bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """
    Logout a user by adding their token to the blocklist.
    
    Returns:
        dict: Success message
    """
    jti = get_jwt()["jti"]
    now = datetime.now(timezone.utc)
    
    # Add token to blocklist
    token = TokenBlocklist(jti=jti, created_at=now)
    db.session.add(token)
    db.session.commit()
    
    return jsonify({"message": "Successfully logged out"}), 200

# JWT token blocklist loader
@jwt.token_in_blocklist_loader
def check_if_token_is_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    token = TokenBlocklist.query.filter_by(jti=jti).first()
    return token is not None
