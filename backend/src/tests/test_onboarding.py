import pytest
import json

from ..models.onboarding_progress import OnboardingProgress

def test_start_landlord_onboarding(client, test_users, auth_headers):
    """Test starting landlord onboarding"""
    response = client.post('/api/onboarding/start',
                          headers=auth_headers['landlord'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'onboarding' in data
    assert data['onboarding']['role'] == 'landlord'
    assert not data['onboarding']['completed']
    
    # Verify steps are correct
    steps = data['onboarding']['steps']
    step_ids = [step['id'] for step in steps]
    assert 'profile' in step_ids
    assert 'properties' in step_ids


def test_start_tenant_onboarding(client, test_users, auth_headers):
    """Test starting tenant onboarding"""
    response = client.post('/api/onboarding/start',
                          headers=auth_headers['tenant'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'onboarding' in data
    assert data['onboarding']['role'] == 'tenant'
    assert not data['onboarding']['completed']
    
    # Verify steps are correct for tenant
    steps = data['onboarding']['steps']
    step_ids = [step['id'] for step in steps]
    assert 'profile' in step_ids
    assert 'payment' in step_ids


def test_update_onboarding_step(client, test_users, auth_headers, session):
    """Test updating an onboarding step"""
    # Create onboarding record
    onboarding = OnboardingProgress(
        user_id=test_users['landlord'].id,
        role='landlord',
        steps=[
            {"id": "profile", "name": "Basic Profile", "completed": False},
            {"id": "company", "name": "Company Information", "completed": False}
        ],
        current_step='profile',
        completed=False
    )
    session.add(onboarding)
    session.commit()
    
    # Update step
    response = client.put('/api/onboarding/step/profile',
                         headers=auth_headers['landlord'],
                         json={
                             'completed': True,
                             'data': {
                                 'name': 'Updated Name',
                                 'phone': '555-123-4567'
                             }
                         })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['step']['id'] == 'profile'
    assert data['step']['completed'] is True
    
    # Check next step
    assert data['next_step'] == 'company'


def test_complete_onboarding(client, test_users, auth_headers, session):
    """Test completing the onboarding process"""
    # Create onboarding record with all steps completed except last
    onboarding = OnboardingProgress(
        user_id=test_users['tenant'].id,
        role='tenant',
        steps=[
            {"id": "profile", "name": "Basic Profile", "completed": True},
            {"id": "lease", "name": "Lease Details", "completed": True},
            {"id": "payment", "name": "Payment Method", "completed": False}
        ],
        current_step='payment',
        completed=False
    )
    session.add(onboarding)
    session.commit()
    
    # Complete final step
    response = client.put('/api/onboarding/step/payment',
                         headers=auth_headers['tenant'],
                         json={
                             'completed': True,
                             'data': {
                                 'payment_method': 'card',
                                 'card_last4': '4242'
                             }
                         })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['onboarding']['completed'] is True
    
    # All steps should be completed
    for step in data['onboarding']['steps']:
        assert step['completed'] is True