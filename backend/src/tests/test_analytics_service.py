import pytest
from datetime import datetime, timedelta

from ..services.analytics_service import AnalyticsService
from ..models.payment import Payment
from ..models.maintenance_request import MaintenanceRequest
from ..models.invoice import Invoice

@pytest.fixture
def setup_analytics_data(session, test_users, test_property):
    """Set up test data for analytics"""
    landlord_id = test_users['landlord'].id
    tenant_id = test_users['tenant'].id
    property_id = test_property['property_id']
    
    # Add payments
    for i in range(3):
        payment = Payment(
            tenant_id=tenant_id,
            landlord_id=landlord_id,
            amount=1000 + i * 100,
            payment_method='card',
            status='completed',
            created_at=datetime.utcnow() - timedelta(days=i*30)
        )
        session.add(payment)
    
    # Add maintenance requests
    for i in range(2):
        status = 'open' if i == 0 else 'in_progress'
        request = MaintenanceRequest(
            tenant_id=tenant_id,
            landlord_id=landlord_id,
            property_id=property_id,
            title=f'Analytics Test {i}',
            description='Test description',
            priority='medium',
            status=status,
            created_at=datetime.utcnow() - timedelta(days=i*3)
        )
        session.add(request)
    
    # Add invoices
        for i in range(2):
            status = 'due' if i == 0 else 'paid'
            import uuid
            unique_id = uuid.uuid4().hex[:8]
            invoice = Invoice(
                tenant_id=tenant_id,
                landlord_id=landlord_id,
                property_id=property_id,
                amount=1200,
                description=f'Test Invoice {i}',
                due_date=(datetime.utcnow() + timedelta(days=15 - i*30)).date(),
                status=status,
                invoice_number=f'TEST-{i}-{unique_id}',
                category='rent',
                created_at=datetime.utcnow() - timedelta(days=i*30)
            )
        session.add(invoice)
    
    session.commit()


def test_analytics_dashboard_stats(session, test_users, setup_analytics_data):
    """Test getting dashboard stats via analytics service"""
    landlord_id = test_users['landlord'].id
    
    stats, error = AnalyticsService.get_landlord_dashboard_stats(landlord_id)
    
    assert error is None
    assert stats is not None
    assert 'property_count' in stats
    assert 'unit_count' in stats
    assert 'tenant_count' in stats
    assert 'revenue_current_month' in stats
    assert 'outstanding_rent' in stats
    assert 'open_maintenance_requests' in stats
    
    # We should have at least one open maintenance request
    assert stats['open_maintenance_requests'] >= 1
    
    # We should have some outstanding rent
    assert stats['outstanding_rent'] > 0


def test_analytics_revenue_data(session, test_users, setup_analytics_data):
    """Test getting revenue analytics"""
    landlord_id = test_users['landlord'].id
    
    # Test monthly period
    revenue_data, error = AnalyticsService.get_revenue_analytics(
        landlord_id, 
        period='monthly',
        start_date=(datetime.utcnow() - timedelta(days=90)).date(),
        end_date=datetime.utcnow().date()
    )
    
    assert error is None
    assert len(revenue_data) > 0
    
    # Check data structure
    first_entry = revenue_data[0]
    assert 'period' in first_entry
    assert 'revenue' in first_entry
    assert 'payment_count' in first_entry
    
    # Test revenue value
    assert first_entry['revenue'] > 0