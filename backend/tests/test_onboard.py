def test_onboard_tenant(client):
    res = client.post("/api/onboard/tenant", json={
        "full_name": "Jane Doe",
        "phone": "1234567890",
        "property_code": "ABC123"
    })
    assert res.status_code in [200, 201]
