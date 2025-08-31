from ..models.maintenance_request import MaintenanceRequest
from ..models.property import Property
from ..models.tenant_property import TenantProperty
from ..extensions import db
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

class MaintenanceService:
    @staticmethod
    def create_request(tenant_id, data):
        """Create a maintenance request"""
        try:
            # Validate required fields
            property_id = data.get('property_id')
            if not property_id:
                return None, "Property ID is required"
                
            # Verify tenant is associated with this property
            tenant_property = TenantProperty.query.filter_by(
                tenant_id=tenant_id,
                property_id=property_id,
                status='active'
            ).first()
            
            if not tenant_property:
                return None, "You are not registered as a tenant for this property"
                
            # Get landlord ID from property
            property = db.session.get(Property, property_id)
            if not property:
                return None, "Property not found"
                
            # Create maintenance request
            request = MaintenanceRequest(
                tenant_id=tenant_id,
                landlord_id=property.landlord_id,
                property_id=property_id,
                unit_id=tenant_property.unit_id,
                title=data.get('title'),
                description=data.get('description'),
                priority=data.get('priority', 'medium'),
                status='open',
                created_at=datetime.utcnow()
            )
            
            db.session.add(request)
            db.session.commit()
            
            return request, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def update_request(request_id, user_id, is_landlord, data):
        """Update a maintenance request"""
        try:
            request = db.session.get(MaintenanceRequest, request_id)
            
            if not request:
                return None, "Maintenance request not found"
                
            # Verify user is associated with this request
            if is_landlord and request.landlord_id != user_id:
                return None, "Not authorized to update this request"
            elif not is_landlord and request.tenant_id != user_id:
                return None, "Not authorized to update this request"
                
            # Update allowed fields
            if 'title' in data and not is_landlord:  # Only tenant can update title
                request.title = data['title']
                
            if 'description' in data and not is_landlord:  # Only tenant can update description
                request.description = data['description']
                
            if 'priority' in data:
                request.priority = data['priority']
                
            if 'status' in data and is_landlord:  # Only landlord can update status
                request.status = data['status']
                
                if data['status'] == 'completed':
                    request.completed_at = datetime.utcnow()
                    
            if 'assigned_to' in data and is_landlord:  # Only landlord can assign
                request.assigned_to = data['assigned_to']
                
            if 'notes' in data:
                request.notes = data['notes']
                
            request.updated_at = datetime.utcnow()
            db.session.commit()
            
            return request, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def get_tenant_requests(tenant_id, page=1, per_page=10, status=None):
        """Get maintenance requests for a tenant"""
        try:
            query = MaintenanceRequest.query.filter_by(tenant_id=tenant_id)
            
            if status:
                query = query.filter_by(status=status)
                
            # Order by most recent first
            query = query.order_by(MaintenanceRequest.created_at.desc())
            
            # Paginate results
            paginated_requests = query.paginate(page=page, per_page=per_page)
            
            return paginated_requests.items, paginated_requests.total, paginated_requests.pages, None
            
        except SQLAlchemyError as e:
            return [], 0, 0, str(e)
    
    @staticmethod
    def get_landlord_requests(landlord_id, page=1, per_page=10, status=None, property_id=None):
        """Get maintenance requests for a landlord"""
        try:
            query = MaintenanceRequest.query.filter_by(landlord_id=landlord_id)
            
            if status:
                query = query.filter_by(status=status)
                
            if property_id:
                query = query.filter_by(property_id=property_id)
                
            # Order by priority and creation date
            query = query.order_by(
                MaintenanceRequest.status != 'open',  # Open requests first
                MaintenanceRequest.priority.in_(['emergency', 'high', 'medium', 'low']),  # Then by priority
                MaintenanceRequest.created_at.desc()  # Then by date (newest first)
            )
            
            # Paginate results
            paginated_requests = query.paginate(page=page, per_page=per_page)
            
            return paginated_requests.items, paginated_requests.total, paginated_requests.pages, None
            
        except SQLAlchemyError as e:
            return [], 0, 0, str(e)