from ..models.user import User
from ..models.tenant_profile import TenantProfile
from ..models.landlord_profile import LandlordProfile
from ..models.property import Property
from ..models.unit import Unit
from ..models.lease import Lease
from ..models.tenant_property import TenantProperty
from ..models.onboarding_progress import OnboardingProgress
from ..extensions import db
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

class OnboardingService:
    @staticmethod
    def start_onboarding(user_id):
        """Initialize the onboarding process for a user"""
        try:
            # Get the user's role
            user = User.query.get(user_id)
            if not user:
                return None, "User not found"
            
            role = user.role
            
            # Define onboarding steps based on user role
            steps = []
            if role == 'landlord':
                steps = [
                    {"id": "profile", "name": "Basic Profile", "completed": False},
                    {"id": "company", "name": "Company Information", "completed": False},
                    {"id": "properties", "name": "Add Properties", "completed": False},
                    {"id": "payment", "name": "Payment Setup", "completed": False}
                ]
            elif role == 'tenant':
                steps = [
                    {"id": "profile", "name": "Basic Profile", "completed": False},
                    {"id": "lease", "name": "Lease Details", "completed": False},
                    {"id": "payment", "name": "Payment Method", "completed": False}
                ]
            else:
                return None, "Invalid user role for onboarding"
            
            # Check if onboarding record already exists
            existing = OnboardingProgress.query.filter_by(user_id=user_id).first()
            
            if existing:
                # Update existing record
                existing.steps = steps
                existing.current_step = steps[0]["id"] if steps else None
                existing.completed = False
                existing.updated_at = datetime.utcnow()
                onboarding = existing
            else:
                # Create new onboarding record
                onboarding = OnboardingProgress(
                    user_id=user_id,
                    role=role,
                    steps=steps,
                    current_step=steps[0]["id"] if steps else None,
                    completed=False,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.session.add(onboarding)
            
            db.session.commit()
            return onboarding, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def onboard_landlord(user_id, data):
        """Complete landlord onboarding in one step"""
        try:
            # Validate required data
            if not data.get('phone'):
                return False, "Phone number is required"
            
            # Create landlord profile
            landlord_profile = LandlordProfile.query.filter_by(user_id=user_id).first()
            
            if not landlord_profile:
                landlord_profile = LandlordProfile(
                    user_id=user_id,
                    phone=data.get('phone'),
                    company_name=data.get('company_name'),
                    business_address=data.get('business_address'),
                    business_license_number=data.get('business_license_number')
                )
                db.session.add(landlord_profile)
            else:
                # Update existing profile
                landlord_profile.phone = data.get('phone')
                landlord_profile.company_name = data.get('company_name')
                landlord_profile.business_address = data.get('business_address')
                landlord_profile.business_license_number = data.get('business_license_number')
            
            # Process properties if provided
            properties = data.get('properties', [])
            for prop_data in properties:
                if not all(k in prop_data for k in ('name', 'address')):
                    continue
                
                # Create property
                new_property = Property(
                    landlord_id=user_id,
                    name=prop_data.get('name'),
                    address=prop_data.get('address'),
                    city=prop_data.get('city', ''),
                    state=prop_data.get('state', ''),
                    zip_code=prop_data.get('zip_code', ''),
                    property_type=prop_data.get('property_type', 'residential'),
                    created_at=datetime.utcnow()
                )
                db.session.add(new_property)
                db.session.flush()
                
                # Create units if provided
                units = prop_data.get('units', [])
                for unit_data in units:
                    if not unit_data.get('unit_number'):
                        continue
                    
                    unit = Unit(
                        property_id=new_property.id,
                        unit_number=unit_data.get('unit_number'),
                        bedrooms=unit_data.get('bedrooms'),
                        bathrooms=unit_data.get('bathrooms'),
                        square_feet=unit_data.get('square_feet'),
                        rent_amount=unit_data.get('rent_amount'),
                        status='available',
                        created_at=datetime.utcnow()
                    )
                    db.session.add(unit)
            
            # Mark onboarding as complete
            onboarding = OnboardingProgress.query.filter_by(user_id=user_id).first()
            
            if onboarding:
                for step in onboarding.steps:
                    step["completed"] = True
                
                onboarding.completed = True
                onboarding.updated_at = datetime.utcnow()
                onboarding.current_step = None
            else:
                # Create completed onboarding record
                steps = [
                    {"id": "profile", "name": "Basic Profile", "completed": True},
                    {"id": "company", "name": "Company Information", "completed": True},
                    {"id": "properties", "name": "Add Properties", "completed": True},
                    {"id": "payment", "name": "Payment Setup", "completed": True}
                ]
                
                onboarding = OnboardingProgress(
                    user_id=user_id,
                    role='landlord',
                    steps=steps,
                    current_step=None,
                    completed=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.session.add(onboarding)
            
            db.session.commit()
            return True, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return False, str(e)
    
    @staticmethod
    def onboard_tenant(user_id, data):
        """Complete tenant onboarding in one step"""
        try:
            # Validate required data
            if not data.get('phone'):
                return False, "Phone number is required"
            
            # Create tenant profile
            tenant_profile = TenantProfile.query.filter_by(user_id=user_id).first()
            
            if not tenant_profile:
                tenant_profile = TenantProfile(
                    user_id=user_id,
                    phone=data.get('phone'),
                    date_of_birth=data.get('date_of_birth'),
                    employment_status=data.get('employment_status'),
                    employer=data.get('employer'),
                    emergency_contact_name=data.get('emergency_contact_name'),
                    emergency_contact_phone=data.get('emergency_contact_phone'),
                    emergency_contact_relation=data.get('emergency_contact_relation')
                )
                db.session.add(tenant_profile)
            else:
                # Update existing profile
                tenant_profile.phone = data.get('phone')
                tenant_profile.date_of_birth = data.get('date_of_birth')
                tenant_profile.employment_status = data.get('employment_status')
                tenant_profile.employer = data.get('employer')
                tenant_profile.emergency_contact_name = data.get('emergency_contact_name')
                tenant_profile.emergency_contact_phone = data.get('emergency_contact_phone')
                tenant_profile.emergency_contact_relation = data.get('emergency_contact_relation')
            
            # Process property and lease information if provided
            property_id = data.get('property_id')
            unit_id = data.get('unit_id')
            
            if property_id:
                # Verify property exists
                property = Property.query.get(property_id)
                if property:
                    # Create tenant-property relationship
                    tenant_property = TenantProperty.query.filter_by(
                        tenant_id=user_id,
                        property_id=property_id
                    ).first()
                    
                    if not tenant_property:
                        tenant_property = TenantProperty(
                            tenant_id=user_id,
                            property_id=property_id,
                            unit_id=unit_id,
                            status='pending',
                            rent_amount=data.get('monthly_rent'),
                            start_date=data.get('lease_start'),
                            end_date=data.get('lease_end')
                        )
                        db.session.add(tenant_property)
            
            # Mark onboarding as complete
            onboarding = OnboardingProgress.query.filter_by(user_id=user_id).first()
            
            if onboarding:
                for step in onboarding.steps:
                    step["completed"] = True
                
                onboarding.completed = True
                onboarding.updated_at = datetime.utcnow()
                onboarding.current_step = None
            else:
                # Create completed onboarding record
                steps = [
                    {"id": "profile", "name": "Basic Profile", "completed": True},
                    {"id": "lease", "name": "Lease Details", "completed": True},
                    {"id": "payment", "name": "Payment Method", "completed": True}
                ]
                
                onboarding = OnboardingProgress(
                    user_id=user_id,
                    role='tenant',
                    steps=steps,
                    current_step=None,
                    completed=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.session.add(onboarding)
            
            db.session.commit()
            return True, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return False, str(e)