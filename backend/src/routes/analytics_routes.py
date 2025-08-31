from flask import Blueprint
from ..controllers.analytics_controller import (
    get_dashboard_stats, get_revenue_stats,
    get_occupancy_stats, get_maintenance_stats,
    get_tenant_stats, get_property_analytics
)

analytics_bp = Blueprint('analytics', __name__)

analytics_bp.route('/dashboard', methods=['GET'])(get_dashboard_stats)
analytics_bp.route('/revenue', methods=['GET'])(get_revenue_stats)
analytics_bp.route('/occupancy', methods=['GET'])(get_occupancy_stats)
analytics_bp.route('/maintenance', methods=['GET'])(get_maintenance_stats)
analytics_bp.route('/tenants', methods=['GET'])(get_tenant_stats)
analytics_bp.route('/property/<int:property_id>', methods=['GET'])(get_property_analytics)