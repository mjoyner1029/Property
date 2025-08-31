import pytest
import json
from datetime import datetime, timedelta

from ..models.payment import Payment
from ..services.analytics_service import AnalyticsService
from ..extensions import db


@pytest.fixture(scope='function')
def setup_analytics_data(session, test_users, test_property):
    """Create test data for analytics testing"""
    # Create some payments
    for i in range(3):
        payment = Payment(
            tenant_id=test_users['tenant'].id,
            landlord_id=test_users['landlord'].id,
            amount=1200.00,
            payment_method='card',
            status='completed',
            created_at=datetime.utcnow() - timedelta(days=i*30)  # Different months
        )
        session.add(payment)
    
    session.commit()


def test_dashboard_stats(client, test_users, auth_headers, setup_analytics_data):
    """Test getting landlord dashboard statistics"""
    response = client.get('/api/analytics/dashboard',
                         headers=auth_headers['landlord'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Check that the expected keys are in the response
    expected_keys = [
        'property_count', 'unit_count', 'occupied_units', 
        'vacancy_rate', 'tenant_count', 'revenue_current_month',
        'outstanding_rent', 'open_maintenance_requests'
    ]
    
    for key in expected_keys:
        assert key in data['stats']


def test_revenue_analytics(client, test_users, auth_headers, setup_analytics_data):
    """Test getting revenue analytics"""
    response = client.get('/api/analytics/revenue?period=monthly',
                         headers=auth_headers['landlord'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert 'revenue_data' in data
    assert len(data['revenue_data']) > 0
    
    # Each revenue entry should have period, revenue, and payment_count
    for entry in data['revenue_data']:
        assert 'period' in entry
        assert 'revenue' in entry
        assert 'payment_count' in entry


def test_occupancy_analytics(client, test_users, auth_headers, setup_analytics_data):
    """Test getting occupancy analytics"""
    response = client.get('/api/analytics/occupancy',
                         headers=auth_headers['landlord'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert 'occupancy_data' in data
    
    # Check data format if there are properties
    if len(data['occupancy_data']) > 0:
        for property_data in data['occupancy_data']:
            assert 'property_id' in property_data
            assert 'property_name' in property_data
            assert 'occupancy_rate' in property_data


def test_analytics_service_direct(session, test_users, setup_analytics_data):
    """Test analytics service directly"""
    landlord_id = test_users['landlord'].id
    
    # Test dashboard stats
    stats, error = AnalyticsService.get_landlord_dashboard_stats(landlord_id)
    
    assert error is None
    assert stats is not None
    assert 'property_count' in stats
    assert 'revenue_current_month' in stats
    
    # Test revenue analytics
    revenue_data, error = AnalyticsService.get_revenue_analytics(landlord_id)
    
    assert error is None
    assert len(revenue_data) > 0