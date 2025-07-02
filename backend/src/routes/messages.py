# backend/src/routes/messages.py

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.message import Message
from src.extensions import db

messages_bp = Blueprint('messages', __name__, url_prefix='/api/messages')

@messages_bp.route('/conversation', methods=['GET'])
@jwt_required()
def get_conversation():
    user_id = get_jwt_identity()["id"]
    other_id = request.args.get('other_id')
    property_id = request.args.get('property_id')

    if not other_id or not property_id:
        return jsonify({"error": "Missing required parameters"}), 400

    messages = Message.query.filter(
        ((Message.sender_id == user_id) & (Message.receiver_id == other_id) |
         (Message.sender_id == other_id) & (Message.receiver_id == user_id)) &
        (Message.property_id == property_id)
    ).order_by(Message.timestamp).all()

    return jsonify([{
        "id": m.id,
        "sender_id": m.sender_id,
        "receiver_id": m.receiver_id,
        "property_id": m.property_id,
        "content": m.content,
        "timestamp": m.timestamp.isoformat(),
        "read": m.read
    } for m in messages])

@messages_bp.route('/', methods=['POST'])
@jwt_required()
def send_message():
    user_id = get_jwt_identity()["id"]
    data = request.get_json()
    receiver_id = data.get('receiver_id')
    property_id = data.get('property_id')
    content = data.get('content')

    if not receiver_id or not content or not property_id:
        return jsonify({"error": "Missing required fields"}), 400

    msg = Message(
        sender_id=user_id,
        receiver_id=receiver_id,
        property_id=property_id,
        content=content
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify({"message": "Message sent", "id": msg.id})