import pytest
import json
from datetime import datetime, timedelta

def test_end_to_end_tenant_flow(client, test_users, auth_headers, test_property, session):
    """Test complete tenant flow from registration to payment"""
    # 1. Register new tenant
    response = client.post('/api/auth/register', json={
        'name': 'Integration Test Tenant',
        'email': 'integration_tenant@example.com',
        'password': 'Password123!',
        'role': 'tenant'
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    tenant_id = data['user']['id']
    
    # Create tenant JWT for subsequent requests
    from flask_jwt_extended import create_access_token
    tenant_token = create_access_token(identity=tenant_id)
    tenant_headers = {'Authorization': f'Bearer {tenant_token}'}
    
    # 2. Complete profile
    response = client.put('/api/users/profile', 
                         headers=tenant_headers,
                         json={
                             'phone': '555-123-7890',
                             'tenant_profile': {
                                 'date_of_birth': '1990-01-01',
                                 'employment_status': 'employed',
                                 'employer': 'Test Company'
                             }
                         })
    assert response.status_code == 200
    
    # 3. Landlord creates lease for tenant
    start_date = datetime.utcnow().date()
    end_date = (datetime.utcnow() + timedelta(days=365)).date()
    
    response = client.post('/api/leases',
                         headers=auth_headers['landlord'],
                         json={
                             'tenant_id': tenant_id,
                             'property_id': test_property['property'].id,
                             'unit_id': test_property['units'][0].id,
                             'start_date': start_date.strftime('%Y-%m-%d'),
                             'end_date': end_date.strftime('%Y-%m-%d'),
                             'rent_amount': 1200.00,
                             'security_deposit': 1200.00
                         })
    assert response.status_code == 201
    lease_data = json.loads(response.data)
    lease_id = lease_data['lease']['id']
    
    # 4. Tenant accepts lease
    response = client.put(f'/api/leases/{lease_id}/accept',
                         headers=tenant_headers)
    assert response.status_code == 200
    
    # 5. Landlord creates invoice
    response = client.post('/api/invoices',
                         headers=auth_headers['landlord'],
                         json={
                             'tenant_id': tenant_id,
                             'amount': 1200.00,
                             'description': 'First month rent',
                             'due_date': (datetime.utcnow() + timedelta(days=7)).strftime('%Y-%m-%d'),
                             'category': 'rent'
                         })
    assert response.status_code == 201
    invoice_data = json.loads(response.data)
    invoice_id = invoice_data['invoice']['id']
    
    # 6. Tenant submits maintenance request
    response = client.post('/api/maintenance',
                         headers=tenant_headers,
                         json={
                             'property_id': test_property['property'].id,
                             'title': 'Broken faucet',
                             'description': 'Kitchen faucet is leaking',
                             'priority': 'medium'
                         })
    assert response.status_code == 201
    request_data = json.loads(response.data)
    request_id = request_data['request']['id']
    
    # 7. Landlord updates maintenance request
    response = client.put(f'/api/maintenance/{request_id}',
                         headers=auth_headers['landlord'],
                         json={
                             'status': 'in_progress',
                             'notes': 'Scheduled repair for tomorrow'
                         })
    assert response.status_code == 200
    
    # 8. Tenant makes payment for invoice
    # Mock payment process since we can't test actual payment processing
    response = client.post('/api/payments',
                         headers=tenant_headers,
                         json={
                             'invoice_id': invoice_id,
                             'amount': 1200.00,
                             'payment_method': 'card'
                         })
    assert response.status_code == 201
    payment_data = json.loads(response.data)
    payment_id = payment_data['payment']['id']
    
    # 9. Landlord marks payment as completed
    response = client.put(f'/api/payments/{payment_id}/complete',
                         headers=auth_headers['landlord'])
    assert response.status_code == 200
    
    # 10. Check final state - invoice should be paid
    response = client.get(f'/api/invoices/{invoice_id}',
                         headers=tenant_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['invoice']['status'] == 'paid'
    
    # Clean up test data
    from ..models.user import User
    test_user = User.query.get(tenant_id)
    if test_user:
        session.delete(test_user)
        session.commit()


def test_end_to_end_landlord_flow(client, test_users, auth_headers, session):
    """Test complete landlord flow from property creation to tenant management"""
    landlord_id = test_users['landlord'].id
    
    # 1. Create property
    response = client.post('/api/properties',
                         headers=auth_headers['landlord'],
                         json={
                             'name': 'Integration Test Property',
                             'address': '789 Integration Ave',
                             'city': 'Test City',
                             'state': 'TS',
                             'zip_code': '12345',
                             'property_type': 'apartment'
                         })
    assert response.status_code == 201
    data = json.loads(response.data)
    property_id = data['property']['id']
    
    # 2. Add units to property
    for i in range(2):
        response = client.post('/api/units',
                             headers=auth_headers['landlord'],
                             json={
                                 'property_id': property_id,
                                 'unit_number': f'{i+1}01',
                                 'bedrooms': 2,
                                 'bathrooms': 1,
                                 'square_feet': 900,
                                 'rent_amount': 1200.00
                             })
        assert response.status_code == 201
    
    # Get units for the property
    response = client.get(f'/api/units/property/{property_id}',
                         headers=auth_headers['landlord'])
    assert response.status_code == 200
    units_data = json.loads(response.data)
    unit_id = units_data['units'][0]['id']
    
    # 3. Invite tenant
    response = client.post('/api/invites/tenant',
                         headers=auth_headers['landlord'],
                         json={
                             'email': 'new_tenant@example.com',
                             'property_id': property_id,
                             'unit_id': unit_id
                         })
    assert response.status_code in [200, 201]  # 200 if existing tenant, 201 if new
    
    # 4. Create maintenance task for property
    response = client.post('/api/maintenance/task',
                         headers=auth_headers['landlord'],
                         json={
                             'property_id': property_id,
                             'title': 'Regular Inspection',
                             'description': 'Quarterly property inspection',
                             'scheduled_date': (datetime.utcnow() + timedelta(days=14)).strftime('%Y-%m-%d'),
                             'assigned_to': landlord_id
                         })
    assert response.status_code == 201
    
    # 5. Generate analytics report
    response = client.get('/api/analytics/property/{property_id}',
                         headers=auth_headers['landlord'])
    assert response.status_code == 200
    
    # 6. Upload property document
    from io import BytesIO
    from werkzeug.datastructures import FileStorage
    
    # Create a mock document
    document = FileStorage(
        stream=BytesIO(b"Test document content"),
        filename="property_info.txt",
        content_type="text/plain",
    )
    
    response = client.post('/api/documents',
                         headers=auth_headers['landlord'],
                         data={
                             'file': document,
                             'name': 'Property Information',
                             'description': 'General information about the property',
                             'document_type': 'property_info',
                             'property_id': property_id
                         },
                         content_type='multipart/form-data')
    assert response.status_code == 201
    
    # Clean up test data (just the property, which will cascade delete related data)
    from ..models.property import Property
    test_property = Property.query.get(property_id)
    if test_property:
        session.delete(test_property)
        session.commit()