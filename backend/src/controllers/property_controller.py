import logging
from src.models.property import Property
from src.extensions import db
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)


def get_all_properties(filters=None):
    """Get all properties with optional filtering."""
    try:
        query = Property.query

        # Apply filters if provided
        if filters:
            if "landlord_id" in filters:
                query = query.filter_by(landlord_id=filters["landlord_id"])
            if "city" in filters:
                query = query.filter_by(city=filters["city"])
            if "state" in filters:
                query = query.filter_by(state=filters["state"])

        props = query.all()

        return [
            {
                "id": p.id,
                "name": p.name,
                "address": p.address,
                "city": getattr(p, "city", None),
                "state": getattr(p, "state", None),
                "zip_code": getattr(p, "zip_code", None),
                "landlord_id": p.landlord_id,
            }
            for p in props
        ], 200
    except SQLAlchemyError as e:
        logger.error(f"Database error when getting properties: {str(e)}")
        return {"error": "Failed to retrieve properties"}, 500


def get_property(property_id):
    """Get a specific property by ID."""
    try:
        prop = Property.query.get(property_id)

        if not prop:
            return {"error": "Property not found"}, 404

        return {
            "id": prop.id,
            "name": prop.name,
            "address": prop.address,
            "city": getattr(prop, "city", None),
            "state": getattr(prop, "state", None),
            "zip_code": getattr(prop, "zip_code", None),
            "landlord_id": prop.landlord_id,
        }, 200
    except SQLAlchemyError as e:
        logger.error(f"Database error when getting property {property_id}: {str(e)}")
        return {"error": "Failed to retrieve property"}, 500


def create_property(data):
    """Create a new property."""
    # Validate required fields
    required_fields = ["landlord_id", "name", "address"]
    for field in required_fields:
        if field not in data:
            logger.warning(f"Property creation failed: missing {field}")
            return {"error": f"Missing required field: {field}"}, 400

    try:
        prop = Property(
            landlord_id=data["landlord_id"],
            name=data["name"],
            address=data["address"],
            city=data.get("city"),
            state=data.get("state"),
            zip_code=data.get("zip_code"),
        )
        db.session.add(prop)
        db.session.commit()

        logger.info(
            f"Property created: {data['name']} for landlord {data['landlord_id']}"
        )
        return {"message": "Property created", "id": prop.id}, 201
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Failed to create property: {str(e)}")
        return {"error": "Failed to create property"}, 500


def update_property(property_id, data):
    """Update an existing property."""
    try:
        prop = Property.query.get(property_id)

        if not prop:
            return {"error": "Property not found"}, 404

        if "name" in data:
            prop.name = data["name"]
        if "address" in data:
            prop.address = data["address"]
        if "city" in data:
            prop.city = data["city"]
        if "state" in data:
            prop.state = data["state"]
        if "zip_code" in data:
            prop.zip_code = data["zip_code"]

        db.session.commit()
        logger.info(f"Property {property_id} updated")

        return {"message": "Property updated"}, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Failed to update property: {str(e)}")
        return {"error": "Failed to update property"}, 500


def delete_property(property_id):
    """Delete a property."""
    try:
        prop = Property.query.get(property_id)

        if not prop:
            return {"error": "Property not found"}, 404

        db.session.delete(prop)
        db.session.commit()
        logger.info(f"Property {property_id} deleted")

        return {"message": "Property deleted"}, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Failed to delete property: {str(e)}")
        return {"error": "Failed to delete property"}, 500
