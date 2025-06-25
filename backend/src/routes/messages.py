# backend/src/routes/messages.py

from flask import Blueprint, jsonify, request
from src.models.message import Message
from src.extensions import db

messages_bp = Blueprint('messages', __name__, url_prefix='/api/messages')

@messages_bp.route('/conversation', methods=['GET'])
def get_conversation():
    sender_id = request.args.get('sender_id')
    receiver_id = request.args.get('receiver_id')
    property_id = request.args.get('property_id')

    messages = Message.query.filter_by(sender_id=sender_id, receiver_id=receiver_id, property_id=property_id).union(
        Message.query.filter_by(sender_id=receiver_id, receiver_id=sender_id, property_id=property_id)
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
def send_message():
    data = request.get_json()
    msg = Message(
        sender_id=data['sender_id'],
        receiver_id=data['receiver_id'],
        property_id=data.get('property_id'),
        content=data['content']
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify({"message": "Message sent", "id": msg.id})