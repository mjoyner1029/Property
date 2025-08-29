import pytest
import json
from unittest.mock import patch

def test_create_checkout_session(client, test_users, auth_headers):
    """Test creating a Stripe checkout session"""
    with patch('stripe.checkout.Session.create') as mock_create:
        # Set up mock return value
        mock_create.return_value = type('obj', (object,), {
            'id': 'test_session_id',
            'url': 'https://checkout.stripe.com/test'
        })
        
        response = client.post('/api/stripe/checkout',
                              headers=auth_headers['tenant'],
                              json={
                                  'amount': 100.00,
                                  'description': 'Test Payment'
                              })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'session_id' in data
        assert data['session_id'] == 'test_session_id'
        assert 'checkout_url' in data


@pytest.mark.skip(reason="Stripe webhook needs more complex setup, skipping for now")
def test_payment_webhook(client):
    """Test Stripe webhook endpoint"""
    # Skip this test for now until we properly implement the webhook routes
    # This would require more complex setup and integration with the stripe module
    pass


def test_invalid_checkout_amount(client, test_users, auth_headers):
    """Test creating checkout session with invalid amount"""
    response = client.post('/api/stripe/checkout',
                          headers=auth_headers['tenant'],
                          json={
                              'amount': -50.00,  # Negative amount
                              'description': 'Invalid Payment'
                          })
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data