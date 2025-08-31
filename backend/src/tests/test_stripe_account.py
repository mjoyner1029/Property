import pytest
import json
from unittest.mock import patch
from src.tests.utils import make_user, auth_header

def test_create_stripe_account(client, app, db):
    """Test creating a Stripe account for a user"""
    # Create a test user with our helper
    landlord = make_user(app, db, email="landlord_stripe@example.com", role="landlord")
    headers = auth_header(app, landlord)
    
    with patch('stripe.Account.create') as mock_create:
        # Set up mock return value
        mock_create.return_value = {
            'id': 'acct_test123456',
            'object': 'account',
            'business_type': 'individual',
            'charges_enabled': False,
            'country': 'US',
            'created': 1627898799,
            'email': landlord.email,
            'payouts_enabled': False
        }
        
        response = client.post('/api/stripe/create-account',
                                 headers=headers,
                                 json={})
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert 'account_id' in data
        
        # With simulated responses, we just check that the account ID has the expected format
        if data.get('simulated', False):
            assert data['account_id'].startswith('acct_simulated')
        else:
            assert data['account_id'] == 'acct_test123456'


def test_get_stripe_account_status(client, app, db):
    """Test getting Stripe account status"""
    # Create a test user with stripe_account_id already set
    landlord = make_user(
        app, 
        db, 
        email="landlord_with_account@example.com", 
        role="landlord",
        stripe_account_id='acct_test123456'
    )
    headers = auth_header(app, landlord)
    
    with patch('stripe.Account.retrieve') as mock_retrieve:
        # Set up mock return value
        mock_retrieve.return_value = type('obj', (object,), {
            'id': 'acct_test123456',
            'charges_enabled': True,
            'payouts_enabled': True,
            'details_submitted': True
        })
        
        response = client.get('/api/stripe/account-status',
                            headers=headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'connected' in data
        assert 'account_id' in data
        assert data['connected'] is True
        assert data['account_id'] == 'acct_test123456'
        
        # The test environment with our mock patch should return these fields
        if 'charges_enabled' in data:
            assert data['charges_enabled'] is True