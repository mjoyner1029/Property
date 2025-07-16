from flask import Blueprint
from ..controllers.landlord_controller import (
    get_landlord_profile, create_landlord_profile, 
    update_landlord_profile, verify_landlord,
    get_dashboard_data, get_pending_landlords,
    create_stripe_account, get_all_landlords
)

landlord_bp = Blueprint('landlords', __name__)

landlord_bp.route('/profile', methods=['GET'])(get_landlord_profile)
landlord_bp.route('/profile', methods=['POST'])(create_landlord_profile)
landlord_bp.route('/profile', methods=['PUT'])(update_landlord_profile)
landlord_bp.route('/verify/<int:landlord_id>', methods=['POST'])(verify_landlord)
landlord_bp.route('/dashboard', methods=['GET'])(get_dashboard_data)
landlord_bp.route('/pending-approvals', methods=['GET'])(get_pending_landlords)
landlord_bp.route('/stripe-account', methods=['POST'])(create_stripe_account)
landlord_bp.route('/all', methods=['GET'])(get_all_landlords)