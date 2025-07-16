from ..models.property import Property
from ..models.unit import Unit
from ..models.tenant_property import TenantProperty
from ..extensions import db
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

class PropertyService:
    @staticmethod
    def create_property(landlord_id, data):
        """Create a new property"""
        try:
            new_property = Property(
                landlord_id=landlord_id,
                name=data.get('name'),
                address=data.get('address'),
                city=data.get('city'),
                state=data.get('state'),
                zip_code=data.get('zip_code'),
                property_type=data.get('property_type'),
                year_built=data.get('year_built'),
                square_feet=data.get('square_feet'),
                description=data.get('description'),
                amenities=data.get('amenities'),
                status=data.get('status', 'active'),
                created_at=datetime.utcnow()
            )
            
            db.session.add(new_property)
            db.session.flush()  # Get the ID without committing yet
            
            # If units are included, create them too
            if 'units' in data and isinstance(data['units'], list):
                for unit_data in data['units']:
                    unit = Unit(
                        property_id=new_property.id,
                        unit_number=unit_data.get('unit_number'),
                        bedrooms=unit_data.get('bedrooms'),
                        bathrooms=unit_data.get('bathrooms'),
                        square_feet=unit_data.get('square_feet'),
                        rent_amount=unit_data.get('rent_amount'),
                        status=unit_data.get('status', 'available')
                    )
                    db.session.add(unit)
                    
            db.session.commit()
            return new_property, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def update_property(property_id, landlord_id, data):
        """Update property details"""
        try:
            property = Property.query.get(property_id)
            
            if not property:
                return None, "Property not found"
                
            # Verify ownership
            if property.landlord_id != landlord_id:
                return None, "Not authorized to update this property"
                
            # Update fields
            updateable_fields = [
                'name', 'address', 'city', 'state', 'zip_code', 'property_type',
                'year_built', 'square_feet', 'description', 'amenities', 'status'
            ]
            
            for field in updateable_fields:
                if field in data:
                    setattr(property, field, data[field])
                    
            property.updated_at = datetime.utcnow()
            db.session.commit()
            
            return property, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def get_property(property_id):
        """Get property by ID with unit and tenant counts"""
        try:
            property = Property.query.get(property_id)
            
            if not property:
                return None, "Property not found"
            
            # Get unit count
            unit_count = Unit.query.filter_by(property_id=property_id).count()
            
            # Get occupied unit count
            occupied_units = Unit.query.filter_by(property_id=property_id, status='occupied').count()
            
            # Get active tenant count
            tenant_count = TenantProperty.query.filter_by(property_id=property_id, status='active').count()
            
            # Add counts to property object
            property.unit_count = unit_count
            property.occupied_units = occupied_units
            property.tenant_count = tenant_count
            property.vacancy_rate = 0 if unit_count == 0 else round((1 - occupied_units / unit_count) * 100, 2)
                
            return property, None
            
        except SQLAlchemyError as e:
            return None, str(e)
    
    @staticmethod
    def get_landlord_properties(landlord_id, page=1, per_page=10, filters=None):
        """Get properties owned by a landlord with pagination"""
        try:
            query = Property.query.filter_by(landlord_id=landlord_id)
            
            # Apply filters if provided
            if filters:
                if 'status' in filters:
                    query = query.filter(Property.status == filters['status'])
                if 'city' in filters:
                    query = query.filter(Property.city == filters['city'])
                if 'search' in filters:
                    search = f"%{filters['search']}%"
                    query = query.filter(
                        (Property.name.ilike(search)) | 
                        (Property.address.ilike(search)) |
                        (Property.city.ilike(search))
                    )
            
            # Get paginated results
            paginated_props = query.paginate(page=page, per_page=per_page)
            
            # Enhance properties with additional data
            properties = []
            for prop in paginated_props.items:
                # Get counts
                unit_count = Unit.query.filter_by(property_id=prop.id).count()
                occupied_units = Unit.query.filter_by(property_id=prop.id, status='occupied').count()
                tenant_count = TenantProperty.query.filter_by(property_id=prop.id, status='active').count()
                
                # Add counts to property
                prop.unit_count = unit_count
                prop.occupied_units = occupied_units
                prop.tenant_count = tenant_count
                prop.vacancy_rate = 0 if unit_count == 0 else round((1 - occupied_units / unit_count) * 100, 2)
                
                properties.append(prop)
                
            return properties, paginated_props.total, paginated_props.pages, None
            
        except SQLAlchemyError as e:
            return [], 0, 0, str(e)
            
    @staticmethod
    def delete_property(property_id, landlord_id):
        """Delete a property"""
        try:
            property = Property.query.get(property_id)
            
            if not property:
                return False, "Property not found"
                
            # Verify ownership
            if property.landlord_id != landlord_id:
                return False, "Not authorized to delete this property"
                
            # Check if property has active tenants
            active_tenants = TenantProperty.query.filter_by(property_id=property_id, status='active').count()
            if active_tenants > 0:
                return False, "Cannot delete property with active tenants"
                
            # Delete units first
            Unit.query.filter_by(property_id=property_id).delete()
            
            # Delete property
            db.session.delete(property)
            db.session.commit()
            
            return True, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return False, str(e)