def test_admin_get_users(client):
    res = client.get("/api/admin/users")
    assert res.status_code == 200
