import pytest
import json
from unittest.mock import patch

def test_create_stripe_account(client, test_users, auth_headers):
    """Test creating a Stripe account for a user"""
    with patch('stripe.Account.create') as mock_create:
        # Set up mock return value
        mock_create.return_value = {
            'id': 'acct_test123456',
            'object': 'account',
            'business_type': 'individual',
            'charges_enabled': False,
            'country': 'US',
            'created': 1627898799,
            'email': test_users['landlord'].email,
            'payouts_enabled': False
        }
        
        response = client.post('/api/stripe/create-account',
                             headers=auth_headers['landlord'])
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'account_id' in data
        assert data['account_id'] == 'acct_test123456'


def test_get_stripe_account_status(client, test_users, auth_headers):
    """Test getting Stripe account status"""
    with patch('stripe.Account.retrieve') as mock_retrieve:
        # Set up mock return value
        mock_retrieve.return_value = {
            'id': 'acct_test123456',
            'charges_enabled': True,
            'payouts_enabled': True,
            'details_submitted': True
        }
        
        # Assume the user has a stripe_account_id in their profile
        test_users['landlord'].stripe_account_id = 'acct_test123456'
        
        response = client.get('/api/stripe/account-status',
                            headers=auth_headers['landlord'])
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'account_status' in data
        assert data['account_status']['charges_enabled'] is True