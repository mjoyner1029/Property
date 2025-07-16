import logging
from sqlalchemy.exc import SQLAlchemyError
from src.models.tenant_profile import TenantProfile
from src.extensions import db

logger = logging.getLogger(__name__)

def get_all_tenants(filters=None):
    """Get all tenants with optional filtering."""
    try:
        query = TenantProfile.query
        
        # Apply filters if provided
        if filters:
            if 'property_id' in filters:
                query = query.filter_by(property_id=filters['property_id'])
            if 'user_id' in filters:
                query = query.filter_by(user_id=filters['user_id'])
            
        tenants = query.all()
        
        return [{
            "id": t.id,
            "user_id": t.user_id,
            "property_id": t.property_id,
            "lease_start": t.lease_start.isoformat() if t.lease_start else None,
            "lease_end": t.lease_end.isoformat() if t.lease_end else None
        } for t in tenants], 200
    except SQLAlchemyError as e:
        logger.error(f"Database error when getting tenants: {str(e)}")
        return {"error": "Failed to retrieve tenants"}, 500

def get_tenant(tenant_id):
    """Get a specific tenant by ID."""
    try:
        tenant = TenantProfile.query.get(tenant_id)
        
        if not tenant:
            return {"error": "Tenant not found"}, 404
            
        return {
            "id": tenant.id,
            "user_id": tenant.user_id,
            "property_id": tenant.property_id,
            "lease_start": tenant.lease_start.isoformat() if tenant.lease_start else None,
            "lease_end": tenant.lease_end.isoformat() if tenant.lease_end else None
        }, 200
    except SQLAlchemyError as e:
        logger.error(f"Database error when getting tenant {tenant_id}: {str(e)}")
        return {"error": "Failed to retrieve tenant"}, 500

def create_tenant(data):
    """Create a new tenant profile."""
    # Validate required fields
    if "user_id" not in data:
        logger.warning("Tenant creation failed: missing user_id")
        return {"error": "Missing required field: user_id"}, 400
    
    try:
        tenant = TenantProfile(
            user_id=data["user_id"],
            property_id=data.get("property_id"),
            lease_start=data.get("lease_start"),
            lease_end=data.get("lease_end")
        )
        db.session.add(tenant)
        db.session.commit()
        
        logger.info(f"Tenant profile created for user {data['user_id']}")
        return {"message": "Tenant created", "id": tenant.id}, 201
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Failed to create tenant: {str(e)}")
        return {"error": "Failed to create tenant"}, 500

def update_tenant(tenant_id, data):
    """Update an existing tenant profile."""
    try:
        tenant = TenantProfile.query.get(tenant_id)
        
        if not tenant:
            return {"error": "Tenant not found"}, 404
            
        if "property_id" in data:
            tenant.property_id = data["property_id"]
        if "lease_start" in data:
            tenant.lease_start = data["lease_start"]
        if "lease_end" in data:
            tenant.lease_end = data["lease_end"]
            
        db.session.commit()
        logger.info(f"Tenant {tenant_id} updated")
        
        return {"message": "Tenant updated"}, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Failed to update tenant: {str(e)}")
        return {"error": "Failed to update tenant"}, 500

def delete_tenant(tenant_id):
    """Delete a tenant profile."""
    try:
        tenant = TenantProfile.query.get(tenant_id)
        
        if not tenant:
            return {"error": "Tenant not found"}, 404
            
        db.session.delete(tenant)
        db.session.commit()
        logger.info(f"Tenant {tenant_id} deleted")
        
        return {"message": "Tenant deleted"}, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Failed to delete tenant: {str(e)}")
        return {"error": "Failed to delete tenant"}, 500

def get_tenant_by_user_id(user_id):
    """Get tenant profile by user_id."""
    try:
        tenant = TenantProfile.query.filter_by(user_id=user_id).first()
        
        if not tenant:
            return {"error": "Tenant not found"}, 404
            
        return {
            "id": tenant.id,
            "user_id": tenant.user_id,
            "property_id": tenant.property_id,
            "lease_start": tenant.lease_start.isoformat() if tenant.lease_start else None,
            "lease_end": tenant.lease_end.isoformat() if tenant.lease_end else None
        }, 200
    except SQLAlchemyError as e:
        logger.error(f"Database error when getting tenant by user_id {user_id}: {str(e)}")
        return {"error": "Failed to retrieve tenant"}, 500
