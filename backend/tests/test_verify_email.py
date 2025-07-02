from itsdangerous import URLSafeTimedSerializer
from src.models.user import User                # ✅ Import User model
from src.extensions import db                   # ✅ Import db (SQLAlchemy instance)

def test_email_verification(client):
    s = URLSafeTimedSerializer("test-secret")
    token = s.dumps("test@example.com", salt="email-verify")

    user = User(email="test@example.com", password_hash="abc", full_name="Test User", role="tenant", is_verified=False)
    db.session.add(user)
    db.session.commit()

    res = client.get(f"/api/verify/{token}")
    assert res.status_code == 200
