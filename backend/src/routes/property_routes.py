# backend/src/routes/properties.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..controllers.property_controller import (
    get_properties,
    get_property,
    create_property,
    update_property,
    delete_property
)

property_bp = Blueprint('property', __name__)

# Routes
property_bp.route('/', methods=['GET'])(jwt_required()(get_properties))
property_bp.route('/<int:property_id>', methods=['GET'])(jwt_required()(get_property))
property_bp.route('/', methods=['POST'])(jwt_required()(create_property))
property_bp.route('/<int:property_id>', methods=['PUT'])(jwt_required()(update_property))
property_bp.route('/<int:property_id>', methods=['DELETE'])(jwt_required()(delete_property))
