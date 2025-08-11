from ..models.property import Property
from ..models.unit import Unit
from ..models.tenant_property import TenantProperty
from ..models.lease import Lease
from ..models.invoice import Invoice
from ..models.payment import Payment
from ..models.maintenance_request import MaintenanceRequest
from ..extensions import db  
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func, and_, or_, case, extract
from datetime import datetime, timedelta

class AnalyticsService:
    @staticmethod
    def get_landlord_dashboard_stats(landlord_id):
        """Get overview statistics for landlord dashboard"""
        try:
            # Get current date for calculations
            today = datetime.utcnow().date()
            current_month = today.month
            current_year = today.year
            
            # Total properties
            property_count = Property.query.filter_by(landlord_id=landlord_id).count()
            
            # Total units
            unit_count = Unit.query.join(
                Property, Property.id == Unit.property_id
            ).filter(
                Property.landlord_id == landlord_id
            ).count()
            
            # Occupied units
            occupied_units = Unit.query.join(
                Property, Property.id == Unit.property_id
            ).filter(
                Property.landlord_id == landlord_id,
                Unit.status == 'occupied'
            ).count()
            
            # Calculate vacancy rate
            vacancy_rate = 0 if unit_count == 0 else round((1 - (occupied_units / unit_count)) * 100, 2)
            
            # Total active tenants
            tenant_count = TenantProperty.query.join(
                Property, Property.id == TenantProperty.property_id
            ).filter(
                Property.landlord_id == landlord_id,
                TenantProperty.status == 'active'
            ).count()
            
            # Revenue this month
            revenue = db.session.query(func.sum(Payment.amount)).filter(
                Payment.landlord_id == landlord_id,
                Payment.status == 'completed',
                extract('month', Payment.created_at) == current_month,
                extract('year', Payment.created_at) == current_year
            ).scalar() or 0
            
            # Outstanding rent
            outstanding = db.session.query(func.sum(Invoice.amount)).filter(
                Invoice.landlord_id == landlord_id,
                Invoice.status.in_(['due', 'overdue']),
                Invoice.category == 'rent'
            ).scalar() or 0
            
            # Open maintenance requests
            maintenance_count = MaintenanceRequest.query.filter(
                MaintenanceRequest.landlord_id == landlord_id,
                MaintenanceRequest.status.in_(['open', 'in_progress'])
            ).count()
            
            # Expiring leases (next 30 days)
            expiring_leases = Lease.query.filter(
                Lease.landlord_id == landlord_id,
                Lease.status == 'active',
                Lease.end_date.between(today, today + timedelta(days=30))
            ).count()
            
            return {
                'property_count': property_count,
                'unit_count': unit_count,
                'occupied_units': occupied_units,
                'vacancy_rate': vacancy_rate,
                'tenant_count': tenant_count,
                'revenue_current_month': float(revenue),
                'outstanding_rent': float(outstanding),
                'open_maintenance_requests': maintenance_count,
                'expiring_leases': expiring_leases
            }, None
            
        except SQLAlchemyError as e:
            return None, str(e)
    
    @staticmethod
    def get_revenue_analytics(landlord_id, period='monthly', start_date=None, end_date=None):
        """Get revenue analytics for a landlord"""
        try:
            query = db.session
            
            # Set default date range if not provided
            if not end_date:
                end_date = datetime.utcnow().date()
                
            if not start_date:
                if period == 'monthly':
                    # Last 12 months
                    start_date = end_date.replace(year=end_date.year - 1)
                elif period == 'weekly':
                    # Last 12 weeks
                    start_date = end_date - timedelta(weeks=12)
                else:  # daily
                    # Last 30 days
                    start_date = end_date - timedelta(days=30)
            
            # Format date grouping based on period
            if period == 'monthly':
                date_format = func.date_format(Payment.created_at, '%Y-%m')
            elif period == 'weekly':
                date_format = func.date_format(Payment.created_at, '%Y-%u')
            else:  # daily
                date_format = func.date_format(Payment.created_at, '%Y-%m-%d')
            
            # Query revenue by period
            revenue_data = query.query(
                date_format.label('period'),
                func.sum(case([
                    (Payment.status == 'completed', Payment.amount)
                ], else_=0)).label('revenue'),
                func.count(Payment.id).label('payment_count')
            ).filter(
                Payment.landlord_id == landlord_id,
                Payment.created_at.between(start_date, end_date + timedelta(days=1))
            ).group_by('period').order_by('period').all()
            
            # Format results
            results = [
                {
                    'period': item.period,
                    'revenue': float(item.revenue),
                    'payment_count': item.payment_count
                }
                for item in revenue_data
            ]
            
            return results, None
            
        except SQLAlchemyError as e:
            return [], str(e)
    
    @staticmethod
    def get_occupancy_analytics(landlord_id):
        """Get occupancy statistics for a landlord's properties"""
        try:
            # Get all properties
            properties = Property.query.filter_by(landlord_id=landlord_id).all()
            
            results = []
            for prop in properties:
                # Get units for this property
                units = Unit.query.filter_by(property_id=prop.id).all()
                total_units = len(units)
                
                if total_units == 0:
                    continue
                    
                # Count occupied units
                occupied = sum(1 for unit in units if unit.status == 'occupied')
                
                # Calculate occupancy rate
                occupancy_rate = (occupied / total_units) * 100 if total_units > 0 else 0
                
                # Get current vacancy days (average days vacant for available units)
                vacant_units = [unit for unit in units if unit.status == 'available']
                if vacant_units:
                    total_vacant_days = sum((datetime.utcnow().date() - (unit.last_occupied_date or prop.created_at.date())).days 
                                           for unit in vacant_units)
                    avg_vacant_days = total_vacant_days / len(vacant_units)
                else:
                    avg_vacant_days = 0
                
                results.append({
                    'property_id': prop.id,
                    'property_name': prop.name,
                    'total_units': total_units,
                    'occupied_units': occupied,
                    'occupancy_rate': round(occupancy_rate, 2),
                    'avg_vacant_days': round(avg_vacant_days, 1)
                })
            
            return results, None
            
        except SQLAlchemyError as e:
            return [], str(e)