def test_get_notifications(client):
    res = client.get("/api/notifications/1")
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)

def test_create_notification(client):
    res = client.post("/api/notifications", json={
        "user_id": 1,
        "title": "Test Notification",
        "message": "This is a test",
        "type": "info"
    })
    assert res.status_code in [200, 201]
