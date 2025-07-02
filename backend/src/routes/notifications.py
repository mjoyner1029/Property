# backend/src/routes/notifications.py

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.notification import Notification
from src.extensions import db

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()["id"]
    notes = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    return jsonify([{
        "id": n.id,
        "message": n.message,
        "type": n.type,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat()
    } for n in notes])

@notifications_bp.route('/mark_read/<int:note_id>', methods=['POST'])
@jwt_required()
def mark_as_read(note_id):
    user_id = get_jwt_identity()["id"]
    note = Notification.query.get(note_id)
    if not note or note.user_id != user_id:
        return jsonify({"error": "Notification not found"}), 404
    note.is_read = True
    db.session.commit()
    return jsonify({"message": "Marked as read"})

@notifications_bp.route('/unread_count', methods=['GET'])
@jwt_required()
def unread_count():
    user_id = get_jwt_identity()["id"]
    count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return jsonify({"unread": count})