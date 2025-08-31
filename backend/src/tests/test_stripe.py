import pytest
import json
from datetime import datetime
from unittest.mock import patch, MagicMock
import stripe
from src.tests.utils import make_user, auth_header
from src.extensions import db


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


def test_payment_webhook(client, app, db, monkeypatch):
    """Test Stripe webhook endpoint"""
    import uuid
    from datetime import datetime, date
    from src.models.stripe_event import StripeEvent
    from src.models.invoice import Invoice
    from src.models.payment import Payment
    from src.models.user import User
    from src.models.property import Property
    
    # Mock stripe's API key and webhook secret
    app.config["STRIPE_SECRET_KEY"] = "sk_test_example"
    app.config["STRIPE_WEBHOOK_SECRET"] = None  # Dev mode, no verification
    
    # Use application context for database operations
    with app.app_context():
        # Create a test user, property, invoice and payment
        test_user = User(
            name="Webhook Test User",
            email=f"webhook_test_{uuid.uuid4().hex[:8]}@example.com",
            password="hashed_password",
            role="tenant",
            stripe_customer_id="cus_webhook_test"
        )
        db.session.add(test_user)
        db.session.flush()
        
        test_property = Property(
            name="Webhook Test Property",
            address="123 Webhook St",
            city="Test City",
            state="Test State",
            zip_code="12345",
            landlord_id=test_user.id
        )
        db.session.add(test_property)
        db.session.flush()
        
        # Create test invoice
        test_invoice = Invoice(
            tenant_id=test_user.id,
            landlord_id=test_user.id,  # Using same user as landlord for testing
            property_id=test_property.id,
            amount=100.00,
            amount_cents=10000,  # 100.00 in cents
            currency="USD",
            due_date=datetime.now(),
            status="pending",
            description="Test Invoice for Webhook",
            invoice_number="INV-TEST-" + uuid.uuid4().hex[:8]
        )
        db.session.add(test_invoice)
        db.session.flush()
        
        # Create payment linked to invoice
        test_payment = Payment(
            tenant_id=test_user.id,
            landlord_id=test_user.id,  # Same user as landlord for testing
            invoice_id=test_invoice.id,
            amount=100.00,
            amount_cents=10000,  # 100.00 in cents
            currency="USD",
            status="processing",
            payment_method="card",
            payment_intent_id="pi_webhook_test",
            paid_date=date.today()  # Use date.today() instead of datetime.now()
        )
        db.session.add(test_payment)
        db.session.commit()
    
        # Create a mock Stripe event payload
        event_id = f"evt_{uuid.uuid4().hex[:16]}"
        payload = {
            "id": event_id,
            "object": "event",
            "api_version": "2020-08-27",
            "created": int(datetime.now().timestamp()),
            "data": {
                "object": {
                    "id": "pi_webhook_test",
                    "object": "payment_intent",
                    "amount": 10000,  # in cents
                    "status": "succeeded",
                    "customer": "cus_webhook_test",
                    "metadata": {
                        "invoice_id": str(test_invoice.id)
                    }
                }
            },
            "type": "payment_intent.succeeded"
        }
        
        # Mock stripe.Event.construct_from to return our event
        def mock_construct_from(payload, api_key):
            class MockDataObject:
                def __init__(self, data):
                    self.object = data['object']
                    
                def get(self, key):
                    return self.object.get(key)
            
            class MockEvent:
                def __init__(self, payload):
                    self.id = payload['id']
                    self.type = payload['type']
                    self.api_version = payload['api_version']
                    self.created = payload['created']
                    self.data = MockDataObject(payload['data'])
                    
                def to_dict(self):
                    return payload
            
            event = MockEvent(payload)
            return event
        
        with patch('stripe.Event.construct_from', side_effect=mock_construct_from):
            # Send the webhook
            response = client.post(
                '/webhooks/stripe',
                data=json.dumps(payload),
                headers={'Content-Type': 'application/json', 'Stripe-Signature': 'mock_signature'}
            )
        
        # Check the response
        assert response.status_code == 200
        
        # Verify the event was recorded in database
        stored_event = db.session.query(StripeEvent).filter_by(event_id=event_id).first()
        assert stored_event is not None
        assert stored_event.event_type == "payment_intent.succeeded"
        
        # Verify the payment was updated
        updated_payment = db.session.get(Payment, test_payment.id)
        assert updated_payment.status == "paid"
        
        # Verify invoice was updated to paid
        updated_invoice = db.session.get(Invoice, test_invoice.id)
        assert updated_invoice.status == "paid"


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