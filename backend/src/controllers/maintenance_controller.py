import logging
from src.models.maintenance_request import MaintenanceRequest
from src.extensions import db
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

def get_all_requests(filters=None):
    """Get all maintenance requests with optional filtering."""
    try:
        query = MaintenanceRequest.query
        
        # Apply filters if provided
        if filters:
            if 'property_id' in filters:
                query = query.filter_by(property_id=filters['property_id'])
            if 'tenant_id' in filters:
                query = query.filter_by(tenant_id=filters['tenant_id'])
            if 'status' in filters:
                query = query.filter_by(status=filters['status'])
                
        requests = query.all()
        
        return [{
            "id": r.id,
            "tenant_id": r.tenant_id,
            "property_id": r.property_id,
            "description": r.description,
            "status": r.status,
            "created_at": r.created_at.isoformat()
        } for r in requests], 200
    except SQLAlchemyError as e:
        logger.error(f"Database error when getting maintenance requests: {str(e)}")
        return {"error": "Failed to retrieve maintenance requests"}, 500

def create_maintenance_request(data):
    """Create a new maintenance request."""
    # Validate required fields
    required_fields = ["tenant_id", "property_id", "description"]
    for field in required_fields:
        if field not in data:
            return {"error": f"Missing required field: {field}"}, 400
    
    try:
        req = MaintenanceRequest(
            tenant_id=data["tenant_id"],
            property_id=data["property_id"],
            description=data["description"],
            status="pending"  # Set default status
        )
        db.session.add(req)
        db.session.commit()
        
        logger.info(f"Maintenance request created for property {data['property_id']}")
        return {
            "message": "Maintenance request created",
            "id": req.id
        }, 201
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Failed to create maintenance request: {str(e)}")
        return {"error": "Failed to create maintenance request"}, 500

def update_maintenance_request(request_id, data):
    """Update an existing maintenance request."""
    try:
        request = MaintenanceRequest.query.get(request_id)
        
        if not request:
            return {"error": "Maintenance request not found"}, 404
            
        if "status" in data:
            request.status = data["status"]
        if "description" in data:
            request.description = data["description"]
            
        db.session.commit()
        logger.info(f"Maintenance request {request_id} updated")
        
        return {"message": "Maintenance request updated"}, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Failed to update maintenance request: {str(e)}")
        return {"error": "Failed to update maintenance request"}, 500

def delete_maintenance_request(request_id):
    """Delete a maintenance request."""
    try:
        request = MaintenanceRequest.query.get(request_id)
        
        if not request:
            return {"error": "Maintenance request not found"}, 404
            
        db.session.delete(request)
        db.session.commit()
        logger.info(f"Maintenance request {request_id} deleted")
        
        return {"message": "Maintenance request deleted"}, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Failed to delete maintenance request: {str(e)}")
        return {"error": "Failed to delete maintenance request"}, 500
