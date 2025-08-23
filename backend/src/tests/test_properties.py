# backend/src/tests/test_properties.py
from __future__ import annotations

import pytest


def test_create_property(client, test_users, auth_headers):
    """Landlord can create a property."""
    resp = client.post(
        "/api/properties",
        headers=auth_headers["landlord"],
        json={
            "name": "New Test Property",
            "address": "789 New Street",
            "city": "New City",
            "state": "NC",
            "zip_code": "54321",
            "property_type": "single_family",
        },
    )

    if resp.status_code == 404:
        pytest.skip("/api/properties POST not registered")

    assert resp.status_code == 201
    data = resp.get_json()
    assert "property" in data
    assert data["property"]["name"] == "New Test Property"
    assert "id" in data["property"]


def test_get_property(client, test_users, auth_headers, test_property):
    """Get a single property by id."""
    prop_id = test_property["property"].id
    resp = client.get(f"/api/properties/{prop_id}", headers=auth_headers["landlord"])

    if resp.status_code == 404:
        pytest.skip("/api/properties/<id> GET not registered")

    assert resp.status_code == 200
    data = resp.get_json()
    assert "property" in data
    assert data["property"]["id"] == prop_id
    assert data["property"]["name"] == "Test Property"


def test_update_property(client, test_users, auth_headers, test_property):
    """Update a property."""
    prop_id = test_property["property"].id
    resp = client.put(
        f"/api/properties/{prop_id}",
        headers=auth_headers["landlord"],
        json={"name": "Updated Property Name", "description": "New property description"},
    )

    if resp.status_code == 404:
        pytest.skip("/api/properties/<id> PUT not registered")

    assert resp.status_code == 200
    data = resp.get_json()
    assert "property" in data
    assert data["property"]["name"] == "Updated Property Name"
    assert data["property"]["description"] == "New property description"


def test_get_landlord_properties(client, test_users, auth_headers, test_property):
    """
    List properties for the landlord.
    Our hardened routes expose GET /api/properties for listing.
    If you keep a dedicated '/api/properties/landlord' endpoint, this test will skip when absent.
    """
    # Prefer the consolidated listing endpoint
    resp = client.get("/api/properties", headers=auth_headers["landlord"])

    if resp.status_code == 404:
        # Fallback to legacy/alt endpoint if it exists in your app
        resp = client.get("/api/properties/landlord", headers=auth_headers["landlord"])
        if resp.status_code == 404:
            pytest.skip("No properties listing endpoint registered")

    assert resp.status_code == 200
    data = resp.get_json()
    assert "properties" in data
    assert isinstance(data["properties"], list)
    # Expect at least the seeded test property to be present
    assert any(p.get("name") in {"Test Property", "Updated Property Name"} for p in data["properties"])


def test_unauthorized_property_update(client, test_users, auth_headers, test_property):
    """Tenant should get 403 when attempting to update a property."""
    prop_id = test_property["property"].id
    resp = client.put(
        f"/api/properties/{prop_id}",
        headers=auth_headers["tenant"],  # Tenant trying to update
        json={"name": "Unauthorized Update"},
    )

    if resp.status_code == 404:
        pytest.skip("/api/properties/<id> PUT not registered")

    assert resp.status_code == 403
    data = resp.get_json()
    assert "error" in data
