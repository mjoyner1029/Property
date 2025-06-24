# backend/tests/test_auth.py
import pytest
from src.app import create_app
from src.extensions import db

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client

def test_signup(client):
    res = client.post("/api/auth/signup", json={
        "email": "test@example.com",
        "password": "Test1234",
        "full_name": "Test User",
        "role": "tenant",
        "tos_agreed": True
    })
    assert res.status_code == 201
