# backend/src/routes/notifications.py

from flask import Blueprint
from ..controllers.notification_controller import (
    get_notifications, get_notification, mark_as_read,
    mark_all_as_read, delete_notification, clear_all_notifications,
    get_unread_count, create_notification, broadcast_notification
)

notification_bp = Blueprint('notifications', __name__)

notification_bp.route('/', methods=['GET'])(get_notifications)
notification_bp.route('/<int:notification_id>', methods=['GET'])(get_notification)
notification_bp.route('/<int:notification_id>/read', methods=['PUT'])(mark_as_read)
notification_bp.route('/mark-all-read', methods=['PUT'])(mark_all_as_read)
notification_bp.route('/<int:notification_id>', methods=['DELETE'])(delete_notification)
notification_bp.route('/clear-all', methods=['DELETE'])(clear_all_notifications)
notification_bp.route('/unread-count', methods=['GET'])(get_unread_count)
notification_bp.route('/send', methods=['POST'])(create_notification)
notification_bp.route('/broadcast', methods=['POST'])(broadcast_notification)