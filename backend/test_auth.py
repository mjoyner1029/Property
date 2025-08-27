# backend/test_auth.py
import pytest
from flask_jwt_extended import create_access_token, decode_token

from src.app import create_app


@pytest.fixture(scope="module")
def app():
    """Fixture for creating the Flask app."""
    app = create_app()
    with app.app_context():
        yield app


def test_jwt_token_roundtrip(app):
    """Ensure JWT tokens can be created and decoded correctly."""
    # Create a token for a fake admin user
    payload = "user1"  # Using string for subject to avoid InvalidSubjectError
    token = create_access_token(identity=payload)

    assert isinstance(token, str)
    assert "." in token  # JWT format has 3 segments

    decoded = decode_token(token)

    # Flask-JWT-Extended puts the identity under "sub" by default
    assert decoded["sub"] == payload
    assert "exp" in decoded
    assert "iat" in decoded
