from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta

from ..models.lease import Lease
from ..models.user import User
from ..models.property import Property
from ..models.tenant_property import TenantProperty
from ..extensions import db
from ..utils.role_required import role_required

lease_bp = Blueprint('leases', __name__)

@lease_bp.route('/', methods=['POST'])
@jwt_required()
@role_required('landlord')
def create_lease():
    """Create a new lease agreement"""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    try:
        # Validate required fields
        required_fields = ['tenant_id', 'property_id', 'start_date', 'end_date', 
                          'rent_amount', 'security_deposit', 'terms']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Verify property belongs to landlord
        property = Property.query.filter_by(id=data['property_id'], landlord_id=current_user_id).first()
        if not property:
            return jsonify({"error": "Property not found or you don't have permission"}), 404
        
        # Check if tenant exists
        tenant = User.query.filter_by(id=data['tenant_id'], role='tenant').first()
        if not tenant:
            return jsonify({"error": "Tenant not found"}), 404
        
        # Check for date validity
        start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
        
        if end_date <= start_date:
            return jsonify({"error": "End date must be after start date"}), 400
        
        # Create lease
        new_lease = Lease(
            tenant_id=data['tenant_id'],
            property_id=data['property_id'],
            landlord_id=current_user_id,
            start_date=start_date,
            end_date=end_date,
            rent_amount=data['rent_amount'],
            security_deposit=data['security_deposit'],
            terms=data['terms'],
            status='pending'  # Initial status is pending until tenant accepts
        )
        
        db.session.add(new_lease)
        
        # Create or update tenant_property relationship
        tenant_property = TenantProperty.query.filter_by(
            tenant_id=data['tenant_id'],
            property_id=data['property_id']
        ).first()
        
        if not tenant_property:
            tenant_property = TenantProperty(
                tenant_id=data['tenant_id'],
                property_id=data['property_id'],
                rent_amount=data['rent_amount'],
                status='pending'  # Will be set to active once lease is accepted
            )
            db.session.add(tenant_property)
        else:
            # Update existing relationship
            tenant_property.rent_amount = data['rent_amount']
        
        db.session.commit()
        
        return jsonify({
            "message": "Lease created successfully", 
            "lease_id": new_lease.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@lease_bp.route('/', methods=['GET'])
@jwt_required()
def get_leases():
    """Get leases based on user role"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status_filter = request.args.get('status')
        property_id = request.args.get('property_id', type=int)
        
        query = Lease.query
        
        # Filter based on role
        if user.role == 'tenant':
            query = query.filter(Lease.tenant_id == current_user_id)
        elif user.role == 'landlord':
            query = query.filter(Lease.landlord_id == current_user_id)
        elif user.role != 'admin':
            return jsonify({"error": "Unauthorized access"}), 403
            
        # Apply filters if provided
        if status_filter:
            query = query.filter(Lease.status == status_filter)
        if property_id:
            query = query.filter(Lease.property_id == property_id)
            
        # Apply sorting (newest first)
        query = query.order_by(Lease.created_at.desc())
        
        # Paginate results
        paginated_leases = query.paginate(page=page, per_page=per_page)
        
        result = {
            "leases": [lease.to_dict() for lease in paginated_leases.items],
            "total": paginated_leases.total,
            "pages": paginated_leases.pages,
            "current_page": page
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@lease_bp.route('/<int:lease_id>', methods=['GET'])
@jwt_required()
def get_lease(lease_id):
    """Get a specific lease"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    try:
        lease = Lease.query.get(lease_id)
        
        if not lease:
            return jsonify({"error": "Lease not found"}), 404
            
        # Check permissions
        if user.role == 'tenant' and lease.tenant_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403
        elif user.role == 'landlord' and lease.landlord_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403
            
        return jsonify(lease.to_dict()), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@lease_bp.route('/<int:lease_id>', methods=['PUT'])
@jwt_required()
@role_required('landlord')
def update_lease(lease_id):
    """Update a lease"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        lease = Lease.query.get(lease_id)
        
        if not lease:
            return jsonify({"error": "Lease not found"}), 404
            
        # Verify ownership
        if lease.landlord_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403
            
        # Only allow updates if lease is pending or active
        if lease.status not in ['pending', 'active']:
            return jsonify({"error": "Cannot update a terminated or expired lease"}), 400
            
        # Update fields
        if 'start_date' in data:
            lease.start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        if 'end_date' in data:
            lease.end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
        if 'rent_amount' in data:
            lease.rent_amount = data['rent_amount']
            
            # Update tenant_property relationship
            tenant_property = TenantProperty.query.filter_by(
                tenant_id=lease.tenant_id,
                property_id=lease.property_id
            ).first()
            if tenant_property:
                tenant_property.rent_amount = data['rent_amount']
                
        if 'security_deposit' in data:
            lease.security_deposit = data['security_deposit']
        if 'terms' in data:
            lease.terms = data['terms']
        if 'status' in data:
            lease.status = data['status']
            
            # Update tenant_property status accordingly
            if data['status'] == 'active':
                tenant_property = TenantProperty.query.filter_by(
                    tenant_id=lease.tenant_id,
                    property_id=lease.property_id
                ).first()
                if tenant_property:
                    tenant_property.status = 'active'
            elif data['status'] in ['terminated', 'expired']:
                tenant_property = TenantProperty.query.filter_by(
                    tenant_id=lease.tenant_id,
                    property_id=lease.property_id
                ).first()
                if tenant_property:
                    tenant_property.status = 'inactive'
            
        db.session.commit()
        return jsonify({"message": "Lease updated successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@lease_bp.route('/<int:lease_id>/accept', methods=['POST'])
@jwt_required()
@role_required('tenant')
def accept_lease(lease_id):
    """Accept a lease agreement as a tenant"""
    current_user_id = get_jwt_identity()
    
    try:
        lease = Lease.query.get(lease_id)
        
        if not lease:
            return jsonify({"error": "Lease not found"}), 404
            
        # Verify the lease belongs to the tenant
        if lease.tenant_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403
            
        # Check if lease is in pending status
        if lease.status != 'pending':
            return jsonify({"error": "Lease is not in pending status"}), 400
            
        # Update lease status
        lease.status = 'active'
        lease.accepted_at = datetime.now()
        
        # Update tenant_property status
        tenant_property = TenantProperty.query.filter_by(
            tenant_id=current_user_id,
            property_id=lease.property_id
        ).first()
        
        if tenant_property:
            tenant_property.status = 'active'
            
        db.session.commit()
        return jsonify({"message": "Lease accepted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@lease_bp.route('/<int:lease_id>/reject', methods=['POST'])
@jwt_required()
@role_required('tenant')
def reject_lease(lease_id):
    """Reject a lease agreement as a tenant"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    rejection_reason = data.get('rejection_reason', '')
    
    try:
        lease = Lease.query.get(lease_id)
        
        if not lease:
            return jsonify({"error": "Lease not found"}), 404
            
        # Verify the lease belongs to the tenant
        if lease.tenant_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403
            
        # Check if lease is in pending status
        if lease.status != 'pending':
            return jsonify({"error": "Lease is not in pending status"}), 400
            
        # Update lease status
        lease.status = 'rejected'
        lease.rejection_reason = rejection_reason
        
        # Update tenant_property status
        tenant_property = TenantProperty.query.filter_by(
            tenant_id=current_user_id,
            property_id=lease.property_id
        ).first()
        
        if tenant_property:
            tenant_property.status = 'inactive'
            
        db.session.commit()
        return jsonify({"message": "Lease rejected successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@lease_bp.route('/<int:lease_id>/terminate', methods=['POST'])
@jwt_required()
def terminate_lease(lease_id):
    """Terminate an active lease"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    data = request.get_json()
    termination_reason = data.get('termination_reason', '')
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    try:
        lease = Lease.query.get(lease_id)
        
        if not lease:
            return jsonify({"error": "Lease not found"}), 404
            
        # Check permissions
        if user.role == 'tenant' and lease.tenant_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403
        elif user.role == 'landlord' and lease.landlord_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403
        elif user.role != 'admin' and user.role != 'tenant' and user.role != 'landlord':
            return jsonify({"error": "Unauthorized access"}), 403
            
        # Check if lease is in active status
        if lease.status != 'active':
            return jsonify({"error": "Only active leases can be terminated"}), 400
            
        # Update lease status
        lease.status = 'terminated'
        lease.termination_reason = termination_reason
        lease.terminated_at = datetime.now()
        
        # Update tenant_property status
        tenant_property = TenantProperty.query.filter_by(
            tenant_id=lease.tenant_id,
            property_id=lease.property_id
        ).first()
        
        if tenant_property:
            tenant_property.status = 'inactive'
            
        db.session.commit()
        return jsonify({"message": "Lease terminated successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@lease_bp.route('/renew/<int:lease_id>', methods=['POST'])
@jwt_required()
@role_required('landlord')
def renew_lease(lease_id):
    """Create a lease renewal"""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    try:
        # Get the original lease
        original_lease = Lease.query.get(lease_id)
        
        if not original_lease:
            return jsonify({"error": "Original lease not found"}), 404
            
        # Verify ownership
        if original_lease.landlord_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403
            
        # Check if lease is active or about to expire
        if original_lease.status not in ['active', 'expiring']:
            return jsonify({"error": "Can only renew active or expiring leases"}), 400
            
        # Get required fields for renewal
        start_date = datetime.fromisoformat(data.get('start_date', '').replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(data.get('end_date', '').replace('Z', '+00:00'))
        rent_amount = data.get('rent_amount', original_lease.rent_amount)
        security_deposit = data.get('security_deposit', original_lease.security_deposit)
        terms = data.get('terms', original_lease.terms)
        
        # Validate dates
        if start_date <= original_lease.end_date:
            return jsonify({"error": "New lease must start after current lease ends"}), 400
            
        if end_date <= start_date:
            return jsonify({"error": "End date must be after start date"}), 400
        
        # Create new lease
        new_lease = Lease(
            tenant_id=original_lease.tenant_id,
            property_id=original_lease.property_id,
            landlord_id=current_user_id,
            start_date=start_date,
            end_date=end_date,
            rent_amount=rent_amount,
            security_deposit=security_deposit,
            terms=terms,
            status='pending',  # Tenant needs to accept renewal
            is_renewal=True,
            previous_lease_id=original_lease.id
        )
        
        db.session.add(new_lease)
        db.session.commit()
        
        return jsonify({
            "message": "Lease renewal created successfully", 
            "lease_id": new_lease.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@lease_bp.route('/expiring', methods=['GET'])
@jwt_required()
@role_required('landlord')
def get_expiring_leases():
    """Get list of leases expiring within the next 30 days"""
    current_user_id = get_jwt_identity()
    
    try:
        # Calculate date range (today to 30 days from now)
        today = datetime.now().date()
        thirty_days_later = today + timedelta(days=30)
        
        # Find active leases expiring in the next 30 days
        expiring_leases = Lease.query.filter(
            Lease.landlord_id == current_user_id,
            Lease.status == 'active',
            Lease.end_date >= today,
            Lease.end_date <= thirty_days_later
        ).all()
        
        result = [lease.to_dict() for lease in expiring_leases]
        
        return jsonify({
            "expiring_leases": result,
            "count": len(result)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500