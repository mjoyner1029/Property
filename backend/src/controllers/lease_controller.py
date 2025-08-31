from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta

from ..models.lease import Lease
from ..models.user import User
from ..models.property import Property
from ..models.tenant_property import TenantProperty
from ..extensions import db
from ..utils.role_required import role_required
from ..utils.serialization import safe_property_dict

lease_bp = Blueprint('leases', __name__)

@lease_bp.route('/tenant', methods=['GET'])
@jwt_required()
@role_required('tenant')
def get_tenant_leases():
    """Get all leases for the current tenant"""
    current_user_id = get_jwt_identity()
    
    leases = Lease.query.filter_by(tenant_id=current_user_id).all()
    
    result = []
    for lease in leases:
        lease_data = lease.to_dict()
        # Add property information
        property = Property.query.get(lease.property_id)
        if property:
            lease_data['property'] = safe_property_dict(property)
        result.append(lease_data)
    
    return jsonify(result), 200
    
@lease_bp.route('/landlord', methods=['GET'])
@jwt_required()
@role_required('landlord')
def get_landlord_leases():
    """Get all leases for the current landlord"""
    current_user_id = get_jwt_identity()
    
    leases = Lease.query.filter_by(landlord_id=current_user_id).all()
    
    result = []
    for lease in leases:
        lease_data = lease.to_dict()
        # Add property information
        property = Property.query.get(lease.property_id)
        if property:
            lease_data['property'] = safe_property_dict(property)
        result.append(lease_data)
    
    return jsonify(result), 200
    
@jwt_required()
@role_required('tenant')
def accept_lease(lease_id):
    """Tenant accepts a lease agreement"""
    current_user_id = get_jwt_identity()
    
    try:
        # Find the pending lease
        lease = Lease.query.filter_by(
            id=lease_id, 
            tenant_id=current_user_id,
            status='pending'
        ).first()
        
        if not lease:
            return jsonify({"error": "Lease not found or already processed"}), 404
            
        # Update lease status
        lease.status = 'active'
        lease.accepted_at = datetime.utcnow()
        
        # Create tenant-property relationship if it doesn't exist
        tenant_property = TenantProperty.query.filter_by(
            tenant_id=current_user_id,
            property_id=lease.property_id,
            unit_id=lease.unit_id
        ).first()
        
        if not tenant_property:
            tenant_property = TenantProperty(
                tenant_id=current_user_id,
                property_id=lease.property_id,
                unit_id=lease.unit_id,
                rent_amount=lease.rent_amount,
                status='active',
                start_date=lease.start_date,
                end_date=lease.end_date
            )
            db.session.add(tenant_property)
        else:
            # Update existing relationship
            tenant_property.status = 'active'
            tenant_property.rent_amount = lease.rent_amount
            tenant_property.start_date = lease.start_date
            tenant_property.end_date = lease.end_date
            
        db.session.commit()
        
        return jsonify({"message": "Lease accepted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@jwt_required()
@role_required('tenant')
def reject_lease(lease_id):
    """Tenant rejects a lease agreement"""
    current_user_id = get_jwt_identity()
    
    try:
        # Find the pending lease
        lease = Lease.query.filter_by(
            id=lease_id, 
            tenant_id=current_user_id,
            status='pending'
        ).first()
        
        if not lease:
            return jsonify({"error": "Lease not found or already processed"}), 404
            
        # Update lease status
        lease.status = 'rejected'
        lease.rejected_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({"message": "Lease rejected successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
        
@jwt_required()
@role_required('landlord')
def terminate_lease(lease_id):
    """Landlord terminates a lease agreement"""
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    reason = data.get('reason', 'No reason provided')
    
    try:
        # Find the active lease
        lease = Lease.query.filter_by(
            id=lease_id, 
            landlord_id=current_user_id,
            status='active'
        ).first()
        
        if not lease:
            return jsonify({"error": "Active lease not found"}), 404
            
        # Update lease status
        lease.status = 'terminated'
        lease.termination_date = datetime.utcnow()
        lease.termination_reason = reason
        
        # Update tenant-property relationship
        tenant_property = TenantProperty.query.filter_by(
            tenant_id=lease.tenant_id,
            property_id=lease.property_id,
            unit_id=lease.unit_id,
            status='active'
        ).first()
        
        if tenant_property:
            tenant_property.status = 'inactive'
            tenant_property.end_date = datetime.utcnow()
            
        db.session.commit()
        
        return jsonify({
            "message": "Lease terminated successfully",
            "lease": lease.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
        
@jwt_required()
@role_required('landlord')
def renew_lease(lease_id):
    """Renew an existing lease with new terms"""
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    try:
        # Find the original lease
        original_lease = Lease.query.filter_by(
            id=lease_id, 
            landlord_id=current_user_id
        ).first()
        
        if not original_lease:
            return jsonify({"error": "Lease not found"}), 404
            
        # Get renewal terms from the request or use the original lease terms
        start_date = datetime.strptime(data.get('start_date', original_lease.end_date.strftime('%Y-%m-%d')), '%Y-%m-%d').date()
        
        # Default to one year from start date if no end date provided
        if 'end_date' in data:
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        else:
            end_date = start_date.replace(year=start_date.year + 1)
            
        rent_amount = data.get('rent_amount', original_lease.rent_amount)
        security_deposit = data.get('security_deposit', original_lease.security_deposit)
        terms = data.get('terms', original_lease.terms)
        
        # Create a new lease with renewal terms
        new_lease = Lease(
            tenant_id=original_lease.tenant_id,
            landlord_id=current_user_id,
            property_id=original_lease.property_id,
            unit_id=original_lease.unit_id,
            start_date=start_date,
            end_date=end_date,
            rent_amount=rent_amount,
            security_deposit=security_deposit,
            payment_day=original_lease.payment_day,
            rent_cycle=original_lease.rent_cycle,
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

@lease_bp.route('/', methods=['POST'])
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
            "lease_id": new_lease.id,
            "lease": new_lease.to_dict()
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

@jwt_required()
@role_required('tenant')
def accept_lease(lease_id):
    """Accept a lease agreement as a tenant"""
    current_user_id = get_jwt_identity()
    print(f"DEBUG - Accept Lease - Current user ID: {current_user_id}, type: {type(current_user_id)}")
    
    try:
        lease = Lease.query.get(lease_id)
        
        if not lease:
            print(f"DEBUG - Accept Lease - Lease not found for ID: {lease_id}")
            return jsonify({"error": "Lease not found"}), 404
            
        print(f"DEBUG - Accept Lease - Lease found: ID {lease.id}, tenant_id: {lease.tenant_id}, type: {type(lease.tenant_id)}")
        
        # Verify the lease belongs to the tenant
        if str(lease.tenant_id) != str(current_user_id):
            print(f"DEBUG - Accept Lease - Unauthorized: lease.tenant_id: {lease.tenant_id} != current_user_id: {current_user_id}")
            return jsonify({"error": "Unauthorized access"}), 403
            
        # Check if lease is in pending status
        if lease.status != 'pending':
            print(f"DEBUG - Accept Lease - Invalid status: {lease.status}")
            return jsonify({"error": "Lease is not in pending status"}), 400
            
        # Update lease status
        lease.status = 'active'
        lease.accepted_at = datetime.now()
        
        try:
            # Update or create tenant_property status
            tenant_property = TenantProperty.query.filter_by(
                tenant_id=lease.tenant_id,
                property_id=lease.property_id
            ).first()
            
            if tenant_property:
                print(f"DEBUG - Accept Lease - Updating existing TenantProperty: {tenant_property.id}")
                tenant_property.status = 'active'
            else:
                # Create new tenant_property relationship if it doesn't exist
                print(f"DEBUG - Accept Lease - Creating new TenantProperty relationship for tenant_id:{lease.tenant_id}, property_id:{lease.property_id}")
                tenant_property = TenantProperty(
                    tenant_id=lease.tenant_id,
                    property_id=lease.property_id,
                    unit_id=lease.unit_id,
                    status='active',
                    rent_amount=lease.rent_amount,
                    start_date=lease.start_date
                )
                print(f"DEBUG - Accept Lease - TenantProperty object created")
                db.session.add(tenant_property)
                print(f"DEBUG - Accept Lease - TenantProperty added to session")
            
            db.session.commit()
            print(f"DEBUG - Accept Lease - Session committed successfully")
        except Exception as inner_e:
            print(f"DEBUG - Accept Lease - Error creating/updating TenantProperty: {str(inner_e)}")
            db.session.rollback()
            raise
        
        # Return the updated lease as expected by the test
        return jsonify({
            "message": "Lease accepted successfully",
            "lease": lease.to_dict()
        }), 200
        
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

@lease_bp.route('/<int:lease_id>/terminate', methods=['PUT', 'POST'])
@jwt_required()
def terminate_lease(lease_id):
    """Terminate an active lease"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    data = request.get_json()
    
    # Allow both 'reason' and 'termination_reason' fields for compatibility
    termination_reason = data.get('termination_reason', data.get('reason', ''))
    
    print(f"DEBUG - JWT lookup identity: {current_user_id}, type: {type(current_user_id)}")
    print(f"DEBUG - Looking up user with ID: {current_user_id}, type: {type(int(current_user_id))}")
    print(f"DEBUG - Found user: {user}")
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    try:
        lease = Lease.query.get(lease_id)
        
        if not lease:
            return jsonify({"error": "Lease not found"}), 404
            
        # Check permissions
        if user.role == 'tenant' and str(lease.tenant_id) != str(current_user_id):
            print(f"DEBUG - Tenant unauthorized. lease.tenant_id: {lease.tenant_id}, current_user_id: {current_user_id}")
            return jsonify({"error": "Unauthorized access"}), 403
        elif user.role == 'landlord' and str(lease.landlord_id) != str(current_user_id):
            print(f"DEBUG - Landlord unauthorized. lease.landlord_id: {lease.landlord_id}, current_user_id: {current_user_id}")
            return jsonify({"error": "Unauthorized access"}), 403
        elif user.role != 'admin' and user.role != 'tenant' and user.role != 'landlord':
            print(f"DEBUG - Role unauthorized. User role: {user.role}")
            return jsonify({"error": "Unauthorized access"}), 403
            
        # Check if lease is in active status
        if lease.status != 'active':
            return jsonify({"error": "Only active leases can be terminated"}), 400
            
        # Update lease status
        lease.status = 'terminated'
        lease.termination_reason = termination_reason
        termination_date = datetime.now()
        lease.terminated_at = termination_date
        
        # Update tenant_property status
        tenant_property = TenantProperty.query.filter_by(
            tenant_id=lease.tenant_id,
            property_id=lease.property_id
        ).first()
        
        if tenant_property:
            tenant_property.status = 'inactive'
            
        db.session.commit()
        
        # Format response to match expected test structure
        return jsonify({
            "message": "Lease terminated successfully",
            "lease": {
                "id": lease.id,
                "status": lease.status,
                "termination_date": termination_date.isoformat(),
                "termination_reason": lease.termination_reason
            }
        }), 200
        
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
        
@lease_bp.route('/<int:lease_id>', methods=['DELETE'])
@jwt_required()
def delete_lease(lease_id):
    """Delete a lease agreement - only allowed for drafts or pending leases"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    lease = Lease.query.get(lease_id)
    if not lease:
        return jsonify({"error": "Lease not found"}), 404
        
    # Only landlords can delete leases
    if user.role != 'landlord' or lease.landlord_id != current_user_id:
        return jsonify({"error": "Not authorized to delete this lease"}), 403
        
    # Only allow deletion of pending or draft leases
    if lease.status not in ['pending', 'draft']:
        return jsonify({"error": "Cannot delete an active or completed lease"}), 400
    
    try:
        db.session.delete(lease)
        
        # Check if there are other leases for this property and tenant
        other_leases = Lease.query.filter_by(
            property_id=lease.property_id, 
            tenant_id=lease.tenant_id
        ).filter(Lease.id != lease_id).count()
        
        # If no other leases, remove tenant_property relationship
        if other_leases == 0:
            tenant_property = TenantProperty.query.filter_by(
                tenant_id=lease.tenant_id,
                property_id=lease.property_id
            ).first()
            
            if tenant_property:
                db.session.delete(tenant_property)
        
        db.session.commit()
        return jsonify({"message": "Lease deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500