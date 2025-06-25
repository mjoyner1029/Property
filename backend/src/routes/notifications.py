# backend/src/routes/notifications.py

from flask import Blueprint, jsonify, request
from src.models.notification import Notification
from src.extensions import db

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('/<int:user_id>', methods=['GET'])
def get_notifications(user_id):
    notes = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    return jsonify([{
        "id": n.id,
        "message": n.message,
        "type": n.type,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat()
    } for n in notes])

@notifications_bp.route('/mark_read/<int:note_id>', methods=['POST'])
def mark_as_read(note_id):
    note = Notification.query.get(note_id)
    if not note:
        return jsonify({"error": "Notification not found"}), 404
    note.is_read = True
    db.session.commit()
    return jsonify({"message": "Marked as read"})