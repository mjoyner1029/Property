from flask import Blueprint
from ..controllers.messaging_controller import (
    get_threads, create_thread, get_messages,
    send_message, mark_as_read, mark_thread_as_read,
    get_unread_count, get_contacts
)

messaging_bp = Blueprint('messages', __name__)

messaging_bp.route('/threads', methods=['GET'])(get_threads)
messaging_bp.route('/threads/<int:user_id>', methods=['POST'])(create_thread)
messaging_bp.route('/threads/<int:thread_id>/messages', methods=['GET'])(get_messages)
messaging_bp.route('/threads/<int:thread_id>/messages', methods=['POST'])(send_message)
messaging_bp.route('/messages/<int:message_id>/read', methods=['PUT'])(mark_as_read)
messaging_bp.route('/threads/<int:thread_id>/read', methods=['PUT'])(mark_thread_as_read)
messaging_bp.route('/unread-count', methods=['GET'])(get_unread_count)
messaging_bp.route('/contacts', methods=['GET'])(get_contacts)