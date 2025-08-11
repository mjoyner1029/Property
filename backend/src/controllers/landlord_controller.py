from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError

from ..models.landlord_profile import LandlordProfile
from ..models.user import User
from ..models.property import Property
from ..models.tenant_property import TenantProperty
from ..models.stripe_account import StripeAccount
from ..extensions import db
from ..utils.role_required import role_required

landlord_bp = Blueprint('landlords', __name__)

@landlord_bp.route('/profile', methods=['GET'])
@jwt_required()
@role_required('landlord')
def get_landlord_profile():
    """Get the landlord profile for the authenticated user"""
    current_user_id = get_jwt_identity()
    
    try:
        landlord_profile = LandlordProfile.query.filter_by(user_id=current_user_id).first()
        
        if not landlord_profile:
            return jsonify({"error": "Landlord profile not found"}), 404
            
        return jsonify(landlord_profile.to_dict()), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@landlord_bp.route('/profile', methods=['POST'])
@jwt_required()
@role_required('landlord')
def create_landlord_profile():
    """Create a new landlord profile"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        # Check if profile already exists
        existing_profile = LandlordProfile.query.filter_by(user_id=current_user_id).first()
        if existing_profile:
            return jsonify({"error": "Landlord profile already exists"}), 400
            
        # Validate required fields
        required_fields = ['phone']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
                
        # Create new landlord profile
        new_profile = LandlordProfile(
            user_id=current_user_id,
            phone=data['phone'],
            company_name=data.get('company_name', ''),
            business_address=data.get('business_address', ''),
            business_license_number=data.get('business_license_number', ''),
            tax_id=data.get('tax_id', ''),
            verified=False
        )
        
        db.session.add(new_profile)
        db.session.commit()
        
        return jsonify({
            "message": "Landlord profile created successfully",
            "profile_id": new_profile.id
        }), 201
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@landlord_bp.route('/profile', methods=['PUT'])
@jwt_required()
@role_required('landlord')
def update_landlord_profile():
    """Update landlord profile"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        landlord_profile = LandlordProfile.query.filter_by(user_id=current_user_id).first()
        
        if not landlord_profile:
            return jsonify({"error": "Landlord profile not found"}), 404
            
        # Update fields
        if 'phone' in data:
            landlord_profile.phone = data['phone']
        if 'company_name' in data:
            landlord_profile.company_name = data['company_name']
        if 'business_address' in data:
            landlord_profile.business_address = data['business_address']
        if 'business_license_number' in data:
            landlord_profile.business_license_number = data['business_license_number']
        if 'tax_id' in data:
            landlord_profile.tax_id = data['tax_id']
            
        db.session.commit()
        
        return jsonify({"message": "Landlord profile updated successfully"}), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@landlord_bp.route('/verify/<int:landlord_id>', methods=['POST'])
@jwt_required()
@role_required('admin')
def verify_landlord(landlord_id):
    """Verify a landlord (admin only)"""
    try:
        landlord_profile = LandlordProfile.query.filter_by(id=landlord_id).first()
        
        if not landlord_profile:
            return jsonify({"error": "Landlord profile not found"}), 404
            
        landlord_profile.verified = True
        db.session.commit()
        
        return jsonify({"message": "Landlord verified successfully"}), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@landlord_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@role_required('landlord')
def get_dashboard_data():
    """Get dashboard data for landlord"""
    current_user_id = get_jwt_identity()
    
    try:
        # Get property count
        property_count = Property.query.filter_by(landlord_id=current_user_id).count()
        
        # Get tenant count
        tenant_count = TenantProperty.query.join(Property).filter(
            Property.landlord_id == current_user_id,
            TenantProperty.status == 'active'
        ).count()
        
        # Get active properties (with at least one tenant)
        active_properties = db.session.query(Property.id).join(TenantProperty).filter(
            Property.landlord_id == current_user_id,
            TenantProperty.status == 'active'
        ).group_by(Property.id).count()
        
        # Get vacancy rate
        vacancy_rate = 0
        if property_count > 0:
            vacancy_rate = round(((property_count - active_properties) / property_count) * 100, 2)
        
        # Get stripe account status
        stripe_account = StripeAccount.query.filter_by(user_id=current_user_id).first()
        stripe_status = {
            "has_account": stripe_account is not None,
            "is_verified": stripe_account.is_verified if stripe_account else False,
            "account_id": stripe_account.account_id if stripe_account else None
        }
        
        # Return dashboard data
        return jsonify({
            "property_count": property_count,
            "tenant_count": tenant_count,
            "active_properties": active_properties,
            "vacancy_rate": vacancy_rate,
            "stripe_status": stripe_status
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@landlord_bp.route('/pending-approvals', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_pending_landlords():
    """Get landlords pending verification (admin only)"""
    try:
        landlord_profiles = LandlordProfile.query.filter_by(verified=False).all()
        
        result = []
        for profile in landlord_profiles:
            user = User.query.get(profile.user_id)
            if user:
                result.append({
                    "profile_id": profile.id,
                    "user_id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "phone": profile.phone,
                    "company_name": profile.company_name,
                    "business_license": profile.business_license_number,
                    "created_at": profile.created_at.isoformat() if profile.created_at else None
                })
        
        return jsonify({"pending_landlords": result}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@landlord_bp.route('/stripe-account', methods=['POST'])
@jwt_required()
@role_required('landlord')
def create_stripe_account():
    """Create Stripe Connect account for landlord"""
    current_user_id = get_jwt_identity()
    
    try:
        # Check if landlord profile exists
        landlord_profile = LandlordProfile.query.filter_by(user_id=current_user_id).first()
        if not landlord_profile:
            return jsonify({"error": "Landlord profile not found"}), 404
            
        # Check if Stripe account already exists
        existing_account = StripeAccount.query.filter_by(user_id=current_user_id).first()
        if existing_account and existing_account.account_id:
            return jsonify({"error": "Stripe account already exists"}), 400
            
        # This would integrate with your Stripe Connect implementation
        # For now, we're just creating a placeholder record
        
        if not existing_account:
            stripe_account = StripeAccount(
                user_id=current_user_id,
                account_id="placeholder_connect_account_id",
                is_verified=False
            )
            db.session.add(stripe_account)
        else:
            existing_account.account_id = "placeholder_connect_account_id"
            
        db.session.commit()
        
        return jsonify({
            "message": "Stripe Connect account creation initiated",
            "account_id": "placeholder_connect_account_id"
        }), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@landlord_bp.route('/all', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_all_landlords():
    """Get all landlords (admin only)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Get users with landlord role
        landlords = User.query.filter_by(role='landlord').paginate(page=page, per_page=per_page)
        
        result = []
        for landlord in landlords.items:
            profile = LandlordProfile.query.filter_by(user_id=landlord.id).first()
            
            landlord_data = {
                "id": landlord.id,
                "name": landlord.name,
                "email": landlord.email,
                "is_verified": landlord.is_verified,
                "created_at": landlord.created_at.isoformat() if landlord.created_at else None,
                "profile": profile.to_dict() if profile else None,
                "property_count": Property.query.filter_by(landlord_id=landlord.id).count()
            }
            
            result.append(landlord_data)
            
        return jsonify({
            "landlords": result,
            "total": landlords.total,
            "pages": landlords.pages,
            "current_page": page
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_landlord_profile_by_id(landlord_id):
    """Utility function to get landlord profile by ID"""
    try:
        user = User.query.filter_by(id=landlord_id, role='landlord').first()
        if not user:
            return None, "User not found or not a landlord"
            
        profile = LandlordProfile.query.filter_by(user_id=landlord_id).first()
        if not profile:
            return None, "Landlord profile not found"
            
        return profile, None
    except Exception as e:
        return None, str(e)