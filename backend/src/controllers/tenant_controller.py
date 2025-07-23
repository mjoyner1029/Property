from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from ..models.user import User
from ..models.tenant import Tenant
from ..models.tenant_profile import TenantProfile
from ..models.tenant_property import TenantProperty
from ..models.property import Property
from ..extensions import db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def get_tenants():
    """Get all tenants for the landlord's properties"""
    current_user_id = get_jwt_identity()
    
    try:
        # Check if user is a landlord
        user = User.query.get(current_user_id)
        if not user or user.role != 'landlord':
            return jsonify({"error": "Only landlords can view tenants"}), 403
        
        # Get properties owned by this landlord
        properties = Property.query.filter_by(landlord_id=current_user_id).all()
        property_ids = [p.id for p in properties]
        
        # Get tenants associated with these properties
        tenant_properties = TenantProperty.query.filter(
            TenantProperty.property_id.in_(property_ids)
        ).all()
        
        tenant_ids = [tp.tenant_id for tp in tenant_properties]
        tenants = User.query.filter(
            User.id.in_(tenant_ids),
            User.role == 'tenant'
        ).all()
        
        # Get tenant profiles
        tenant_data = []
        for tenant in tenants:
            profile = TenantProfile.query.filter_by(user_id=tenant.id).first()
            tenant_info = tenant.to_dict()
            
            # Add profile data if available
            if profile:
                tenant_info.update({
                    "phone": profile.phone,
                    "emergency_contact": profile.emergency_contact,
                    "emergency_phone": profile.emergency_phone
                })
            
            # Get property information
            tenant_properties = TenantProperty.query.filter_by(tenant_id=tenant.id).all()
            property_data = []
            for tp in tenant_properties:
                if tp.property_id in property_ids:  # Only include properties owned by this landlord
                    property = Property.query.get(tp.property_id)
                    if property:
                        property_data.append({
                            "id": property.id,
                            "name": property.name,
                            "address": property.address,
                            "move_in_date": tp.move_in_date.isoformat() if tp.move_in_date else None,
                            "move_out_date": tp.move_out_date.isoformat() if tp.move_out_date else None,
                            "rent_amount": tp.rent_amount,
                            "status": tp.status
                        })
            
            tenant_info["properties"] = property_data
            tenant_data.append(tenant_info)
        
        return jsonify({"tenants": tenant_data}), 200
    except Exception as e:
        logger.error(f"Error getting tenants: {str(e)}")
        return jsonify({"error": str(e)}), 500

def get_tenant(tenant_id):
    """Get a specific tenant"""
    current_user_id = get_jwt_identity()
    
    try:
        # Check if user is a landlord
        user = User.query.get(current_user_id)
        if not user or user.role != 'landlord':
            return jsonify({"error": "Only landlords can view tenant details"}), 403
        
        # Check if tenant exists
        tenant = User.query.filter_by(id=tenant_id, role='tenant').first()
        if not tenant:
            return jsonify({"error": "Tenant not found"}), 404
        
        # Check if tenant is associated with any of the landlord's properties
        properties = Property.query.filter_by(landlord_id=current_user_id).all()
        property_ids = [p.id for p in properties]
        
        tenant_property = TenantProperty.query.filter(
            TenantProperty.tenant_id == tenant_id,
            TenantProperty.property_id.in_(property_ids)
        ).first()
        
        if not tenant_property:
            return jsonify({"error": "Unauthorized to view this tenant"}), 403
        
        # Get tenant profile
        profile = TenantProfile.query.filter_by(user_id=tenant.id).first()
        tenant_info = tenant.to_dict()
        
        # Add profile data if available
        if profile:
            tenant_info.update({
                "phone": profile.phone,
                "emergency_contact": profile.emergency_contact,
                "emergency_phone": profile.emergency_phone
            })
        
        # Get property information
        tenant_properties = TenantProperty.query.filter(
            TenantProperty.tenant_id == tenant_id,
            TenantProperty.property_id.in_(property_ids)
        ).all()
        
        property_data = []
        for tp in tenant_properties:
            property = Property.query.get(tp.property_id)
            if property:
                property_data.append({
                    "id": property.id,
                    "name": property.name,
                    "address": property.address,
                    "move_in_date": tp.move_in_date.isoformat() if tp.move_in_date else None,
                    "move_out_date": tp.move_out_date.isoformat() if tp.move_out_date else None,
                    "rent_amount": tp.rent_amount,
                    "status": tp.status
                })
        
        tenant_info["properties"] = property_data
        
        return jsonify({"tenant": tenant_info}), 200
    except Exception as e:
        logger.error(f"Error getting tenant: {str(e)}")
        return jsonify({"error": str(e)}), 500

def add_tenant():
    """Add a tenant to a property"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        # Check if user is a landlord
        user = User.query.get(current_user_id)
        if not user or user.role != 'landlord':
            return jsonify({"error": "Only landlords can add tenants"}), 403
        
        # Check required fields
        required_fields = ['email', 'property_id', 'unit_id', 'rent_amount']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Check if property belongs to this landlord
        property = Property.query.get(data['property_id'])
        if not property or property.landlord_id != current_user_id:
            return jsonify({"error": "Property not found or not owned by you"}), 404
        
        # Check if tenant exists by email
        tenant = User.query.filter_by(email=data['email']).first()
        
        if not tenant:
            # Create new user with tenant role
            tenant = User(
                email=data['email'],
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                role='tenant',
                status='pending',
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.session.add(tenant)
            db.session.flush()  # To get the tenant ID
        
        # Check if tenant is already associated with this property
        existing = TenantProperty.query.filter_by(
            tenant_id=tenant.id,
            property_id=data['property_id'],
            unit_id=data['unit_id']
        ).first()
        
        if existing:
            return jsonify({
                "error": "Tenant is already associated with this property and unit"
            }), 400
        
        # Create tenant-property association
        tenant_property = TenantProperty(
            tenant_id=tenant.id,
            property_id=data['property_id'],
            unit_id=data['unit_id'],
            rent_amount=data['rent_amount'],
            move_in_date=datetime.strptime(data['move_in_date'], '%Y-%m-%d') if 'move_in_date' in data else None,
            status='active',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.session.add(tenant_property)
        db.session.commit()
        
        return jsonify({
            "message": "Tenant added to property successfully",
            "tenant_property": {
                "id": tenant_property.id,
                "tenant_id": tenant.id,
                "property_id": data['property_id'],
                "unit_id": data['unit_id'],
                "rent_amount": data['rent_amount'],
                "status": "active"
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding tenant: {str(e)}")
        return jsonify({"error": str(e)}), 500

def remove_tenant(tenant_id, property_id):
    """Remove a tenant from a property"""
    current_user_id = get_jwt_identity()
    
    try:
        # Check if user is a landlord
        user = User.query.get(current_user_id)
        if not user or user.role != 'landlord':
            return jsonify({"error": "Only landlords can remove tenants"}), 403
        
        # Check if property belongs to this landlord
        property = Property.query.get(property_id)
        if not property or property.landlord_id != current_user_id:
            return jsonify({"error": "Property not found or not owned by you"}), 404
        
        # Check if tenant-property association exists
        tenant_property = TenantProperty.query.filter_by(
            tenant_id=tenant_id,
            property_id=property_id
        ).first()
        
        if not tenant_property:
            return jsonify({"error": "Tenant is not associated with this property"}), 404
        
        # Update the association status to 'inactive'
        tenant_property.status = 'inactive'
        tenant_property.move_out_date = datetime.utcnow()
        tenant_property.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            "message": "Tenant removed from property successfully"
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error removing tenant: {str(e)}")
        return jsonify({"error": str(e)}), 500

def update_tenant(tenant_id):
    """Update tenant information"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        # Check if user is a landlord or the tenant themselves
        user = User.query.get(current_user_id)
        if not user or (user.role != 'landlord' and current_user_id != tenant_id):
            return jsonify({"error": "Unauthorized to update tenant information"}), 403
        
        # Check if tenant exists
        tenant = User.query.filter_by(id=tenant_id, role='tenant').first()
        if not tenant:
            return jsonify({"error": "Tenant not found"}), 404
        
        # If landlord, check if tenant is associated with any of the landlord's properties
        if user.role == 'landlord':
            properties = Property.query.filter_by(landlord_id=current_user_id).all()
            property_ids = [p.id for p in properties]
            
            tenant_property = TenantProperty.query.filter(
                TenantProperty.tenant_id == tenant_id,
                TenantProperty.property_id.in_(property_ids)
            ).first()
            
            if not tenant_property:
                return jsonify({"error": "Unauthorized to update this tenant"}), 403
        
        # Update tenant user information
        if 'first_name' in data:
            tenant.first_name = data['first_name']
        if 'last_name' in data:
            tenant.last_name = data['last_name']
        if 'email' in data:
            tenant.email = data['email']
        
        tenant.updated_at = datetime.utcnow()
        
        # Update tenant profile if it exists, or create one
        profile = TenantProfile.query.filter_by(user_id=tenant.id).first()
        
        if not profile:
            profile = TenantProfile(user_id=tenant.id)
            db.session.add(profile)
        
        if 'phone' in data:
            profile.phone = data['phone']
        if 'emergency_contact' in data:
            profile.emergency_contact = data['emergency_contact']
        if 'emergency_phone' in data:
            profile.emergency_phone = data['emergency_phone']
        
        profile.updated_at = datetime.utcnow()
        
        # Update tenant-property information if provided
        if 'property_id' in data and 'rent_amount' in data:
            tenant_property = TenantProperty.query.filter_by(
                tenant_id=tenant_id,
                property_id=data['property_id']
            ).first()
            
            if tenant_property:
                tenant_property.rent_amount = data['rent_amount']
                if 'move_in_date' in data:
                    tenant_property.move_in_date = datetime.strptime(data['move_in_date'], '%Y-%m-%d')
                if 'move_out_date' in data:
                    tenant_property.move_out_date = datetime.strptime(data['move_out_date'], '%Y-%m-%d')
                tenant_property.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            "message": "Tenant information updated successfully",
            "tenant": tenant.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating tenant: {str(e)}")
        return jsonify({"error": str(e)}), 500
