from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from ..models.maintenance_request import MaintenanceRequest
from ..models.user import User
from ..models.property import Property
from ..models.tenant_property import TenantProperty
from ..extensions import db
from datetime import datetime
import logging
import uuid
import os

logger = logging.getLogger(__name__)

def create_request():
    """Create a new maintenance request"""
    current_user_id = get_jwt_identity()
    
    # Handle both form and JSON data
    if request.is_json:
        data = request.json
    else:
        data = request.form
    
    try:
        # Validate required fields
        required_fields = ['property_id', 'title', 'description', 'priority']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Check if user exists
        user = db.session.get(User, current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Check property access
        property_id = int(data['property_id'])
        property = db.session.get(Property, property_id)
        
        if not property:
            return jsonify({"error": "Property not found"}), 404
        
        # Verify user has access to this property
        if user.role == 'tenant':
            # Check if tenant is associated with this property
            tenant_property = TenantProperty.query.filter_by(
                tenant_id=current_user_id,
                property_id=property_id,
                status='active'
            ).first()
            
            if not tenant_property:
                return jsonify({"error": "Tenant is not associated with this property"}), 403
        elif user.role == 'landlord':
            # Check if landlord owns this property
            if str(property.landlord_id) != str(current_user_id):
                return jsonify({"error": f"Landlord does not own this property. Property landlord_id: {property.landlord_id}, Current user ID: {current_user_id}"}), 403
        
        # Handle file upload
        photos = []
        files = request.files.getlist('photos')
        upload_folder = os.path.join(os.getcwd(), 'uploads', 'maintenance')
        
        # Create directory if it doesn't exist
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        for file in files:
            if file and file.filename:
                # Generate unique filename
                filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
                file_path = os.path.join(upload_folder, filename)
                
                # Save file
                file.save(file_path)
                photos.append(filename)
        
        # Create maintenance request
        new_request = MaintenanceRequest(
            property_id=property_id,
            unit_id=int(data['unit_id']) if 'unit_id' in data and data['unit_id'] else None,
            tenant_id=current_user_id if user.role == 'tenant' else None,  # tenant_id is nullable now
            landlord_id=property.landlord_id,
            title=data['title'],
            description=data['description'],
            priority=data['priority'],
            status='open',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.session.add(new_request)
        db.session.commit()
        
        return jsonify({
            "message": "Maintenance request created successfully",
            "request": new_request.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating maintenance request: {str(e)}")
        return jsonify({"error": str(e)}), 500

def get_requests():
    """Get all maintenance requests based on user role"""
    current_user_id = get_jwt_identity()
    
    try:
        user = db.session.get(User, current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if user.role == 'tenant':
            # Get tenant's requests
            requests = MaintenanceRequest.query.filter_by(tenant_id=current_user_id).all()
        elif user.role == 'landlord':
            # Get properties owned by this landlord
            properties = Property.query.filter_by(landlord_id=current_user_id).all()
            property_ids = [p.id for p in properties]
            
            # Get requests for these properties
            requests = MaintenanceRequest.query.filter(
                MaintenanceRequest.property_id.in_(property_ids)
            ).all()
        else:  # Admin
            # Get all requests
            requests = MaintenanceRequest.query.all()
        
        return jsonify({
            "requests": [request.to_dict() for request in requests]
        }), 200
    except Exception as e:
        logger.error(f"Error getting maintenance requests: {str(e)}")
        return jsonify({"error": str(e)}), 500

def get_request(request_id):
    """Get a specific maintenance request"""
    current_user_id = get_jwt_identity()
    
    try:
        # Check if request exists
        maintenance_request = db.session.get(MaintenanceRequest, request_id)
        if not maintenance_request:
            return jsonify({"error": "Maintenance request not found"}), 404
        
        # Check user access
        user = db.session.get(User, current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if user.role == 'tenant':
            # Tenant can only view their own requests
            if maintenance_request.tenant_id != current_user_id:
                return jsonify({"error": "Unauthorized to view this request"}), 403
        elif user.role == 'landlord':
            # Landlord can only view requests for their properties
            property = db.session.get(Property, maintenance_request.property_id)
            if not property or property.landlord_id != current_user_id:
                return jsonify({"error": "Unauthorized to view this request"}), 403
        
        return jsonify({
            "request": maintenance_request.to_dict()
        }), 200
    except Exception as e:
        logger.error(f"Error getting maintenance request: {str(e)}")
        return jsonify({"error": str(e)}), 500

def update_request(request_id):
    """Update a maintenance request"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        # Check if request exists
        maintenance_request = db.session.get(MaintenanceRequest, request_id)
        if not maintenance_request:
            return jsonify({"error": "Maintenance request not found"}), 404
        
        # Check user access
        user = db.session.get(User, current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Tenants can only update their own requests and only certain fields
        if user.role == 'tenant':
            if maintenance_request.tenant_id != current_user_id:
                return jsonify({"error": "Unauthorized to update this request"}), 403
            
            # Tenants can only update description and cancel their requests
            if 'description' in data:
                maintenance_request.description = data['description']
            
            if 'status' in data and data['status'] == 'cancelled':
                maintenance_request.status = 'cancelled'
        
        # Landlords have more permissions
        elif user.role == 'landlord':
            # Debug output to help diagnose permission issues
            logger.debug(f"Maintenance Request landlord_id: {maintenance_request.landlord_id}, Current user ID: {current_user_id}")
            
            # Check if this landlord owns the maintenance request
            if str(maintenance_request.landlord_id) != str(current_user_id):
                return jsonify({"error": "Unauthorized to update this request"}), 403
            
            # Landlords can update more fields
            if 'status' in data:
                maintenance_request.status = data['status']
            
            if 'priority' in data:
                maintenance_request.priority = data['priority']
            
            if 'assigned_to' in data:
                maintenance_request.assigned_to = data['assigned_to']
            
            if 'notes' in data:
                maintenance_request.notes = data['notes']
        
        # Admins can update anything
        elif user.role == 'admin':
            # Update allowed fields
            updateable_fields = ['status', 'priority', 'assigned_to', 'notes', 'description']
            
            for field in updateable_fields:
                if field in data:
                    setattr(maintenance_request, field, data[field])
        
        maintenance_request.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "message": "Maintenance request updated successfully",
            "request": maintenance_request.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating maintenance request: {str(e)}")
        return jsonify({"error": str(e)}), 500

def delete_request(request_id):
    """Delete a maintenance request"""
    current_user_id = get_jwt_identity()
    
    try:
        # Check if request exists
        maintenance_request = db.session.get(MaintenanceRequest, request_id)
        if not maintenance_request:
            return jsonify({"error": "Maintenance request not found"}), 404
        
        # Check user access
        user = db.session.get(User, current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Only landlords and admins can delete requests
        if user.role == 'tenant':
            return jsonify({"error": "Tenants cannot delete maintenance requests"}), 403
        elif user.role == 'landlord':
            property = db.session.get(Property, maintenance_request.property_id)
            if not property or property.landlord_id != current_user_id:
                return jsonify({"error": "Unauthorized to delete this request"}), 403
        
        # Delete request
        db.session.delete(maintenance_request)
        db.session.commit()
        
        return jsonify({
            "message": "Maintenance request deleted successfully"
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting maintenance request: {str(e)}")
        return jsonify({"error": str(e)}), 500

def get_tenant_requests(tenant_id=None):
    """Get all maintenance requests for a specific tenant"""
    current_user_id = get_jwt_identity()
    
    try:
        # Check if user is authorized
        user = db.session.get(User, current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # If no tenant_id provided, use current user
        if tenant_id is None:
            if user.role == 'tenant':
                tenant_id = current_user_id
            else:
                return jsonify({"error": "Tenant ID required for non-tenant users"}), 400
        
        # Only landlords and admins can view tenant requests
        if user.role == 'tenant' and current_user_id != tenant_id:
            return jsonify({"error": "Unauthorized to view these requests"}), 403
        
        # Check if tenant exists
        tenant = User.query.filter_by(id=tenant_id, role='tenant').first()
        if not tenant:
            return jsonify({"error": "Tenant not found"}), 404
        
        # If landlord, check if tenant is in one of their properties
        if user.role == 'landlord':
            properties = Property.query.filter_by(landlord_id=current_user_id).all()
            property_ids = [p.id for p in properties]
            
            tenant_property = TenantProperty.query.filter(
                TenantProperty.tenant_id == tenant_id,
                TenantProperty.property_id.in_(property_ids)
            ).first()
            
            if not tenant_property:
                return jsonify({"error": "Tenant is not associated with your properties"}), 403
        
        # Get tenant's requests
        requests = MaintenanceRequest.query.filter_by(tenant_id=tenant_id).all()
        
        return jsonify({
            "requests": [request.to_dict() for request in requests]
        }), 200
    except Exception as e:
        logger.error(f"Error getting tenant maintenance requests: {str(e)}")
        return jsonify({"error": str(e)}), 500

def get_landlord_requests():
    """Get all maintenance requests for a landlord's properties"""
    current_user_id = get_jwt_identity()
    
    try:
        # Check if user is a landlord
        user = db.session.get(User, current_user_id)
        if not user or user.role != 'landlord':
            return jsonify({"error": "Only landlords can access this endpoint"}), 403
        
        # Get properties owned by this landlord
        properties = Property.query.filter_by(landlord_id=current_user_id).all()
        property_ids = [p.id for p in properties]
        
        # Get requests for these properties
        requests = MaintenanceRequest.query.filter(
            MaintenanceRequest.property_id.in_(property_ids)
        ).all()
        
        return jsonify({
            "requests": [request.to_dict() for request in requests]
        }), 200
    except Exception as e:
        logger.error(f"Error getting landlord maintenance requests: {str(e)}")
        return jsonify({"error": str(e)}), 500

def assign_request(request_id):
    """Assign a maintenance request to someone"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        # Check if request exists
        maintenance_request = db.session.get(MaintenanceRequest, request_id)
        if not maintenance_request:
            return jsonify({"error": "Maintenance request not found"}), 404
        
        # Check if user is authorized
        user = db.session.get(User, current_user_id)
        if not user or user.role not in ['landlord', 'admin']:
            return jsonify({"error": "Unauthorized to assign maintenance requests"}), 403
        
        # Check if property belongs to landlord
        if user.role == 'landlord':
            property = db.session.get(Property, maintenance_request.property_id)
            if not property or property.landlord_id != current_user_id:
                return jsonify({"error": "Unauthorized to assign this request"}), 403
        
        # Check if assigned_to field is provided
        if 'assigned_to' not in data:
            return jsonify({"error": "Missing assigned_to field"}), 400
        
        # Update the request
        maintenance_request.assigned_to = data['assigned_to']
        maintenance_request.status = 'in_progress'
        maintenance_request.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            "message": "Maintenance request assigned successfully",
            "request": maintenance_request.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error assigning maintenance request: {str(e)}")
        return jsonify({"error": str(e)}), 500

def complete_request(request_id):
    """Mark a maintenance request as completed"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        # Check if request exists
        maintenance_request = db.session.get(MaintenanceRequest, request_id)
        if not maintenance_request:
            return jsonify({"error": "Maintenance request not found"}), 404
        
        # Check if user is authorized
        user = db.session.get(User, current_user_id)
        if not user or user.role not in ['landlord', 'admin']:
            return jsonify({"error": "Unauthorized to complete maintenance requests"}), 403
        
        # Check if property belongs to landlord
        if user.role == 'landlord':
            # Add debug logging
            logger.debug(f"Maintenance Request landlord_id: {maintenance_request.landlord_id}, Current user ID: {current_user_id}")
            
            # Check if this landlord owns the maintenance request
            if str(maintenance_request.landlord_id) != str(current_user_id):
                return jsonify({"error": "Unauthorized to complete this request"}), 403
        
        # Update the request
        maintenance_request.status = 'completed'
        maintenance_request.notes = data.get('notes', maintenance_request.notes)  # Use 'notes' from request
        maintenance_request.completed_at = datetime.utcnow()
        maintenance_request.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            "message": "Maintenance request completed successfully",
            "request": maintenance_request.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error completing maintenance request: {str(e)}")
        return jsonify({"error": str(e)}), 500
