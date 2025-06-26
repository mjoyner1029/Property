def test_invite_tenant(client):
    res = client.post("/api/invite/tenant", json={
        "email": "tenant@example.com",
        "landlord_id": 1
    })
    assert res.status_code == 200
