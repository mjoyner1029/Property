from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

from ..models.user import User
from ..models.landlord_profile import LandlordProfile
from ..models.tenant_profile import TenantProfile
from ..models.property import Property
from ..models.lease import Lease
from ..models.unit import Unit
from ..models.tenant_property import TenantProperty
from ..extensions import db

# This would be your actual onboarding model in a real implementation
class OnboardingProgress:
    def __init__(self, user_id, role, steps=None, current_step=None, completed=False):
        self.user_id = user_id
        self.role = role
        self.steps = steps or []
        self.current_step = current_step
        self.completed = completed
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        
    def to_dict(self):
        return {
            "user_id": self.user_id,
            "role": self.role,
            "steps": self.steps,
            "current_step": self.current_step,
            "completed": self.completed,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

@jwt_required()
def start_onboarding():
    """Initialize the onboarding process for a user"""
    identity = get_jwt_identity()
    # Normalize JWT identity to integer ID
    if isinstance(identity, dict):
        current_user_id = int(identity.get('id'))
    else:
        current_user_id = int(identity)
    
    # Print debugging info
    print(f"JWT identity: {identity}, type: {type(identity)}")
    print(f"Current user ID: {current_user_id}")
    
    try:
        # Get the user's role
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
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
            return jsonify({"error": "Invalid user role for onboarding"}), 400
            
        # Create or update onboarding progress
        # In a real implementation, you would save this to the database
        onboarding = OnboardingProgress(
            user_id=current_user_id,
            role=role,
            steps=steps,
            current_step=steps[0]["id"] if steps else None,
            completed=False
        )
        
        return jsonify({
            "message": "Onboarding started successfully",
            "onboarding": onboarding.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jwt_required()
def complete_step(step_name):
    """Mark an onboarding step as completed"""
    identity = get_jwt_identity()
    # Normalize JWT identity to integer ID
    if isinstance(identity, dict):
        current_user_id = int(identity.get('id'))
    else:
        current_user_id = int(identity)
    data = request.get_json()
    
    try:
        # Get the user's role and current onboarding progress
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        role = user.role
        
        # In a real implementation, you would fetch the onboarding progress from the database
        # For now, we'll create a sample one
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
            
        onboarding = OnboardingProgress(
            user_id=current_user_id,
            role=role,
            steps=steps,
            current_step=step_name
        )
        
        # Check if the step exists
        step_exists = False
        next_step = None
        for i, step in enumerate(onboarding.steps):
            if step["id"] == step_name:
                step_exists = True
                step["completed"] = True
                if i < len(onboarding.steps) - 1:
                    next_step = onboarding.steps[i + 1]["id"]
                break
                
        if not step_exists:
            return jsonify({"error": f"Onboarding step '{step_name}' not found"}), 404
            
        # Process step data based on step_name
        if role == 'landlord':
            if step_name == 'profile':
                # Process landlord profile data
                if not data.get('phone'):
                    return jsonify({"error": "Phone number is required for profile step"}), 400
                    
                existing_profile = LandlordProfile.query.filter_by(user_id=current_user_id).first()
                if existing_profile:
                    # Update existing profile
                    existing_profile.phone = data.get('phone')
                else:
                    # Create new profile
                    profile = LandlordProfile(
                        user_id=current_user_id,
                        phone=data.get('phone')
                    )
                    db.session.add(profile)
                    
            elif step_name == 'company':
                # Process company information
                existing_profile = LandlordProfile.query.filter_by(user_id=current_user_id).first()
                if not existing_profile:
                    return jsonify({"error": "Complete profile step first"}), 400
                    
                existing_profile.company_name = data.get('company_name')
                existing_profile.business_address = data.get('business_address')
                existing_profile.business_license_number = data.get('business_license_number')
                
            elif step_name == 'properties':
                # Process property data
                properties = data.get('properties', [])
                if not properties:
                    return jsonify({"error": "At least one property is required"}), 400
                    
                for prop in properties:
                    if not all(k in prop for k in ("name", "address", "city", "state", "zip_code")):
                        return jsonify({"error": "Incomplete property data"}), 400
                        
                    new_property = Property(
                        landlord_id=current_user_id,
                        name=prop["name"],
                        address=prop["address"],
                        city=prop["city"],
                        state=prop["state"],
                        zip_code=prop["zip_code"],
                        property_type=prop.get("property_type"),
                        bedrooms=prop.get("bedrooms"),
                        bathrooms=prop.get("bathrooms")
                    )
                    db.session.add(new_property)
                    
                    # Add units if provided
                    units = prop.get('units', [])
                    for unit_data in units:
                        if not unit_data.get('unit_number'):
                            continue
                        
                        db.session.flush()  # To get the property_id
                        unit = Unit(
                            property_id=new_property.id,
                            unit_number=unit_data.get('unit_number'),
                            bedrooms=unit_data.get('bedrooms'),
                            bathrooms=unit_data.get('bathrooms'),
                            rent_amount=unit_data.get('rent_amount')
                        )
                        db.session.add(unit)
            
            elif step_name == 'payment':
                # Process payment setup data
                # This would typically integrate with your payment provider
                pass
                
        elif role == 'tenant':
            if step_name == 'profile':
                # Process tenant profile data
                if not data.get('phone'):
                    return jsonify({"error": "Phone number is required for profile step"}), 400
                    
                existing_profile = TenantProfile.query.filter_by(user_id=current_user_id).first()
                if existing_profile:
                    # Update existing profile
                    existing_profile.phone = data.get('phone')
                else:
                    # Create new profile
                    profile = TenantProfile(
                        user_id=current_user_id,
                        phone=data.get('phone'),
                        date_of_birth=data.get('date_of_birth'),
                        employment_status=data.get('employment_status'),
                        employer=data.get('employer'),
                        emergency_contact_name=data.get('emergency_contact_name'),
                        emergency_contact_phone=data.get('emergency_contact_phone')
                    )
                    db.session.add(profile)
                    
            elif step_name == 'lease':
                # Process lease details
                if not all(k in data for k in ('property_id', 'unit_id')):
                    return jsonify({"error": "Property and unit selection is required"}), 400
                    
                # Verify property and unit exist
                property = Property.query.get(data['property_id'])
                unit = Unit.query.get(data.get('unit_id'))
                
                if not property:
                    return jsonify({"error": "Selected property not found"}), 404
                if data.get('unit_id') and not unit:
                    return jsonify({"error": "Selected unit not found"}), 404
                    
                # Create tenant-property relationship
                tenant_property = TenantProperty(
                    tenant_id=current_user_id,
                    property_id=data['property_id'],
                    unit_id=data.get('unit_id'),
                    status='pending'
                )
                db.session.add(tenant_property)
                
            elif step_name == 'payment':
                # Process payment method data
                # This would typically integrate with your payment provider
                pass
        
        # Update onboarding progress
        onboarding.current_step = next_step
        
        # Check if all steps are completed
        all_completed = all(step["completed"] for step in onboarding.steps)
        onboarding.completed = all_completed
        
        # In a real implementation, you would save the updated onboarding progress to the database
        
        db.session.commit()
        
        return jsonify({
            "message": f"Step '{step_name}' completed successfully",
            "onboarding": onboarding.to_dict()
        }), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@jwt_required()
def get_onboarding_status():
    """Get the current onboarding status for the user"""
    identity = get_jwt_identity()
    # Normalize JWT identity to integer ID
    if isinstance(identity, dict):
        current_user_id = int(identity.get('id'))
    else:
        current_user_id = int(identity)
    
    try:
        # Get the user's role
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        role = user.role
        
        # In a real implementation, you would fetch the onboarding progress from the database
        # For now, we'll check if user has completed profile setup
        
        if role == 'landlord':
            profile = LandlordProfile.query.filter_by(user_id=current_user_id).first()
            properties = Property.query.filter_by(landlord_id=current_user_id).all()
            
            steps = [
                {"id": "profile", "name": "Basic Profile", "completed": bool(profile)},
                {"id": "company", "name": "Company Information", "completed": bool(profile and profile.company_name)},
                {"id": "properties", "name": "Add Properties", "completed": bool(properties)},
                {"id": "payment", "name": "Payment Setup", "completed": False}  # Would check payment setup in real implementation
            ]
            
            current_step = None
            for step in steps:
                if not step["completed"]:
                    current_step = step["id"]
                    break
            
            completed = all(step["completed"] for step in steps)
            
        elif role == 'tenant':
            profile = TenantProfile.query.filter_by(user_id=current_user_id).first()
            tenant_property = TenantProperty.query.filter_by(tenant_id=current_user_id).first()
            
            steps = [
                {"id": "profile", "name": "Basic Profile", "completed": bool(profile)},
                {"id": "lease", "name": "Lease Details", "completed": bool(tenant_property)},
                {"id": "payment", "name": "Payment Method", "completed": False}  # Would check payment setup in real implementation
            ]
            
            current_step = None
            for step in steps:
                if not step["completed"]:
                    current_step = step["id"]
                    break
                    
            completed = all(step["completed"] for step in steps)
            
        else:
            # Admin or other roles don't have onboarding
            return jsonify({
                "message": "Onboarding not required for this role",
                "completed": True
            }), 200
        
        onboarding = OnboardingProgress(
            user_id=current_user_id,
            role=role,
            steps=steps,
            current_step=current_step,
            completed=completed
        )
        
        return jsonify(onboarding.to_dict()), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jwt_required()
def skip_step(step_name):
    """Skip an onboarding step"""
    identity = get_jwt_identity()
    # Normalize JWT identity to integer ID
    current_user_id = int(identity) if not isinstance(identity, dict) else int(identity.get('id'))
    
    try:
        # Get the user's role and current onboarding progress
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # In a real implementation, you would fetch and update the onboarding progress
        # For this example, we'll simulate the process
        
        role = user.role
        
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
            
        # Find the step to skip
        step_exists = False
        next_step = None
        for i, step in enumerate(steps):
            if step["id"] == step_name:
                step_exists = True
                step["completed"] = True
                if i < len(steps) - 1:
                    next_step = steps[i + 1]["id"]
                break
                
        if not step_exists:
            return jsonify({"error": f"Onboarding step '{step_name}' not found"}), 404
            
        # Check if this step can be skipped
        if step_name == 'profile':
            return jsonify({"error": "Profile step cannot be skipped"}), 400
            
        onboarding = OnboardingProgress(
            user_id=current_user_id,
            role=role,
            steps=steps,
            current_step=next_step,
            completed=all(step["completed"] for step in steps)
        )
        
        # In a real implementation, you would update the database
        
        return jsonify({
            "message": f"Step '{step_name}' skipped successfully",
            "onboarding": onboarding.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jwt_required()
def reset_onboarding():
    """Reset the onboarding process for a user"""
    identity = get_jwt_identity()
    # Normalize JWT identity to integer ID
    current_user_id = int(identity) if not isinstance(identity, dict) else int(identity.get('id'))
    
    try:
        # Get the user's role
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
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
            return jsonify({"error": "Invalid user role for onboarding"}), 400
            
        # Reset onboarding progress
        # In a real implementation, you would update the database
        
        onboarding = OnboardingProgress(
            user_id=current_user_id,
            role=role,
            steps=steps,
            current_step=steps[0]["id"] if steps else None,
            completed=False
        )
        
        return jsonify({
            "message": "Onboarding reset successfully",
            "onboarding": onboarding.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jwt_required()
def onboard_landlord():
    """Complete landlord onboarding in one step"""
    identity = get_jwt_identity()
    # Normalize JWT identity to integer ID
    current_user_id = int(identity) if not isinstance(identity, dict) else int(identity.get('id'))
    data = request.get_json()
    
    try:
        phone = data.get("phone")
        company = data.get("company_name")
        properties = data.get("properties", [])

        if not phone:
            return jsonify({"msg": "Phone number is required"}), 400

        # Prevent duplicate onboarding
        if LandlordProfile.query.filter_by(user_id=current_user_id).first():
            return jsonify({"msg": "Landlord already onboarded"}), 400

        profile = LandlordProfile(
            user_id=current_user_id, 
            phone=phone, 
            company_name=company
        )
        db.session.add(profile)
        db.session.flush()

        for prop in properties:
            if not all(k in prop for k in ("name", "address")):
                continue  # skip incomplete property data
            
            p = Property(
                landlord_id=current_user_id,
                name=prop["name"],
                address=prop["address"],
                city=prop.get("city", ""),
                state=prop.get("state", ""),
                zip_code=prop.get("zip_code", ""),
                unit_count=prop.get("unit_count")
            )
            db.session.add(p)

        db.session.commit()
        return jsonify({"msg": "Landlord onboarding completed"}), 201
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@jwt_required()
def onboard_tenant():
    """Complete tenant onboarding in one step"""
    identity = get_jwt_identity()
    # Normalize JWT identity to integer ID
    current_user_id = int(identity) if not isinstance(identity, dict) else int(identity.get('id'))
    data = request.get_json()
    
    try:
        phone = data.get("phone")
        property_id = data.get("property_id")
        unit_id = data.get("unit_id")
        lease_start = data.get("lease_start")
        lease_end = data.get("lease_end")
        rent = data.get("monthly_rent")
        emergency_contact = data.get("emergency_contact")

        missing = [field for field in ["phone", "property_id", "lease_start", "lease_end", "monthly_rent"] if not data.get(field)]
        if missing:
            return jsonify({"msg": f"Missing fields: {', '.join(missing)}"}), 400

        # Prevent duplicate onboarding
        if TenantProfile.query.filter_by(user_id=current_user_id).first():
            return jsonify({"msg": "Tenant already onboarded"}), 400

        profile = TenantProfile(
            user_id=current_user_id,
            phone=phone,
            emergency_contact_name=emergency_contact.get("name") if emergency_contact else None,
            emergency_contact_phone=emergency_contact.get("phone") if emergency_contact else None,
            emergency_contact_relation=emergency_contact.get("relation") if emergency_contact else None
        )
        db.session.add(profile)

        # Create tenant-property relationship
        tenant_property = TenantProperty(
            tenant_id=current_user_id,
            property_id=property_id,
            unit_id=unit_id,
            rent_amount=rent,
            status='active',
            start_date=lease_start,
            end_date=lease_end
        )
        db.session.add(tenant_property)

        lease = Lease(
            tenant_id=current_user_id,
            landlord_id=Property.query.get(property_id).landlord_id,
            property_id=property_id,
            unit_id=unit_id,
            start_date=lease_start,
            end_date=lease_end,
            rent_amount=rent,
            status='active'
        )
        db.session.add(lease)
        db.session.commit()

        return jsonify({"msg": "Tenant onboarding completed"}), 201
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500