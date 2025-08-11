from flask import Blueprint
from ..controllers.unit_controller import (
    create_unit, get_units_by_property, get_unit, 
    update_unit, delete_unit, get_available_units,
    assign_tenant_to_unit, remove_tenant_from_unit
)

unit_bp = Blueprint('units', __name__)

unit_bp.route('/', methods=['POST'])(create_unit)
unit_bp.route('/property/<int:property_id>', methods=['GET'])(get_units_by_property)
unit_bp.route('/<int:unit_id>', methods=['GET'])(get_unit)
unit_bp.route('/<int:unit_id>', methods=['PUT'])(update_unit)
unit_bp.route('/<int:unit_id>', methods=['DELETE'])(delete_unit)
unit_bp.route('/available', methods=['GET'])(get_available_units)
unit_bp.route('/<int:unit_id>/assign-tenant', methods=['POST'])(assign_tenant_to_unit)
unit_bp.route('/<int:unit_id>/remove-tenant', methods=['POST'])(remove_tenant_from_unit)