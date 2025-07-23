from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from ..models.property import Property
from ..models.unit import Unit
from ..models.user import User
from ..models.tenant_property import TenantProperty
from ..extensions import db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def get_properties():
    """Get all properties for the current user"""
    current_user_id = get_jwt_identity()

    try:
        # Check if user is landlord or tenant
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

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

        return (
            jsonify({"properties": [property.to_dict() for property in properties]}),
            200,
        )
    except Exception as e:
        logger.error(f"Error getting properties: {str(e)}")
        return jsonify({"error": str(e)}), 500


# Add other property controller functions here
def get_property(property_id):
    """Get a specific property"""
    current_user_id = get_jwt_identity()

    try:
        property = Property.query.get(property_id)

        if not property:
            return jsonify({"error": "Property not found"}), 404

        # Check permissions
        user = User.query.get(current_user_id)
        if user.role == "tenant":
            # Check if tenant is associated with this property
            tenant_property = TenantProperty.query.filter_by(
                tenant_id=current_user_id, property_id=property_id
            ).first()

            if not tenant_property:
                return jsonify({"error": "Unauthorized access to property"}), 403
        elif user.role == "landlord" and property.landlord_id != current_user_id:
            return jsonify({"error": "Unauthorized access to property"}), 403

        return jsonify({"property": property.to_dict()}), 200
    except Exception as e:
        logger.error(f"Error getting property: {str(e)}")
        return jsonify({"error": str(e)}), 500


def create_property():
    """Create a new property"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    try:
        # Check if user is a landlord
        user = User.query.get(current_user_id)
        if not user or user.role != "landlord":
            return jsonify({"error": "Only landlords can create properties"}), 403

        # Validate required fields
        required_fields = ["name", "address", "city", "state", "zip_code"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

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

        return (
            jsonify(
                {
                    "message": "Property created successfully",
                    "property": new_property.to_dict(),
                }
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating property: {str(e)}")
        return jsonify({"error": str(e)}), 500


def update_property(property_id):
    """Update a property"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    try:
        # Check if property exists
        property = Property.query.get(property_id)
        if not property:
            return jsonify({"error": "Property not found"}), 404

        # Check if user is authorized to update this property
        if property.landlord_id != current_user_id:
            return jsonify({"error": "Unauthorized to update this property"}), 403

        # Update property fields
        if "name" in data:
            property.name = data["name"]
        if "address" in data:
            property.address = data["address"]
        if "city" in data:
            property.city = data["city"]
        if "state" in data:
            property.state = data["state"]
        if "zip_code" in data:
            property.zip_code = data["zip_code"]
        if "property_type" in data:
            property.property_type = data["property_type"]
        if "description" in data:
            property.description = data["description"]

        property.updated_at = datetime.utcnow()

        db.session.commit()

        return (
            jsonify(
                {
                    "message": "Property updated successfully",
                    "property": property.to_dict(),
                }
            ),
            200,
        )
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating property: {str(e)}")
        return jsonify({"error": str(e)}), 500


def delete_property(property_id):
    """Delete a property"""
    current_user_id = get_jwt_identity()

    try:
        # Check if property exists
        property = Property.query.get(property_id)
        if not property:
            return jsonify({"error": "Property not found"}), 404

        # Check if user is authorized to delete this property
        if property.landlord_id != current_user_id:
            return jsonify({"error": "Unauthorized to delete this property"}), 403

        # Check if property has units
        units = Unit.query.filter_by(property_id=property_id).all()
        if units:
            return jsonify(
                {
                    "error": "Cannot delete property with existing units. Delete units first."
                }
            ), 400

        # Delete property
        db.session.delete(property)
        db.session.commit()

        return jsonify({"message": "Property deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting property: {str(e)}")
        return jsonify({"error": str(e)}), 500
