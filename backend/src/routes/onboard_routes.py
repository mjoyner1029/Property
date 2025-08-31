from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.extensions import db
from src.models.landlord_profile import LandlordProfile
from src.models.tenant_profile import TenantProfile
from src.models.property import Property
from src.models.property_code import PropertyCode
from src.models.user import User
from src.models.lease import Lease
from ..controllers.onboarding_controller import (
    start_onboarding, get_onboarding_status,
    skip_step, reset_onboarding, onboard_landlord, onboard_tenant, 
    update_onboarding_step
)

bp = Blueprint("onboard", __name__, url_prefix="/api/onboard")

@bp.route("/landlord", methods=["POST"])
@jwt_required()
def onboard_landlord():
    user_id = get_jwt_identity()["id"]
    data = request.get_json()
    phone = data.get("phone")
    company = data.get("company_name")
    properties = data.get("properties", [])

    if not phone:
        return jsonify({"msg": "Phone number is required"}), 400

    # Prevent duplicate onboarding
    if LandlordProfile.query.filter_by(user_id=user_id).first():
        return jsonify({"msg": "Landlord already onboarded"}), 400

    profile = LandlordProfile(user_id=user_id, phone=phone, company_name=company)
    db.session.add(profile)
    db.session.flush()

    for prop in properties:
        if not all(k in prop for k in ("name", "address", "unit_count")):
            continue  # skip incomplete property data
        p = Property(
            landlord_id=user_id,
            name=prop["name"],
            address=prop["address"],
            unit_count=prop["unit_count"]
        )
        db.session.add(p)

    db.session.commit()
    return jsonify({"msg": "Landlord onboarding completed"}), 201

@bp.route("/tenant", methods=["POST"])
def onboard_tenant():
    import logging
    data = request.get_json()
    property_code = data.get("property_code")
    
    # Handle property code onboarding (no JWT required)
    if property_code:
        try:
            # Validate the user data
            name = data.get("name")
            email = data.get("email")
            password = data.get("password")
            phone = data.get("phone")
            
            if not all([name, email, password, phone]):
                return jsonify({"error": "Missing required fields"}), 400
            
            # Check if the property code exists and is valid
            code_entry = PropertyCode.query.filter_by(code=property_code, active=True).first()
            if not code_entry:
                return jsonify({"error": "Invalid property code"}), 400
                
            if not code_entry.is_valid():
                return jsonify({"error": "Property code has expired"}), 400
                
            # Check if email already exists
            if User.query.filter_by(email=email).first():
                return jsonify({"error": "Email already registered"}), 400
                
            # Get the property to verify it exists
            property = db.session.get(Property, code_entry.property_id)
            if not property:
                return jsonify({"error": "Associated property not found"}), 404
                
            # Create the user with tenant role
            user = User(
                name=name,
                email=email,
                password=password,  # Will be hashed by the model
                role="tenant"
            )
            db.session.add(user)
            db.session.flush()  # Get the user ID
            
            # Create tenant profile
            profile = TenantProfile(
                user_id=user.id,
                phone=phone
            )
            db.session.add(profile)
            db.session.flush()
            
            # Create tenant-property association
            from src.models.tenant_property import TenantProperty
            tenant_property = TenantProperty(
                tenant_id=user.id,
                property_id=code_entry.property_id,
                rent_amount=0.0,  # Default value, can be updated later
                status='active'
            )
            db.session.add(tenant_property)
            
            db.session.commit()
            
            return jsonify({
                "message": "Tenant onboarded successfully",
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "role": user.role
                },
                "property": {
                    "id": property.id,
                    "name": property.name,
                    "address": property.address
                }
            }), 201
        
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error in tenant onboarding with property code: {str(e)}")
            return jsonify({"error": "An error occurred during onboarding"}), 500
    
    # Regular tenant onboarding (JWT required)
    try:
        jwt_required()(lambda: None)()
        user_id = get_jwt_identity()["id"]
    except Exception:
        return jsonify({"error": "Authentication required"}), 401

    phone = data.get("phone")
    property_id = data.get("property_id")
    unit = data.get("unit")
    lease_start = data.get("lease_start")
    lease_end = data.get("lease_end")
    rent = data.get("monthly_rent")
    emergency_contact = data.get("emergency_contact")

    missing = [field for field in ["phone", "property_id", "unit", "lease_start", "lease_end", "monthly_rent"] if not data.get(field)]
    if missing:
        return jsonify({"msg": f"Missing fields: {', '.join(missing)}"}), 400

    # Prevent duplicate onboarding
    if TenantProfile.query.filter_by(user_id=user_id).first():
        return jsonify({"msg": "Tenant already onboarded"}), 400

    # Create tenant profile
    try:
        profile = TenantProfile(
            user_id=user_id,
            phone=phone
        )
        
        # Set emergency contact information if provided
        if emergency_contact:
            if isinstance(emergency_contact, dict):
                profile.emergency_contact_name = emergency_contact.get('name')
                profile.emergency_contact_phone = emergency_contact.get('phone')
                profile.emergency_contact_relation = emergency_contact.get('relation')
        
        db.session.add(profile)
        db.session.flush()
        
        # Create tenant-property association
        from src.models.tenant_property import TenantProperty
        tenant_property = TenantProperty(
            tenant_id=user_id,
            property_id=property_id,
            unit_id=unit,
            rent_amount=rent,
            status='active',
            start_date=lease_start,
            end_date=lease_end
        )
        db.session.add(tenant_property)
        
        # Create lease
        lease = Lease(
            tenant_id=user_id,
            property_id=property_id,
            unit_id=unit,
            start_date=lease_start,
            end_date=lease_end,
            rent=rent
        )
        db.session.add(lease)
        db.session.commit()
        
        return jsonify({"msg": "Tenant onboarding completed"}), 201
    except Exception as e:
        db.session.rollback()
        import logging
        logging.error(f"Error in regular tenant onboarding: {str(e)}")
        return jsonify({"error": "An error occurred during tenant onboarding"}), 500

# Property Code Validation & Linking Endpoint
@bp.route("/property-code", methods=["POST"])
def validate_property_code():
    """
    Validate a property code and optionally link a user to the property
    
    If a user_id is provided, the user will be linked to the property
    Returns 400 for invalid or missing property codes
    """
    data = request.get_json()
    
    if not data or 'property_code' not in data:
        return jsonify({"error": "Missing property_code parameter"}), 400
        
    code = data.get('property_code')
    user_id = data.get('user_id')
    
    try:
        # Look up the property code
        code_entry = PropertyCode.query.filter_by(code=code).first()
        
        # Validate the code
        if not code_entry or not code_entry.is_valid():
            return jsonify({"error": "Invalid property code"}), 400
        
        # Look up the property
        property = db.session.get(Property, code_entry.property_id)
        if not property:
            return jsonify({"error": "Property not found"}), 400
            
        response_data = {
            "property_id": property.id,
            "property_name": property.name,
            "linked": False
        }
        
        # Link user to property if user_id provided
        if user_id:
            user = db.session.get(User, user_id)
            if not user:
                return jsonify({"error": "User not found"}), 400
                
            # Check if user exists
            user = db.session.get(User, user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
                
            # Check if user already has a tenant profile
            existing_profile = TenantProfile.query.filter_by(user_id=user_id).first()
            if not existing_profile:
                # Create new tenant profile
                profile = TenantProfile(user_id=user_id)
                db.session.add(profile)
                
            # Create tenant-property association
            from src.models.tenant_property import TenantProperty
            existing_assoc = TenantProperty.query.filter_by(
                tenant_id=user_id, 
                property_id=property.id
            ).first()
            
            if not existing_assoc:
                tenant_property = TenantProperty(
                    tenant_id=user_id,
                    property_id=property.id,
                    rent_amount=0.0,  # Default value, can be updated later
                    status='active'
                )
                db.session.add(tenant_property)
                db.session.commit()
                
            response_data["linked"] = True
            
        return jsonify(response_data), 200
        
    except Exception as e:
        db.session.rollback()
        import logging
        logging.error(f"Error validating property code: {str(e)}")
        return jsonify({"error": "An error occurred while processing the property code"}), 500
bp = Blueprint("onboard", __name__, url_prefix="/api/onboard")

# Define a dedicated endpoint for property code validation and linking
@bp.route("/property-code", methods=["POST"])
def validate_property_code():
    """
    Endpoint to validate a property code and link a user to a property
    
    Request body should contain:
    - property_code: The code to validate
    - user_id: (Optional) The ID of an existing user to link
    
    If user_id is not provided, it's assumed this is just for validation
    """
    import logging
    data = request.get_json()
    
    # Validate the input
    if not data or 'property_code' not in data:
        return jsonify({"error": "Missing property_code parameter"}), 400
    
    property_code = data.get("property_code")
    user_id = data.get("user_id")
    
    try:
        # Check if the property code exists and is valid
        code_entry = PropertyCode.query.filter_by(code=property_code, active=True).first()
        
        if not code_entry:
            return jsonify({"error": "Invalid property code"}), 400
            
        if not code_entry.is_valid():
            return jsonify({"error": "Property code has expired"}), 400
        
        # Get the property
        property = db.session.get(Property, code_entry.property_id)
        if not property:
            return jsonify({"error": "Property not found"}), 404
        
        result = {
            "property_id": code_entry.property_id,
            "property_name": property.name,
            "linked": False
        }
        
        # If user_id is provided, link the user to the property
        if user_id:
            user = db.session.get(User, user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
                
            # Check if user already has a tenant profile
            existing_profile = TenantProfile.query.filter_by(user_id=user_id).first()
            
            if existing_profile:
                # Update existing profile to link to this property
                existing_profile.property_id = code_entry.property_id
                result["linked"] = True
                result["profile_updated"] = True
            else:
                # Create new tenant profile
                # Create tenant profile if it doesn't exist
                profile = TenantProfile(user_id=user_id)
                db.session.add(profile)
                
                # Create the tenant-property relationship
                from src.models.tenant_property import TenantProperty
                tenant_property = TenantProperty(
                    tenant_id=user_id,
                    property_id=code_entry.property_id,
                    rent_amount=0.0,  # Default rent amount, can be updated later
                    status='pending'
                )
                db.session.add(tenant_property)
                result["linked"] = True
                result["profile_created"] = True
                result["tenant_property_created"] = True
            
            db.session.commit()
            
        return jsonify(result), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error validating property code: {str(e)}")
        return jsonify({"error": "An error occurred while processing your request"}), 500

# Map all controllers to the same blueprint
bp.route("/landlord", methods=["POST"])(onboard_landlord)
bp.route("/tenant", methods=["POST"])(onboard_tenant)
bp.route('/start', methods=['POST'])(start_onboarding)
bp.route('/step', methods=['POST'])(update_onboarding_step)  # New endpoint for step progress
bp.route('/step/<step_name>', methods=['POST', 'PUT'])(update_onboarding_step)  # Legacy endpoint for step progress with step_name parameter
bp.route('/status', methods=['GET'])(get_onboarding_status)
bp.route('/skip/<step_name>', methods=['POST'])(skip_step)
bp.route('/reset', methods=['POST'])(reset_onboarding)
