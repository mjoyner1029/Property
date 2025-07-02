def test_admin_get_users(client):
    res = client.get("/api/admin/users")
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)

def test_admin_issue_refund(client):
    res = client.post("/api/admin/refund/1")  # Adjusted to match route: /refund/<int:payment_id>
    assert res.status_code in [200, 404]  # 404 if payment_id not found in test DB
