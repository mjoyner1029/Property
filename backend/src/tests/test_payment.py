import pytest
import json
from datetime import datetime, timedelta

from ..models.invoice import Invoice
from ..models.payment import Payment
from ..models.tenant_property import TenantProperty

@pytest.fixture(scope='function')
def setup_tenant_property(session, test_users, test_property):
    """Setup tenant-property relationship for payment tests"""
    # Associate the tenant with the property
    tenant_property = TenantProperty(
        tenant_id=test_users['tenant'].id,
        property_id=test_property['property'].id,
        unit_id=test_property['units'][0].id,
        status='active',
        start_date=datetime.utcnow().date(),
        end_date=datetime.utcnow().replace(year=datetime.utcnow().year + 1).date(),
        rent_amount=1200
    )
    session.add(tenant_property)
    session.commit()
    return tenant_property

@pytest.fixture(scope='function')
def test_invoice(session, test_users, test_property, setup_tenant_property):
    """Create test invoice for testing"""
    invoice = Invoice(
        landlord_id=test_users['landlord'].id,
        tenant_id=test_users['tenant'].id,
        property_id=test_property['property'].id,
        unit_id=test_property['units'][0].id,
        amount=1200.00,
        description='Rent for current month',
        due_date=(datetime.utcnow() + timedelta(days=10)).date(),
        status='due',
        invoice_number=f'INV-{datetime.now().strftime("%Y%m%d")}-{test_users["tenant"].id}',
        category='rent',
        created_at=datetime.utcnow()
    )
    session.add(invoice)
    session.commit()
    return invoice


def test_create_invoice(client, test_users, auth_headers, test_property, setup_tenant_property):
    """Test creating an invoice"""
    response = client.post('/api/invoices',
                          headers=auth_headers['landlord'],
                          json={
                              'tenant_id': test_users['tenant'].id,
                              'amount': 100.00,
                              'description': 'Utility charges',
                              'due_date': (datetime.utcnow() + timedelta(days=15)).strftime('%Y-%m-%d'),
                              'category': 'utilities'
                          })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['invoice']['amount'] == 100.0
    assert data['invoice']['status'] == 'due'


def test_get_tenant_invoices(client, test_users, auth_headers, test_invoice):
    """Test getting invoices for a tenant"""
    response = client.get('/api/invoices/tenant',
                         headers=auth_headers['tenant'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'invoices' in data
    assert len(data['invoices']) >= 1
    assert data['invoices'][0]['amount'] == 1200.0


def test_get_landlord_invoices(client, test_users, auth_headers, test_invoice):
    """Test getting invoices for a landlord"""
    response = client.get('/api/invoices/landlord',
                         headers=auth_headers['landlord'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'invoices' in data
    assert len(data['invoices']) >= 1


def test_mark_invoice_paid(client, test_users, auth_headers, test_invoice):
    """Test marking an invoice as paid"""
    invoice_id = test_invoice.id
    response = client.put(f'/api/invoices/{invoice_id}/paid',
                         headers=auth_headers['landlord'],
                         json={
                             'payment_method': 'cash',
                             'amount': 1200.00
                         })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['invoice']['status'] == 'paid'
    assert 'payment_date' in data['invoice']


def test_create_payment(client, test_users, auth_headers, test_invoice):
    """Test creating a payment for an invoice"""
    invoice_id = test_invoice.id
    response = client.post('/api/payments',
                          headers=auth_headers['tenant'],
                          json={
                              'invoice_id': invoice_id,
                              'amount': 1200.00,
                              'payment_method': 'bank_transfer',
                              'notes': 'Monthly rent payment'
                          })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['payment']['invoice_id'] == invoice_id
    assert data['payment']['amount'] == 1200.0
    assert data['payment']['status'] == 'pending'