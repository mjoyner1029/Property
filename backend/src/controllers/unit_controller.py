from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime  # Add missing datetime import

from ..models.unit import Unit
from ..models.property import Property
from ..models.tenant_property import TenantProperty
from ..models.user import User
from ..extensions import db
from ..utils.role_required import role_required

unit_bp = Blueprint('units', __name__)

@unit_bp.route('/', methods=['POST'])
@jwt_required()
@role_required('landlord')
def create_unit():
    """Create a new unit in a property"""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    try:
        # Validate required fields
        required_fields = ['property_id', 'unit_number', 'size', 'bedrooms', 'bathrooms']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Verify property belongs to landlord
        property = Property.query.filter_by(id=data['property_id'], landlord_id=current_user_id).first()
        if not property:
            return jsonify({"error": "Property not found or you don't have permission"}), 404
        
        # Check if unit number already exists for this property
        existing_unit = Unit.query.filter_by(
            property_id=data['property_id'], 
            unit_number=data['unit_number']
        ).first()
        
        if existing_unit:
            return jsonify({"error": "A unit with this number already exists in this property"}), 400
        
        # Create unit
        new_unit = Unit(
            property_id=data['property_id'],
            unit_number=data['unit_number'],
            size=data['size'],
            bedrooms=data['bedrooms'],
            bathrooms=data['bathrooms'],
            rent_amount=data.get('rent_amount', 0),
            description=data.get('description', ''),
            status=data.get('status', 'available')
        )
        
        # Add optional fields if provided
        if 'features' in data:
            new_unit.features = data['features']
        if 'floor' in data:
            new_unit.floor = data['floor']
        
        db.session.add(new_unit)
        db.session.commit()
        
        return jsonify({
            "message": "Unit created successfully", 
            "unit_id": new_unit.id
        }), 201
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@unit_bp.route('/property/<int:property_id>', methods=['GET'])
@jwt_required()
def get_units_by_property(property_id):
    """Get all units for a specific property"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    try:
        property = Property.query.get(property_id)
        if not property:
            return jsonify({"error": "Property not found"}), 404
            
        print(f"DEBUG: user_id={current_user_id}, role={user.role}, property.landlord_id={property.landlord_id}")
        
        # Check permissions
        # Admin can view all properties
        if user.role == 'admin':
            pass  # Admin can view all properties
        # Landlords can only view their own properties
        elif user.role == 'landlord':
            # Convert IDs to strings for safer comparison (handles integer/string mismatches)
            if str(property.landlord_id) != str(current_user_id):
                print(f"DEBUG: Landlord access denied: property.landlord_id={property.landlord_id}, user_id={current_user_id}")
                return jsonify({"error": "Unauthorized access - landlord can only view own properties"}), 403
        # Tenants can only view properties they're associated with
        elif user.role == 'tenant':
            tenant_property = TenantProperty.query.filter_by(
                tenant_id=current_user_id,
                property_id=property_id
            ).first()
            if not tenant_property:
                return jsonify({"error": "Unauthorized access - tenant not associated with property"}), 403
        else:
            # Unknown role
            return jsonify({"error": "Unauthorized role"}), 403
        
        # Query units
        units = Unit.query.filter_by(property_id=property_id).all()
        
        result = [unit.to_dict() for unit in units]
        
        return jsonify({"units": result}), 200
        
    except Exception as e:
        import traceback
        print(f"DEBUG ERROR: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@unit_bp.route('/<int:unit_id>', methods=['GET'])
@jwt_required()
def get_unit(unit_id):
    """Get details of a specific unit"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    try:
        unit = Unit.query.get(unit_id)
        if not unit:
            return jsonify({"error": "Unit not found"}), 404
            
        # Get associated property
        property = Property.query.get(unit.property_id)
        if not property:
            return jsonify({"error": "Property not found"}), 404
            
        # Check permissions
        # Landlords can only view their own properties' units
        if user.role == 'landlord' and property.landlord_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403
        
        # Tenants can only view units they're associated with
        if user.role == 'tenant':
            tenant_property = TenantProperty.query.filter_by(
                tenant_id=current_user_id,
                property_id=unit.property_id
            ).first()
            if not tenant_property:
                return jsonify({"error": "Unauthorized access"}), 403
        
        return jsonify(unit.to_dict()), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@unit_bp.route('/<int:unit_id>', methods=['PUT'])
@jwt_required()
@role_required('landlord')
def update_unit(unit_id):
    """Update a unit's details"""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    try:
        unit = Unit.query.get(unit_id)
        if not unit:
            return jsonify({"error": "Unit not found"}), 404
            
        # Verify property belongs to landlord
        property = Property.query.filter_by(id=unit.property_id, landlord_id=current_user_id).first()
        if not property:
            return jsonify({"error": "Unauthorized access"}), 403
            
        # Check for unit number conflict if updating unit number
        if 'unit_number' in data and data['unit_number'] != unit.unit_number:
            existing_unit = Unit.query.filter_by(
                property_id=unit.property_id, 
                unit_number=data['unit_number']
            ).first()
            if existing_unit:
                return jsonify({"error": "A unit with this number already exists in this property"}), 400
        
        # Update fields
        if 'unit_number' in data:
            unit.unit_number = data['unit_number']
        if 'size' in data:
            unit.size = data['size']
        if 'bedrooms' in data:
            unit.bedrooms = data['bedrooms']
        if 'bathrooms' in data:
            unit.bathrooms = data['bathrooms']
        if 'rent_amount' in data:
            unit.rent_amount = data['rent_amount']
        if 'description' in data:
            unit.description = data['description']
        if 'features' in data:
            unit.features = data['features']
        if 'floor' in data:
            unit.floor = data['floor']
        if 'status' in data:
            unit.status = data['status']
            
        db.session.commit()
        
        # Return the updated unit as expected by the test
        return jsonify({"unit": unit.to_dict()}), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@unit_bp.route('/<int:unit_id>', methods=['DELETE'])
@jwt_required()
@role_required('landlord')
def delete_unit(unit_id):
    """Delete a unit"""
    current_user_id = get_jwt_identity()
    
    try:
        unit = Unit.query.get(unit_id)
        if not unit:
            return jsonify({"error": "Unit not found"}), 404
            
        # Verify property belongs to landlord
        property = Property.query.filter_by(id=unit.property_id, landlord_id=current_user_id).first()
        if not property:
            return jsonify({"error": "Unauthorized access"}), 403
            
        # Check if unit has active tenant associations
        tenant_property = TenantProperty.query.filter_by(
            property_id=unit.property_id,
            unit_id=unit.id,
            status='active'
        ).first()
        
        if tenant_property:
            return jsonify({"error": "Cannot delete a unit with active tenants"}), 400
            
        # Delete unit
        db.session.delete(unit)
        db.session.commit()
        
        return jsonify({"message": "Unit deleted successfully"}), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@unit_bp.route('/available', methods=['GET'])
@jwt_required()
def get_available_units():
    """Get all available units"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        min_bedrooms = request.args.get('min_bedrooms', type=int)
        max_rent = request.args.get('max_rent', type=float)
        property_id = request.args.get('property_id', type=int)
        
        # Base query for available units
        query = Unit.query.filter_by(status='available')
        
        # For landlords, only show their own properties' units
        if user.role == 'landlord':
            query = query.join(Property).filter(Property.landlord_id == current_user_id)
            
        # Apply filters
        if property_id:
            # For landlords, verify ownership
            if user.role == 'landlord':
                property_exists = Property.query.filter_by(
                    id=property_id, 
                    landlord_id=current_user_id
                ).first()
                if not property_exists:
                    return jsonify({"error": "Property not found or unauthorized"}), 403
            query = query.filter(Unit.property_id == property_id)
            
        if min_bedrooms:
            query = query.filter(Unit.bedrooms >= min_bedrooms)
            
        if max_rent:
            query = query.filter(Unit.rent_amount <= max_rent)
            
        # Paginate results
        paginated_units = query.paginate(page=page, per_page=per_page)
        
        result = {
            "units": [unit.to_dict() for unit in paginated_units.items],
            "total": paginated_units.total,
            "pages": paginated_units.pages,
            "current_page": page
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@unit_bp.route('/<int:unit_id>/assign-tenant', methods=['POST'])
@jwt_required()
@role_required('landlord')
def assign_tenant_to_unit(unit_id):
    """Assign a tenant to a specific unit"""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    if 'tenant_id' not in data:
        return jsonify({"error": "Missing tenant_id in request"}), 400
        
    tenant_id = data['tenant_id']
    
    try:
        # Verify unit exists
        unit = Unit.query.get(unit_id)
        if not unit:
            return jsonify({"error": "Unit not found"}), 404
            
        # Verify property belongs to landlord
        property = Property.query.filter_by(id=unit.property_id, landlord_id=current_user_id).first()
        if not property:
            return jsonify({"error": "Unauthorized access"}), 403
            
        # Verify tenant exists
        tenant = User.query.filter_by(id=tenant_id, role='tenant').first()
        if not tenant:
            return jsonify({"error": "Tenant not found"}), 404
            
        # Verify unit is available
        if unit.status != 'available':
            return jsonify({"error": "Unit is not available for assignment"}), 400
            
        # Check for existing tenant-property relationship
        tenant_property = TenantProperty.query.filter_by(
            tenant_id=tenant_id,
            property_id=unit.property_id
        ).first()
        
        # If relationship exists, update it
        if tenant_property:
            tenant_property.unit_id = unit.id
            tenant_property.status = 'active'
            tenant_property.rent_amount = unit.rent_amount
        else:
            # Create new tenant-property relationship
            tenant_property = TenantProperty(
                tenant_id=tenant_id,
                property_id=unit.property_id,
                unit_id=unit.id,
                rent_amount=unit.rent_amount,
                status='active'
            )
            db.session.add(tenant_property)
            
        # Update unit status
        unit.status = 'occupied'
        
        db.session.commit()
        
        return jsonify({"message": "Tenant assigned to unit successfully"}), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@unit_bp.route('/<int:unit_id>/remove-tenant', methods=['POST'])
@jwt_required()
@role_required('landlord')
def remove_tenant_from_unit(unit_id):
    """Remove a tenant from a specific unit"""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    if 'tenant_id' not in data:
        return jsonify({"error": "Missing tenant_id in request"}), 400
        
    tenant_id = data['tenant_id']
    
    try:
        # Verify unit exists
        unit = Unit.query.get(unit_id)
        if not unit:
            return jsonify({"error": "Unit not found"}), 404
            
        # Verify property belongs to landlord
        property = Property.query.filter_by(id=unit.property_id, landlord_id=current_user_id).first()
        if not property:
            return jsonify({"error": "Unauthorized access"}), 403
            
        # Find tenant-property relationship
        tenant_property = TenantProperty.query.filter_by(
            tenant_id=tenant_id,
            property_id=unit.property_id,
            unit_id=unit.id,
            status='active'
        ).first()
        
        if not tenant_property:
            return jsonify({"error": "Tenant is not assigned to this unit"}), 404
            
        # Update tenant-property relationship
        tenant_property.status = 'inactive'
        tenant_property.end_date = datetime.now()
        
        # Update unit status
        unit.status = 'available'
        
        db.session.commit()
        
        return jsonify({"message": "Tenant removed from unit successfully"}), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500