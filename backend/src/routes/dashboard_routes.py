# backend/src/routes/dashboard_routes.py

from flask import Blueprint
from ..controllers.dashboard_controller import (
    get_landlord_dashboard, get_tenant_dashboard, get_dashboard_stats
)

dashboard_bp = Blueprint('dashboard', __name__)

dashboard_bp.route('/landlord', methods=['GET'])(get_landlord_dashboard)
dashboard_bp.route('/tenant', methods=['GET'])(get_tenant_dashboard)
dashboard_bp.route('/stats', methods=['GET'])(get_dashboard_stats)
