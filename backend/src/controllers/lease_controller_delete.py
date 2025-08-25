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
