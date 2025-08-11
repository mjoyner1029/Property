from flask import Blueprint
from ..controllers.lease_controller import (
    create_lease, get_leases, get_lease,
    update_lease, delete_lease, get_tenant_leases,
    get_landlord_leases, accept_lease, reject_lease,
    terminate_lease, renew_lease
)

lease_bp = Blueprint('leases', __name__)

lease_bp.route('/', methods=['POST'])(create_lease)
lease_bp.route('/', methods=['GET'])(get_leases)
lease_bp.route('/<int:lease_id>', methods=['GET'])(get_lease)
lease_bp.route('/<int:lease_id>', methods=['PUT'])(update_lease)
lease_bp.route('/<int:lease_id>', methods=['DELETE'])(delete_lease)
lease_bp.route('/tenant', methods=['GET'])(get_tenant_leases)
lease_bp.route('/landlord', methods=['GET'])(get_landlord_leases)
lease_bp.route('/<int:lease_id>/accept', methods=['PUT'])(accept_lease)
lease_bp.route('/<int:lease_id>/reject', methods=['PUT'])(reject_lease)
lease_bp.route('/<int:lease_id>/terminate', methods=['PUT'])(terminate_lease)
lease_bp.route('/<int:lease_id>/renew', methods=['POST'])(renew_lease)