import pytest
import json
from unittest.mock import patch
from src.tests.utils import make_user, auth_header

def test_create_checkout_session(client, app, db):
    """Test creating a Stripe checkout session"""
    # Create a test user with stripe_customer_id
    tenant = make_user(
        app, 
        db, 
        email="tenant_with_stripe@example.com", 
        role="tenant",
        stripe_customer_id='cus_test123456'
    )
    headers = auth_header(app, tenant)
    
    with patch('stripe.checkout.Session.create') as mock_create:
        # Set up mock return value
        mock_create.return_value = type('obj', (object,), {
            'id': 'test_session_id',
            'url': 'https://checkout.stripe.com/test'
        })
        
        response = client.post('/api/stripe/checkout',
                              headers=headers,
                              json={
                                  'amount': 100.00,
                                  'description': 'Test Payment'
                              })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'session_id' in data
        
        # Check for simulated response (when STRIPE_SECRET_KEY is not set)
        if 'simulated' in data and data['simulated'] is True:
            assert data['session_id'].startswith('cs_simulated')
        else:
            assert data['session_id'] == 'test_session_id'
            
        assert 'checkout_url' in data


@pytest.mark.skip(reason="Stripe webhook needs more complex setup, skipping for now")
def test_payment_webhook(client):
    """Test Stripe webhook endpoint"""
    # Skip this test for now until we properly implement the webhook routes
    # This would require more complex setup and integration with the stripe module
    pass


def test_invalid_checkout_amount(client, app, db):
    """Test creating checkout session with invalid amount"""
    # Create a test user
    tenant = make_user(
        app, 
        db, 
        email="tenant_test_invalid@example.com", 
        role="tenant"
    )
    headers = auth_header(app, tenant)
    
    response = client.post('/api/stripe/checkout',
                          headers=headers,
                          json={
                              'amount': -50.00,  # Negative amount
                              'description': 'Invalid Payment'
                          })
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data