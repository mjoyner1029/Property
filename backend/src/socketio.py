"""
Socket.IO event handlers for real-time communication.
Threading-friendly auth: authenticate on connect, store user_id in session.
"""
from __future__ import annotations

from functools import wraps
from datetime import datetime

from flask import request, current_app, session
from flask_socketio import emit, join_room, leave_room, disconnect

# Use the shared SocketIO instance created in extensions.py
from .extensions import socketio
from .models.user import User


# -------- Auth helpers --------

def _extract_token(auth) -> str | None:
    """
    Try to pull a JWT from:
    1) Socket.IO auth payload: io(url, { auth: { token } })
    2) Authorization header: Bearer <token>
    3) Query string: ?token=<token>
    """
    # 1) from auth payload
    if isinstance(auth, dict):
        token = auth.get("token")
        if token:
            return token

    # 2) from Authorization header
    auth_header = request.headers.get("Authorization", "") or request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header.split(None, 1)[1].strip()

    # 3) from query string
    token = request.args.get("token")
    if token:
        return token

    return None


def _decode_user_id(token: str) -> int | None:
    """
    Decode JWT and return the subject (user_id).
    Relies on Flask-JWT-Extended configuration already set on the app.
    """
    try:
        # Using flask_jwt_extended's decode_token validates signature/exp.
        from flask_jwt_extended import decode_token
        claims = decode_token(token)
        # Default identity key is 'sub'
        user_id = claims.get("sub")
        # normalize to int when possible
        try:
            return int(user_id) if user_id is not None else None
        except (TypeError, ValueError):
            return None
    except Exception as e:
        current_app.logger.error(f"Socket JWT decode error: {e}")
        return None


def authenticated_only(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        uid = session.get("user_id")
        if not uid:
            emit("error", {"message": "Unauthorized"}, to=request.sid)
            disconnect()
            return None
        return fn(*args, **kwargs)
    return wrapper


# -------- Connection lifecycle --------

@socketio.on("connect")
def handle_connect(auth):
    """
    Authenticate once when the socket connects.
    Store user_id in the Socket.IO session for later events.
    """
    token = _extract_token(auth)
    if not token:
        current_app.logger.warning("Socket connect missing token")
        return False  # disconnect

    user_id = _decode_user_id(token)
    if not user_id:
        current_app.logger.warning("Socket connect invalid token")
        return False  # disconnect

    session["user_id"] = user_id
    current_app.logger.info(f"Client connected user_id={user_id}")


@socketio.on("disconnect")
def handle_disconnect():
    uid = session.get("user_id")
    current_app.logger.info(f"Client disconnected user_id={uid}")


# -------- App events --------

@socketio.on("join")
@authenticated_only
def handle_join(data):
    user_id = session.get("user_id")
    room = (data or {}).get("room")

    if not room:
        emit("error", {"message": "Room is required"})
        return

    if validate_room_access(user_id, room):
        join_room(room)
        emit("status", {"message": f"Joined room {room}"}, room=room)
        current_app.logger.info(f"User {user_id} joined room {room}")
    else:
        emit("error", {"message": "Access denied to this room"})
        current_app.logger.warning(f"User {user_id} attempted to join room {room} - access denied")


@socketio.on("leave")
@authenticated_only
def handle_leave(data):
    user_id = session.get("user_id")
    room = (data or {}).get("room")
    if room:
        leave_room(room)
        emit("status", {"message": f"Left room {room}"}, room=room)
        current_app.logger.info(f"User {user_id} left room {room}")


@socketio.on("send_message")
@authenticated_only
def handle_send_message(data):
    user_id = session.get("user_id")
    room = (data or {}).get("room")
    message = (data or {}).get("message")

    if not message or not room or not validate_room_access(user_id, room):
        emit("error", {"message": "Invalid message or access denied"})
        return

    # Get user details for the message
    user = db.session.get(User, user_id)
    if not user:
        emit("error", {"message": "User not found"})
        return

    response = {
        "room": room,
        "message": message,
        "user": {"id": user.id, "name": getattr(user, "name", None), "role": getattr(user, "role", None)},
        "timestamp": datetime.utcnow().isoformat(),
    }

    # Broadcast to room
    emit("receive_message", response, room=room)

    # Persist (best-effort)
    try:
        from .models.message import Message
        from .extensions import db

        db_message = Message(sender_id=user_id, content=message, room=room)
        db.session.add(db_message)
        db.session.commit()
    except Exception as e:
        current_app.logger.error(f"Error storing message: {e}")


@socketio.on("maintenance_update")
@authenticated_only
def handle_maintenance_update(data):
    user_id = session.get("user_id")
    request_id = (data or {}).get("request_id")
    property_id = (data or {}).get("property_id")

    property_room = f"property_{property_id}"
    emit("maintenance_updated", data, room=property_room)
    current_app.logger.info(f"Maintenance request {request_id} updated by user {user_id}")


@socketio.on("payment_received")
@authenticated_only
def handle_payment_received(data):
    user_id = session.get("user_id")
    payment_id = (data or {}).get("payment_id")
    property_id = (data or {}).get("property_id")

    property_room = f"property_{property_id}"
    emit("payment_notification", data, room=property_room)
    current_app.logger.info(f"Payment {payment_id} notification sent by user {user_id}")


# -------- Access control --------

def validate_room_access(user_id: int | None, room: str) -> bool:
    """
    Validate if a user has access to a specific room.
    Rooms can be for properties, conversations, etc.
    """
    if not user_id or not room:
        return False

    # Property room access: property_<id>
    if room.startswith("property_"):
        try:
            property_id = int(room.split("_")[1])
        except (IndexError, ValueError):
            return False

        from .models.property import Property
        from .models.tenant import Tenant

        # Landlord/owner
        if Property.query.filter_by(id=property_id, owner_id=user_id).first():
            return True

        # Tenant of this property
        if Tenant.query.filter_by(property_id=property_id, user_id=user_id).first():
            return True

        return False

    # Conversation room access: conversation_<id>
    if room.startswith("conversation_"):
        try:
            conversation_id = int(room.split("_")[1])
        except (IndexError, ValueError):
            return False

        from .models.conversation import ConversationParticipant

        participant = ConversationParticipant.query.filter_by(
            conversation_id=conversation_id, user_id=user_id
        ).first()
        return participant is not None

    # Admin broadcast
    if room == "admin":
        user = db.session.get(User, user_id)
        return bool(user and getattr(user, "role", None) == "admin")

    return False
