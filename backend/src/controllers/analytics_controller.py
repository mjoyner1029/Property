import logging
from datetime import datetime, timedelta
from sqlalchemy import func, and_, extract
from sqlalchemy.exc import SQLAlchemyError
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.extensions import db
from src.models.property import Property
from src.models.unit import Unit
from src.models.payment import Payment
from src.models.invoice import Invoice
from src.models.maintenance_request import MaintenanceRequest
from src.models.tenant_profile import TenantProfile
from src.models.tenant_property import TenantProperty
from src.models.user import User

logger = logging.getLogger(__name__)

@jwt_required()
def get_dashboard_stats():
    """
    Get dashboard statistics for the landlord
    
    Returns:
        JSON with dashboard statistics
    """
    try:
        user_id = get_jwt_identity()
        
        # Get landlord's properties
        properties = Property.query.filter_by(landlord_id=user_id).all()
        property_ids = [p.id for p in properties]
        
        if not property_ids:
            return jsonify({"stats": {
                "property_count": 0,
                "unit_count": 0,
                "occupied_units": 0,
                "vacancy_rate": 0,
                "tenant_count": 0,
                "revenue_current_month": 0,
                "outstanding_rent": 0,
                "open_maintenance_requests": 0
            }}), 200
        
        # Count units
        unit_count = Unit.query.filter(Unit.property_id.in_(property_ids)).count()
        
        # Count occupied units
        occupied_units = Unit.query.filter(
            Unit.property_id.in_(property_ids),
            Unit.status == 'occupied'
        ).count()
        
        # Calculate vacancy rate
        vacancy_rate = 0
        if unit_count > 0:
            vacancy_rate = round(((unit_count - occupied_units) / unit_count) * 100, 1)
        
        # Count tenants
        tenant_count = TenantProperty.query.filter(
            TenantProperty.property_id.in_(property_ids),
            TenantProperty.status == 'active'
        ).count()
        
        # Calculate revenue for current month
        current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        current_month_end = (current_month_start.replace(month=current_month_start.month+1) if current_month_start.month < 12 
                            else current_month_start.replace(year=current_month_start.year+1, month=1)) - timedelta(seconds=1)
        
        revenue_current_month = db.session.query(
            func.sum(Payment.amount)
        ).filter(
            Payment.landlord_id == user_id,
            Payment.status == "completed",
            Payment.created_at.between(current_month_start, current_month_end)
        ).scalar() or 0
        
        # Calculate outstanding rent
        outstanding_rent = db.session.query(
            func.sum(Invoice.amount)
        ).filter(
            Invoice.landlord_id == user_id,
            Invoice.status.in_(["pending", "due", "overdue"]),
            Invoice.due_date <= datetime.utcnow()
        ).scalar() or 0
        
        # Count open maintenance requests
        open_requests = MaintenanceRequest.query.filter(
            MaintenanceRequest.property_id.in_(property_ids),
            MaintenanceRequest.status.in_(["pending", "in_progress"])
        ).count()
        
        return jsonify({
            "stats": {
                "property_count": len(properties),
                "unit_count": unit_count,
                "occupied_units": occupied_units,
                "vacancy_rate": vacancy_rate,
                "tenant_count": tenant_count,
                "revenue_current_month": float(revenue_current_month),
                "outstanding_rent": float(outstanding_rent),
                "open_maintenance_requests": open_requests
            }
        }), 200
    except SQLAlchemyError as e:
        logger.error(f"Database error in dashboard stats: {str(e)}")
        return jsonify({"error": "Failed to retrieve dashboard stats"}), 500

@jwt_required()
def get_revenue_stats():
    """
    Get revenue statistics for the landlord
    
    Returns:
        JSON with revenue data
    """
    try:
        user_id = get_jwt_identity()
        period = request.args.get('period', 'monthly')
        
        # Get landlord's properties
        properties = Property.query.filter_by(landlord_id=user_id).all()
        property_ids = [p.id for p in properties]
        
        if not property_ids:
            return jsonify({"revenue_data": []}), 200
        
        # Calculate date range
        end_date = datetime.utcnow()
        if period == 'monthly':
            start_date = end_date - timedelta(days=365)  # Last 12 months
            date_trunc = 'month'
            date_format = '%b %Y'
        elif period == 'weekly':
            start_date = end_date - timedelta(days=12*7)  # Last 12 weeks
            date_trunc = 'week'
            date_format = 'Week %W, %Y'
        elif period == 'quarterly':
            start_date = end_date - timedelta(days=4*365/4)  # Last 4 quarters
            date_trunc = 'quarter'
            date_format = 'Q%q %Y'
        else:
            start_date = end_date - timedelta(days=365)
            date_trunc = 'month'
            date_format = '%b %Y'
        
        # Query revenue data
        payments = Payment.query.filter(
            Payment.landlord_id == user_id,
            Payment.status == "completed",
            Payment.created_at.between(start_date, end_date)
        ).all()
        
        # Group by period
        period_data = {}
        for payment in payments:
            if period == 'monthly':
                period_key = payment.created_at.strftime('%Y-%m')
                display_period = payment.created_at.strftime('%b %Y')
            elif period == 'weekly':
                period_key = f"{payment.created_at.year}-{payment.created_at.isocalendar()[1]}"
                display_period = f"Week {payment.created_at.isocalendar()[1]}, {payment.created_at.year}"
            elif period == 'quarterly':
                quarter = (payment.created_at.month - 1) // 3 + 1
                period_key = f"{payment.created_at.year}-Q{quarter}"
                display_period = f"Q{quarter} {payment.created_at.year}"
            else:
                period_key = payment.created_at.strftime('%Y-%m')
                display_period = payment.created_at.strftime('%b %Y')
                
            if period_key not in period_data:
                period_data[period_key] = {
                    'period': display_period,
                    'revenue': 0,
                    'payment_count': 0
                }
            
            period_data[period_key]['revenue'] += float(payment.amount)
            period_data[period_key]['payment_count'] += 1
        
        # Convert to list and sort
        revenue_data = list(period_data.values())
        revenue_data.sort(key=lambda x: x['period'])
        
        return jsonify({"revenue_data": revenue_data}), 200
    except SQLAlchemyError as e:
        logger.error(f"Database error in revenue stats: {str(e)}")
        return jsonify({"error": "Failed to retrieve revenue stats"}), 500

@jwt_required()
def get_occupancy_stats():
    """
    Get occupancy statistics for the landlord's properties
    
    Returns:
        JSON with occupancy data
    """
    try:
        user_id = get_jwt_identity()
        
        # Get landlord's properties
        properties = Property.query.filter_by(landlord_id=user_id).all()
        
        if not properties:
            return jsonify({"occupancy_data": []}), 200
        
        occupancy_data = []
        
        for prop in properties:
            # Count units for this property
            unit_count = Unit.query.filter_by(property_id=prop.id).count()
            
            # Count occupied units
            occupied_units = Unit.query.filter(
                Unit.property_id == prop.id,
                Unit.status == 'occupied'
            ).count()
            
            # Calculate occupancy rate
            occupancy_rate = 0
            if unit_count > 0:
                occupancy_rate = round((occupied_units / unit_count) * 100, 1)
            
            occupancy_data.append({
                "property_id": prop.id,
                "property_name": prop.name,
                "occupancy_rate": occupancy_rate,
                "total_units": unit_count,
                "occupied_units": occupied_units
            })
        
        return jsonify({"occupancy_data": occupancy_data}), 200
    except SQLAlchemyError as e:
        logger.error(f"Database error in occupancy stats: {str(e)}")
        return jsonify({"error": "Failed to retrieve occupancy stats"}), 500

@jwt_required()
def get_property_analytics(property_id):
    """
    Get analytics for a specific property
    
    Args:
        property_id (int): ID of the property
        
    Returns:
        JSON with property analytics
    """
    try:
        user_id = get_jwt_identity()
        
        # Get the property and verify ownership
        property_data = Property.query.filter_by(id=property_id, landlord_id=user_id).first()
        
        if not property_data:
            return jsonify({"error": "Property not found or access denied"}), 404
        
        # Count units
        unit_count = Unit.query.filter_by(property_id=property_id).count()
        
        # Count occupied units
        occupied_units = Unit.query.filter(
            Unit.property_id == property_id,
            Unit.status == 'occupied'
        ).count()
        
        # Calculate occupancy rate
        occupancy_rate = 0
        if unit_count > 0:
            occupancy_rate = round((occupied_units / unit_count) * 100, 1)
        
        # Calculate current month revenue
        current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        current_month_end = (current_month_start.replace(month=current_month_start.month+1) if current_month_start.month < 12 
                            else current_month_start.replace(year=current_month_start.year+1, month=1)) - timedelta(seconds=1)
        
        revenue = db.session.query(
            func.sum(Payment.amount)
        ).filter(
            Payment.landlord_id == user_id,
            Payment.status == "completed",
            Payment.created_at.between(current_month_start, current_month_end)
        ).scalar() or 0
        
        # Count maintenance requests
        open_requests = MaintenanceRequest.query.filter(
            MaintenanceRequest.property_id == property_id,
            MaintenanceRequest.status.in_(["pending", "in_progress"])
        ).count()
        
        completed_requests = MaintenanceRequest.query.filter(
            MaintenanceRequest.property_id == property_id,
            MaintenanceRequest.status == "completed"
        ).count()
        
        return jsonify({
            "property": {
                "id": property_data.id,
                "name": property_data.name,
                "address": getattr(property_data, 'address', 'N/A')
            },
            "occupancy": {
                "total_units": unit_count,
                "occupied_units": occupied_units,
                "occupancy_rate": occupancy_rate
            },
            "financial": {
                "current_month_revenue": float(revenue),
                "outstanding_balance": 0  # Simplified - would calculate from unpaid invoices
            },
            "maintenance": {
                "open_requests": open_requests,
                "completed_requests": completed_requests
            }
        }), 200
    except SQLAlchemyError as e:
        logger.error(f"Database error in property analytics: {str(e)}")
        return jsonify({"error": "Failed to retrieve property analytics"}), 500

@jwt_required()
def get_maintenance_stats():
    """
    Get maintenance statistics for the landlord's properties
    
    Returns:
        JSON with maintenance data
    """
    try:
        user_id = get_jwt_identity()
        
        # Get landlord's properties
        properties = Property.query.filter_by(landlord_id=user_id).all()
        property_ids = [p.id for p in properties]
        
        if not property_ids:
            return jsonify({
                "maintenance_data": {
                    "open": 0,
                    "in_progress": 0,
                    "completed": 0,
                    "avg_resolution_days": 0
                }
            }), 200
        
        # Count maintenance requests by status
        open_count = MaintenanceRequest.query.filter(
            MaintenanceRequest.property_id.in_(property_ids),
            MaintenanceRequest.status == "pending"
        ).count()
        
        in_progress_count = MaintenanceRequest.query.filter(
            MaintenanceRequest.property_id.in_(property_ids),
            MaintenanceRequest.status == "in_progress"
        ).count()
        
        completed_count = MaintenanceRequest.query.filter(
            MaintenanceRequest.property_id.in_(property_ids),
            MaintenanceRequest.status == "completed"
        ).count()
        
        # Calculate average resolution time
        resolved_requests = MaintenanceRequest.query.filter(
            MaintenanceRequest.property_id.in_(property_ids),
            MaintenanceRequest.status == "completed",
            MaintenanceRequest.completed_at.isnot(None)
        ).all()
        
        avg_resolution_days = 0
        if resolved_requests:
            total_resolution_time = sum(
                (req.completed_at - req.created_at).total_seconds() / 86400  # Convert to days
                for req in resolved_requests if req.completed_at and req.created_at
            )
            avg_resolution_days = round(total_resolution_time / len(resolved_requests), 1)
        
        return jsonify({
            "maintenance_data": {
                "open": open_count,
                "in_progress": in_progress_count,
                "completed": completed_count,
                "avg_resolution_days": avg_resolution_days
            }
        }), 200
    except SQLAlchemyError as e:
        logger.error(f"Database error in maintenance stats: {str(e)}")
        return jsonify({"error": "Failed to retrieve maintenance stats"}), 500

@jwt_required()
def get_tenant_stats():
    """
    Get tenant statistics for the landlord's properties
    
    Returns:
        JSON with tenant data
    """
    try:
        user_id = get_jwt_identity()
        
        # Get landlord's properties
        properties = Property.query.filter_by(landlord_id=user_id).all()
        property_ids = [p.id for p in properties]
        
        if not property_ids:
            return jsonify({"tenant_data": []}), 200
        
        # Count tenants per property
        tenant_counts = []
        for prop in properties:
            tenant_count = TenantProperty.query.filter(
                TenantProperty.property_id == prop.id
            ).count()
            
            tenant_counts.append({
                "property_id": prop.id,
                "property_name": prop.name,
                "tenant_count": tenant_count
            })
        
        # Count total tenants
        total_tenant_count = TenantProperty.query.filter(
            TenantProperty.property_id.in_(property_ids)
        ).distinct(TenantProperty.tenant_id).count()
        
        # Count tenants with leases expiring in next 90 days
        expiring_soon_count = TenantProperty.query.filter(
            TenantProperty.property_id.in_(property_ids),
            TenantProperty.end_date.isnot(None),
            TenantProperty.end_date.between(datetime.utcnow(), datetime.utcnow() + timedelta(days=90))
        ).count()
        
        return jsonify({
            "tenant_data": {
                "properties": tenant_counts,
                "total_tenants": total_tenant_count,
                "leases_expiring_soon": expiring_soon_count
            }
        }), 200
    except SQLAlchemyError as e:
        logger.error(f"Database error in tenant stats: {str(e)}")
        return jsonify({"error": "Failed to retrieve tenant stats"}), 500
