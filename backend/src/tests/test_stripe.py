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


def test_payment_webhook(client):
    """Test Stripe webhook endpoint"""
    with patch('stripe.Webhook.construct_event') as mock_construct:
        # Set up mock return value
        mock_event = {
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'id': 'test_session_id',
                    'metadata': {
                        'invoice_id': '123',
                        'user_id': '456'
                    },
                    'payment_status': 'paid',
                    'amount_total': 10000  # 100.00 in cents
                }
            }
        }
        mock_construct.return_value = mock_event
        
        response = client.post('/api/stripe/webhook',
                              headers={'Stripe-Signature': 'test_signature'},
                              json=mock_event)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'success' in data


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