import logging
from datetime import datetime, timedelta
from sqlalchemy import func, and_
from sqlalchemy.exc import SQLAlchemyError
from src.extensions import db
from src.models.property import Property
from src.models.payment import Payment
from src.models.maintenance_request import MaintenanceRequest
from src.models.tenant_profile import TenantProfile

logger = logging.getLogger(__name__)

def get_financial_overview(landlord_id, period=None):
    """
    Get financial overview for a landlord's properties.
    
    Args:
        landlord_id (int): ID of the landlord
        period (str, optional): Time period for data. Options: "month", "quarter", "year"
    
    Returns:
        Financial metrics including income, expenses, and occupancy rates
    """
    try:
        # Calculate date range based on period
        end_date = datetime.utcnow()
        if period == "month":
            start_date = end_date - timedelta(days=30)
        elif period == "quarter":
            start_date = end_date - timedelta(days=90)
        elif period == "year":
            start_date = end_date - timedelta(days=365)
        else:
            # Default to all-time if period not specified
            start_date = datetime(1970, 1, 1)
            
        # Get properties for landlord
        properties = Property.query.filter_by(landlord_id=landlord_id).all()
        property_ids = [p.id for p in properties]
        
        if not property_ids:
            return {"error": "No properties found for landlord"}, 404
            
        # Calculate income (payments received)
        income_query = db.session.query(
            func.sum(Payment.amount)
        ).filter(
            Payment.property_id.in_(property_ids),
            Payment.status == "paid",
            Payment.paid_date.between(start_date, end_date)
        )
        total_income = income_query.scalar() or 0
        
        # Calculate expected income (all payments due)
        expected_income_query = db.session.query(
            func.sum(Payment.amount)
        ).filter(
            Payment.property_id.in_(property_ids),
            Payment.due_date.between(start_date, end_date)
        )
        total_expected = expected_income_query.scalar() or 0
        
        # Calculate expenses (maintenance costs)
        expenses_query = db.session.query(
            func.sum(MaintenanceRequest.cost)
        ).filter(
            MaintenanceRequest.property_id.in_(property_ids),
            MaintenanceRequest.created_at.between(start_date, end_date)
        )
        total_expenses = expenses_query.scalar() or 0
        
        # Calculate occupancy
        occupied_units = TenantProfile.query.filter(
            TenantProfile.property_id.in_(property_ids),
            TenantProfile.lease_end > datetime.utcnow()
        ).count()
        
        # Get total units (simplified - in a real app, you'd have a units table)
        total_units = sum(p.units for p in properties) if hasattr(properties[0], 'units') else len(properties)
        
        occupancy_rate = (occupied_units / total_units) * 100 if total_units > 0 else 0
        
        return {
            "total_income": total_income,
            "total_expected": total_expected,
            "collection_rate": (total_income / total_expected) * 100 if total_expected > 0 else 0,
            "total_expenses": total_expenses,
            "net_income": total_income - total_expenses,
            "occupancy_rate": occupancy_rate,
            "period": period or "all_time",
            "properties_count": len(properties)
        }, 200
    except SQLAlchemyError as e:
        logger.error(f"Database error in financial overview: {str(e)}")
        return {"error": "Failed to retrieve financial overview"}, 500

def get_property_performance(property_id, period=None):
    """
    Get detailed performance metrics for a specific property.
    
    Args:
        property_id (int): ID of the property
        period (str, optional): Time period for data. Options: "month", "quarter", "year"
    
    Returns:
        Property-specific metrics including income, expenses, tenant history
    """
    try:
        # Calculate date range based on period
        end_date = datetime.utcnow()
        if period == "month":
            start_date = end_date - timedelta(days=30)
        elif period == "quarter":
            start_date = end_date - timedelta(days=90)
        elif period == "year":
            start_date = end_date - timedelta(days=365)
        else:
            # Default to all-time if period not specified
            start_date = datetime(1970, 1, 1)
            
        property_data = Property.query.get(property_id)
        if not property_data:
            return {"error": "Property not found"}, 404
            
        # Calculate income
        income_query = db.session.query(
            func.sum(Payment.amount)
        ).filter(
            Payment.property_id == property_id,
            Payment.status == "paid",
            Payment.paid_date.between(start_date, end_date)
        )
        total_income = income_query.scalar() or 0
        
        # Calculate expenses
        expenses_query = db.session.query(
            func.sum(MaintenanceRequest.cost)
        ).filter(
            MaintenanceRequest.property_id == property_id,
            MaintenanceRequest.created_at.between(start_date, end_date)
        )
        total_expenses = expenses_query.scalar() or 0
        
        # Get maintenance request counts
        maintenance_counts = db.session.query(
            MaintenanceRequest.status,
            func.count(MaintenanceRequest.id)
        ).filter(
            MaintenanceRequest.property_id == property_id,
            MaintenanceRequest.created_at.between(start_date, end_date)
        ).group_by(MaintenanceRequest.status).all()
        
        maintenance_stats = {status: count for status, count in maintenance_counts}
        
        # Get current tenants
        current_tenants = TenantProfile.query.filter(
            TenantProfile.property_id == property_id,
            TenantProfile.lease_end > datetime.utcnow()
        ).count()
        
        return {
            "property": {
                "id": property_data.id,
                "name": property_data.name,
                "address": property_data.address
            },
            "financial": {
                "total_income": total_income,
                "total_expenses": total_expenses,
                "net_income": total_income - total_expenses
            },
            "maintenance": {
                "pending": maintenance_stats.get("pending", 0),
                "in_progress": maintenance_stats.get("in_progress", 0),
                "completed": maintenance_stats.get("completed", 0),
                "total": sum(maintenance_stats.values()) if maintenance_stats else 0
            },
            "occupancy": {
                "current_tenants": current_tenants,
                "vacancy_rate": 0  # Calculate based on units if available
            },
            "period": period or "all_time"
        }, 200
    except SQLAlchemyError as e:
        logger.error(f"Database error in property performance: {str(e)}")
        return {"error": "Failed to retrieve property performance"}, 500

def get_payment_trends(landlord_id):
    """
    Get payment trends over time for a landlord's properties.
    
    Args:
        landlord_id (int): ID of the landlord
    
    Returns:
        Payment trends data for visualization
    """
    try:
        # Get properties for landlord
        properties = Property.query.filter_by(landlord_id=landlord_id).all()
        property_ids = [p.id for p in properties]
        
        if not property_ids:
            return {"error": "No properties found for landlord"}, 404
        
        # Get data for last 12 months
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=365)
        
        # Query monthly payments
        monthly_payments = db.session.query(
            func.date_trunc('month', Payment.paid_date).label('month'),
            func.sum(Payment.amount).label('amount')
        ).filter(
            Payment.property_id.in_(property_ids),
            Payment.status == "paid",
            Payment.paid_date.between(start_date, end_date)
        ).group_by('month').order_by('month').all()
        
        # Format data for frontend chart
        payment_data = [
            {
                "month": month.strftime("%b %Y"),
                "amount": float(amount)
            }
            for month, amount in monthly_payments
        ]
        
        return {
            "payment_trends": payment_data,
            "total_collected": sum(item['amount'] for item in payment_data)
        }, 200
    except SQLAlchemyError as e:
        logger.error(f"Database error in payment trends: {str(e)}")
        return {"error": "Failed to retrieve payment trends"}, 500

def get_maintenance_analytics(landlord_id):
    """
    Get analytics about maintenance requests for a landlord's properties.
    
    Args:
        landlord_id (int): ID of the landlord
    
    Returns:
        Maintenance request analytics
    """
    try:
        # Get properties for landlord
        properties = Property.query.filter_by(landlord_id=landlord_id).all()
        property_ids = [p.id for p in properties]
        
        if not property_ids:
            return {"error": "No properties found for landlord"}, 404
        
        # Get maintenance request statistics
        maintenance_by_status = db.session.query(
            MaintenanceRequest.status,
            func.count(MaintenanceRequest.id)
        ).filter(
            MaintenanceRequest.property_id.in_(property_ids)
        ).group_by(MaintenanceRequest.status).all()
        
        # Calculate average resolution time
        resolved_requests = MaintenanceRequest.query.filter(
            MaintenanceRequest.property_id.in_(property_ids),
            MaintenanceRequest.status == "completed",
            MaintenanceRequest.completed_at.isnot(None)
        ).all()
        
        total_resolution_time = sum(
            (req.completed_at - req.created_at).total_seconds() / 86400  # Convert to days
            for req in resolved_requests
        )
        avg_resolution_days = total_resolution_time / len(resolved_requests) if resolved_requests else 0
        
        return {
            "request_counts": {
                status: count for status, count in maintenance_by_status
            },
            "avg_resolution_days": round(avg_resolution_days, 1),
            "total_requests": sum(count for _, count in maintenance_by_status),
            "properties_count": len(properties)
        }, 200
    except SQLAlchemyError as e:
        logger.error(f"Database error in maintenance analytics: {str(e)}")
        return {"error": "Failed to retrieve maintenance analytics"}, 500