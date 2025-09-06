# backend/src/routes/admin_routes.py

from flask import Blueprint
from ..controllers.admin_controller import (
    get_users, get_user, update_user, delete_user,
    get_properties, get_tenants, get_stats, get_payments,
    get_maintenance_requests, create_announcement,
    verify_user_email, get_verification_requests
)
from ..controllers.admin_logs_controller import get_logs, get_audit_log

admin_bp = Blueprint('admin', __name__)

# User management
admin_bp.route('/users', methods=['GET'])(get_users)
admin_bp.route('/users/<int:user_id>', methods=['GET'])(get_user)
admin_bp.route('/users/<int:user_id>', methods=['PUT'])(update_user)
admin_bp.route('/users/<int:user_id>', methods=['DELETE'])(delete_user)

# Property management
admin_bp.route('/properties', methods=['GET'])(get_properties)

# Tenant management
admin_bp.route('/tenants', methods=['GET'])(get_tenants)

# Statistics
admin_bp.route('/stats', methods=['GET'])(get_stats)

# Payment management
admin_bp.route('/payments', methods=['GET'])(get_payments)

# Maintenance management
admin_bp.route('/maintenance', methods=['GET'])(get_maintenance_requests)

# Announcements
admin_bp.route('/announcements', methods=['POST'])(create_announcement)

# User verification
admin_bp.route('/verify-email/<int:user_id>', methods=['PUT'])(verify_user_email)
admin_bp.route('/verification-requests', methods=['GET'])(get_verification_requests)

# Logs and audit trails
admin_bp.route('/logs', methods=['GET'])(get_logs)
admin_bp.route('/audit-log', methods=['GET'])(get_audit_log)