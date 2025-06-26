def test_get_notifications(client):
    res = client.get("/api/notifications/1")
    assert res.status_code == 200
