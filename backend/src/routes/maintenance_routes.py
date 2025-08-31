# backend/src/routes/maintenance_routes.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models.maintenance_request import MaintenanceRequest
from ..controllers.maintenance_controller import (
    create_request, get_requests, get_request,
    update_request, delete_request, get_tenant_requests,
    get_landlord_requests, assign_request, complete_request
)

maintenance_bp = Blueprint("maintenance", __name__)

# Routes with unique endpoint names
maintenance_bp.route('/', methods=['POST'], endpoint='create_maintenance_request')(jwt_required()(create_request))
maintenance_bp.route('/', methods=['GET'], endpoint='list_maintenance_requests')(jwt_required()(get_requests))
maintenance_bp.route('/<int:request_id>', methods=['GET'], endpoint='get_maintenance_request')(jwt_required()(get_request))
maintenance_bp.route('/<int:request_id>', methods=['PUT'], endpoint='update_maintenance_request')(jwt_required()(update_request))
maintenance_bp.route('/<int:request_id>', methods=['DELETE'], endpoint='delete_maintenance_request')(jwt_required()(delete_request))
maintenance_bp.route('/tenant/<int:tenant_id>', methods=['GET'], endpoint='get_tenant_maintenance_requests_by_id')(jwt_required()(get_tenant_requests))
maintenance_bp.route('/tenant', methods=['GET'], endpoint='get_tenant_maintenance_requests')(jwt_required()(get_tenant_requests))
maintenance_bp.route('/landlord', methods=['GET'], endpoint='get_landlord_maintenance_requests')(jwt_required()(get_landlord_requests))
maintenance_bp.route('/<int:request_id>/assign', methods=['PUT'], endpoint='assign_maintenance_request')(jwt_required()(assign_request))
maintenance_bp.route('/<int:request_id>/complete', methods=['PUT'], endpoint='complete_maintenance_request')(jwt_required()(complete_request))
