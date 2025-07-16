# backend/src/routes/admin.py

from flask import Blueprint
from ..controllers.admin_controller import (
    get_users, get_user, update_user, delete_user,
    get_properties, get_stats, get_payments,
    get_maintenance_requests, create_announcement,
    verify_user_email, get_verification_requests
)

admin_bp = Blueprint('admin', __name__)

admin_bp.route('/users', methods=['GET'])(get_users)
admin_bp.route('/users/<int:user_id>', methods=['GET'])(get_user)
admin_bp.route('/users/<int:user_id>', methods=['PUT'])(update_user)
admin_bp.route('/users/<int:user_id>', methods=['DELETE'])(delete_user)
admin_bp.route('/properties', methods=['GET'])(get_properties)
admin_bp.route('/stats', methods=['GET'])(get_stats)
admin_bp.route('/payments', methods=['GET'])(get_payments)
admin_bp.route('/maintenance', methods=['GET'])(get_maintenance_requests)
admin_bp.route('/announcements', methods=['POST'])(create_announcement)
admin_bp.route('/verify-email/<int:user_id>', methods=['PUT'])(verify_user_email)
admin_bp.route('/verification-requests', methods=['GET'])(get_verification_requests)