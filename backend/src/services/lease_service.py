from ..models.lease import Lease
from ..models.property import Property
from ..models.unit import Unit
from ..models.tenant_property import TenantProperty
from ..models.user import User
from ..extensions import db
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta

class LeaseService:
    @staticmethod
    def create_lease(landlord_id, data):
        """Create a new lease agreement"""
        try:
            # Validate required fields
            required_fields = ['tenant_id', 'property_id', 'start_date', 'end_date', 'rent_amount']
            for field in required_fields:
                if field not in data:
                    return None, f"Missing required field: {field}"
            
            # Verify property ownership
            property = Property.query.get(data['property_id'])
            if not property or property.landlord_id != landlord_id:
                return None, "Property not found or not owned by you"
            
            # Parse dates
            try:
                start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
                end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
                
                if start_date >= end_date:
                    return None, "End date must be after start date"
            except ValueError:
                return None, "Invalid date format. Use YYYY-MM-DD"
            
            # Check if unit is available if specified
            if 'unit_id' in data and data['unit_id']:
                unit = Unit.query.get(data['unit_id'])
                if not unit or unit.property_id != data['property_id']:
                    return None, "Unit not found or does not belong to this property"
                
                # Check if unit is already occupied
                existing_lease = Lease.query.filter_by(
                    unit_id=data['unit_id'],
                    status='active'
                ).first()
                
                if existing_lease and existing_lease.tenant_id != data['tenant_id']:
                    return None, "This unit is already occupied by another tenant"
            
            # Create lease
            lease = Lease(
                tenant_id=data['tenant_id'],
                landlord_id=landlord_id,
                property_id=data['property_id'],
                unit_id=data.get('unit_id'),
                start_date=start_date,
                end_date=end_date,
                rent_amount=data['rent_amount'],
                security_deposit=data.get('security_deposit'),
                status='pending',
                payment_day=data.get('payment_day', 1),  # Default to 1st of month
                rent_cycle=data.get('rent_cycle', 'monthly'),
                created_at=datetime.utcnow(),
                terms=data.get('terms')
            )
            
            db.session.add(lease)
            db.session.flush()
            
            # Create or update tenant-property relationship
            tenant_property = TenantProperty.query.filter_by(
                tenant_id=data['tenant_id'],
                property_id=data['property_id']
            ).first()
            
            if tenant_property:
                tenant_property.unit_id = data.get('unit_id')
                tenant_property.status = 'pending'
                tenant_property.rent_amount = data['rent_amount']
            else:
                tenant_property = TenantProperty(
                    tenant_id=data['tenant_id'],
                    property_id=data['property_id'],
                    unit_id=data.get('unit_id'),
                    status='pending',
                    rent_amount=data['rent_amount'],
                    start_date=start_date,
                    end_date=end_date
                )
                db.session.add(tenant_property)
            
            db.session.commit()
            return lease, None
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def accept_lease(lease_id, tenant_id):
        """Tenant accepts a lease agreement"""
        try:
            lease = Lease.query.get(lease_id)
            
            if not lease:
                return False, "Lease not found"
            
            # Verify tenant is associated with this lease
            if lease.tenant_id != tenant_id:
                return False, "Not authorized to accept this lease"
            
            # Verify lease is in pending status
            if lease.status != 'pending':
                return False, "Lease cannot be accepted in its current status"
            
            # Update lease status
            lease.status = 'active'
            lease.accepted_at = datetime.utcnow()
            lease.updated_at = datetime.utcnow()
            
            # Update tenant-property relationship
            tenant_property = TenantProperty.query.filter_by(
                tenant_id=tenant_id,
                property_id=lease.property_id
            ).first()
            
            if tenant_property:
                tenant_property.status = 'active'
                tenant_property.start_date = lease.start_date
                tenant_property.end_date = lease.end_date
            
            # Update unit status if applicable
            if lease.unit_id:
                unit = Unit.query.get(lease.unit_id)
                if unit:
                    unit.status = 'occupied'
                    unit.tenant_id = tenant_id
            
            db.session.commit()
            return True, None
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return False, str(e)
    
    @staticmethod
    def terminate_lease(lease_id, user_id, is_landlord, data):
        """Terminate a lease agreement"""
        try:
            lease = Lease.query.get(lease_id)
            
            if not lease:
                return False, "Lease not found"
            
            # Verify user is associated with this lease
            if is_landlord and lease.landlord_id != user_id:
                return False, "Not authorized to terminate this lease"
            elif not is_landlord and lease.tenant_id != user_id:
                return False, "Not authorized to terminate this lease"
            
            # Verify lease is active
            if lease.status != 'active':
                return False, "Only active leases can be terminated"
            
            # Update lease status
            lease.status = 'terminated'
            lease.termination_date = datetime.utcnow().date()
            lease.termination_reason = data.get('reason')
            lease.updated_at = datetime.utcnow()
            
            # Update tenant-property relationship
            tenant_property = TenantProperty.query.filter_by(
                tenant_id=lease.tenant_id,
                property_id=lease.property_id
            ).first()
            
            if tenant_property:
                tenant_property.status = 'inactive'
                tenant_property.end_date = datetime.utcnow().date()
            
            # Update unit status if applicable
            if lease.unit_id:
                unit = Unit.query.get(lease.unit_id)
                if unit:
                    unit.status = 'available'
                    unit.tenant_id = None
            
            db.session.commit()
            return True, None
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return False, str(e)
    
    @staticmethod
    def renew_lease(lease_id, landlord_id, data):
        """Renew an existing lease"""
        try:
            original_lease = Lease.query.get(lease_id)
            
            if not original_lease:
                return None, "Original lease not found"
            
            # Verify landlord owns this lease
            if original_lease.landlord_id != landlord_id:
                return None, "Not authorized to renew this lease"
            
            # Parse dates
            try:
                start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
                end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
                
                if start_date >= end_date:
                    return None, "End date must be after start date"
            except (ValueError, KeyError):
                return None, "Invalid date format or missing dates"
            
            # Create new lease
            new_lease = Lease(
                tenant_id=original_lease.tenant_id,
                landlord_id=landlord_id,
                property_id=original_lease.property_id,
                unit_id=original_lease.unit_id,
                start_date=start_date,
                end_date=end_date,
                rent_amount=data.get('rent_amount', original_lease.rent_amount),
                security_deposit=data.get('security_deposit', original_lease.security_deposit),
                status='pending',
                payment_day=data.get('payment_day', original_lease.payment_day),
                rent_cycle=data.get('rent_cycle', original_lease.rent_cycle),
                created_at=datetime.utcnow(),
                terms=data.get('terms', original_lease.terms),
                previous_lease_id=lease_id
            )
            
            db.session.add(new_lease)
            db.session.commit()
            
            return new_lease, None
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, str(e)