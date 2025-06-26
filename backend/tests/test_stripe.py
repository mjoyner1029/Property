def test_create_stripe_account(client):
    res = client.post("/api/stripe/create-account", json={"user_id": 1})
    assert res.status_code == 200
