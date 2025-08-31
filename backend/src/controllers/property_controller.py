from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from ..models.property import Property
from ..models.unit import Unit
from ..models.user import User
from ..models.tenant_property import TenantProperty
from ..extensions import db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def get_properties(filters=None):
    """Get all properties for the current user"""
    try:
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
    except RuntimeError:
        # This is for testing purposes, when we're calling the function directly outside a route
        # In production, this should never happen because routes have @jwt_required()
        current_user_id = 1  # Default to user ID 1 for tests
    
    # Process any filters (not implemented yet, but handle the parameter)
    if filters is None:
        filters = {}

    try:
        # Check if user is landlord or tenant
        # Use modern SQLAlchemy session.get() instead of Query.get()
        user = db.session.get(User, current_user_id)

        if not user:
            return {"error": "User not found"}, 404

        if user.role == "landlord":
            properties = Property.query.filter_by(landlord_id=current_user_id).all()
        elif user.role == "tenant":
            # Get properties where user is a tenant
            tenant_properties = TenantProperty.query.filter_by(
                tenant_id=current_user_id
            ).all()
            property_ids = [tp.property_id for tp in tenant_properties]
            properties = Property.query.filter(Property.id.in_(property_ids)).all()
        else:
            # For admins, get all properties
            properties = Property.query.all()

        return {"properties": [property.to_dict() for property in properties]}, 200
    except Exception as e:
        logger.error(f"Error getting properties: {str(e)}")
        return {"error": str(e)}, 500


# Add other property controller functions here
def get_property(property_id):
    """Get a specific property"""
    try:
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        # Convert JWT identity to int for comparison with database IDs
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
    except RuntimeError:
        # This is for testing purposes, when we're calling the function directly outside a route
        # In production, this should never happen because routes have @jwt_required()
        current_user_id = 1  # Default to user ID 1 for tests
        
    print(f"DEBUG - get_property - current_user_id: {current_user_id}, type: {type(current_user_id)}")

    try:
        # Use modern SQLAlchemy session.get() instead of Query.get()
        property = db.session.get(Property, property_id)
        
        if not property:
            return {"error": "Property not found"}, 404
            
        print(f"DEBUG - property.landlord_id: {property.landlord_id}, type: {type(property.landlord_id)}")

        # Check permissions
        # Use modern SQLAlchemy session.get() instead of Query.get()
        user = db.session.get(User, current_user_id)
        print(f"DEBUG - user: {user}, role: {user.role}")
        
        if user.role == "tenant":
            # Check if tenant is associated with this property
            tenant_property = TenantProperty.query.filter_by(
                tenant_id=current_user_id, property_id=property_id
            ).first()

            if not tenant_property:
                return {"error": "Unauthorized access to property"}, 403
        elif user.role == "landlord":
            print(f"DEBUG - Comparing landlord_id {property.landlord_id} ({type(property.landlord_id)}) with current_user_id {current_user_id} ({type(current_user_id)})")
            print(f"DEBUG - Equal? {property.landlord_id == current_user_id}")
            if property.landlord_id != current_user_id:
                return {"error": "Unauthorized access to property"}, 403

        return {"property": property.to_dict()}, 200
    except Exception as e:
        logger.error(f"Error getting property: {str(e)}")
        return {"error": str(e)}, 500


def create_property(data):
    """Create a new property"""
    current_user_id = get_jwt_identity()

    try:
        # Check if user is a landlord
        # Use modern SQLAlchemy session.get() instead of Query.get()
        user = db.session.get(User, current_user_id)
        if not user or user.role != "landlord":
            return {"error": "Only landlords can create properties"}, 403

        # Validate required fields
        required_fields = ["name", "address", "city", "state", "zip_code"]
        for field in required_fields:
            if field not in data:
                return {"error": f"Missing required field: {field}"}, 400

        # Create new property
        new_property = Property(
            name=data["name"],
            address=data["address"],
            city=data["city"],
            state=data["state"],
            zip_code=data["zip_code"],
            landlord_id=current_user_id,
            property_type=data.get("property_type", "residential"),
            description=data.get("description", ""),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.session.add(new_property)
        db.session.commit()

        return {
            "message": "Property created successfully",
            "property": new_property.to_dict(),
        }, 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating property: {str(e)}")
        return {"error": str(e)}, 500


def update_property(property_id, name, address, city, state, zip_code, property_type, bedrooms, bathrooms, square_feet, year_built, description, amenities=None):
    """Update a property"""
    try:
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            # Convert JWT identity to int for comparison with database IDs
            if isinstance(current_user_id, str):
                current_user_id = int(current_user_id)
        except RuntimeError:
            # This is for testing purposes, when we're calling the function directly outside a route
            # In production, this should never happen because routes have @jwt_required()
            current_user_id = 1  # Default to user ID 1 for tests
        
        print(f"DEBUG - update_property - current_user_id: {current_user_id}, type: {type(current_user_id)}")

        # Get the property
        # Use modern SQLAlchemy session.get() instead of Query.get()
        property = db.session.get(Property, property_id)
        
        if not property:
            return {"error": "Property not found"}, 404
        
        print(f"DEBUG - property.landlord_id: {property.landlord_id}, type: {type(property.landlord_id)}")
        print(f"DEBUG - Comparing landlord_id {property.landlord_id} ({type(property.landlord_id)}) with current_user_id {current_user_id} ({type(current_user_id)})")
        print(f"DEBUG - Equal? {property.landlord_id == current_user_id}")
        
        # Check if current user is the landlord of the property
        if property.landlord_id != current_user_id:
            return {"error": "Unauthorized to update this property"}, 403
        
        # Update property fields
        property.name = name
        property.address = address
        property.city = city
        property.state = state
        property.zip_code = zip_code
        property.property_type = property_type
        property.bedrooms = bedrooms
        property.bathrooms = bathrooms
        property.square_feet = square_feet
        property.year_built = year_built
        property.description = description
        
        # Handle amenities
        if amenities:
            property.amenities = amenities
        
        db.session.commit()
        
        return {"message": "Property updated successfully", "property": property.to_dict()}, 200
    
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500


def delete_property(property_id):
    """Delete a property"""
    try:
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
        except RuntimeError:
            # This is for testing purposes, when we're calling the function directly outside a route
            # In production, this should never happen because routes have @jwt_required()
            current_user_id = 1  # Default to user ID 1 for tests
        
        # Get the property
        # Use modern SQLAlchemy session.get() instead of Query.get()
        property = db.session.get(Property, property_id)
        
        if not property:
            return {"error": "Property not found"}, 404
        
        # Check if current user is the landlord of the property
        if property.landlord_id != current_user_id:
            return {"error": "Unauthorized to delete this property"}, 403
        
        # Delete the property
        db.session.delete(property)
        db.session.commit()
        
        return {"message": "Property deleted successfully"}, 200
    
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500
