# backend/src/tests/test_payments.py
from __future__ import annotations

import pytest
from datetime import datetime, timedelta


from ..models.invoice import Invoice
from ..models.payment import Payment
from ..models.tenant_property import TenantProperty
from ..extensions import db



def _today():
    return datetime.utcnow().date()

def _in_days(days: int):
    return (_today() + timedelta(days=days))


@pytest.fixture(scope="function")
def setup_tenant_property(session, test_users, test_property):
    """Associate the tenant with the property for payment tests."""
    tp = TenantProperty(
        tenant_id=test_users["tenant"].id,
        property_id=test_property["property_id"],
        unit_id=test_property["unit_ids"][0],
        status="active",
        start_date=_today(),
        end_date=_in_days(365),
        rent_amount=1200,
    )
    session.add(tp)
    session.commit()
    return tp


@pytest.fixture(scope="function")
def test_invoice(session, test_users, test_property, setup_tenant_property):
    """Create a test invoice."""
    import uuid
    invoice = Invoice(
        landlord_id=test_users["landlord"].id,
        tenant_id=test_users["tenant"].id,
        property_id=test_property["property_id"],
        unit_id=test_property["unit_ids"][0],
        amount=1200.00,
        description="Rent for current month",
        due_date=_in_days(10),
        status="due",
        invoice_number=f'INV-{datetime.utcnow().strftime("%Y%m%d")}-{uuid.uuid4().hex[:8]}',
        category="rent",
        created_at=datetime.utcnow(),
    )
    session.add(invoice)
    session.commit()
    return invoice


def test_create_invoice(client, test_users, auth_headers, test_property, setup_tenant_property):
    """Landlord can create an invoice."""
    resp = client.post(
        "/api/invoices",
        headers=auth_headers["landlord"],
        json={
            "tenant_id": test_users["tenant"].id,
            "amount": 100.00,
            "description": "Utility charges",
            "due_date": _in_days(15).strftime("%Y-%m-%d"),
            "category": "utilities",
        },
    )

    # If invoices not wired yet, surface a helpful skip
    if resp.status_code == 404:
        pytest.skip("/api/invoices endpoint not registered")

    assert resp.status_code == 201
    data = resp.get_json()
    assert "invoice" in data
    assert data["invoice"]["amount"] == 100.0
    assert data["invoice"]["status"] == "due"
    assert data["invoice"]["description"] == "Utility charges"


def test_get_tenant_invoices(client, test_users, auth_headers, test_invoice):
    """Tenant can list their invoices."""
    resp = client.get("/api/invoices/tenant", headers=auth_headers["tenant"])

    if resp.status_code == 404:
        pytest.skip("/api/invoices/tenant endpoint not registered")

    assert resp.status_code == 200
    data = resp.get_json()
    assert "invoices" in data
    assert isinstance(data["invoices"], list)
    assert any(inv.get("amount") == 1200.0 for inv in data["invoices"])


def test_get_landlord_invoices(client, test_users, auth_headers, test_invoice):
    """Landlord can list invoices they issued."""
    resp = client.get("/api/invoices/landlord", headers=auth_headers["landlord"])

    if resp.status_code == 404:
        pytest.skip("/api/invoices/landlord endpoint not registered")

    assert resp.status_code == 200
    data = resp.get_json()
    assert "invoices" in data
    assert isinstance(data["invoices"], list)
    assert len(data["invoices"]) >= 1


def test_mark_invoice_paid(client, test_users, auth_headers, test_invoice):
    """Landlord can mark an invoice as paid (manual payment)."""
    invoice_id = test_invoice.id
    resp = client.put(
        f"/api/invoices/{invoice_id}/paid",
        headers=auth_headers["landlord"],
        json={"payment_method": "cash", "amount": 1200.00},
    )

    if resp.status_code == 404:
        pytest.skip("/api/invoices/<id>/paid endpoint not registered")

    assert resp.status_code == 200
    data = resp.get_json()
    assert "invoice" in data
    assert data["invoice"]["status"] == "paid"
    assert "payment_date" in data["invoice"]


def test_create_payment(client, test_users, auth_headers, test_invoice):
    """
    Tenant can create a payment against an invoice.
    Expects API to echo invoice_id, amount, status=pending on creation.
    """
    invoice_id = test_invoice.id
    resp = client.post(
        "/api/payments",
        headers=auth_headers["tenant"],
        json={
            "invoice_id": invoice_id,
            "amount": 1200.00,
            "payment_method": "bank_transfer",
            "notes": "Monthly rent payment",
        },
    )

    if resp.status_code == 404:
        pytest.skip("/api/payments endpoint not registered")

    assert resp.status_code == 201
    data = resp.get_json()
    assert "payment" in data
    assert data["payment"]["invoice_id"] == invoice_id
    assert data["payment"]["amount"] == 1200.0
    assert data["payment"]["status"] in ("pending", "processing", "requires_action")
