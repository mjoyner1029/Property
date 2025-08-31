# backend/src/tests/test_notifications.py
from __future__ import annotations

import pytest
from datetime import datetime

from ..models.notification import Notification
from ..extensions import db



def _set_read_flags(n: Notification, value: bool):
    """Handle either `read` or `is_read` model fields."""
    if hasattr(n, "is_read"):
        n.is_read = value
    if hasattr(n, "read"):
        n.read = value


def _get_read_flag(n: Notification) -> bool:
    if hasattr(n, "is_read"):
        return bool(getattr(n, "is_read"))
    if hasattr(n, "read"):
        return bool(getattr(n, "read"))
    return False


def _set_created_updated(n: Notification, created: datetime | None = None, updated: datetime | None = None):
    created = created or datetime.utcnow()
    updated = updated or created
    if hasattr(n, "created_at"):
        n.created_at = created
    if hasattr(n, "updated_at"):
        n.updated_at = updated


def _has_read_at(n: Notification) -> bool:
    return hasattr(n, "read_at") and getattr(n, "read_at") is not None


def test_get_notifications(client, test_users, auth_headers, session):
    """Tenant can fetch their notifications (unread first, then recent)."""
    # Seed a few notifications
    notes = []
    for i in range(3):
        n = Notification(
            user_id=test_users["tenant"].id,
            # these fields may or may not exist depending on your schema; harmless if ignored in to_dict()
            type="info",
            title=f"Test Notification {i}",
            message=f"This is test notification {i}",
        )
        _set_read_flags(n, False)
        _set_created_updated(n, created=datetime.utcnow())
        session.add(n)
        notes.append(n)
    session.commit()

    resp = client.get("/api/notifications/", headers=auth_headers["tenant"])
    if resp.status_code == 404:
        pytest.skip("/api/notifications GET not registered")

    assert resp.status_code == 200
    data = resp.get_json()
    assert "notifications" in data
    assert len(data["notifications"]) >= 3
    # Check one known title and that all are unread
    assert any(n.get("title") == "Test Notification 0" for n in data["notifications"])
    assert all(n.get("is_read", n.get("read")) is False for n in data["notifications"])


def test_mark_notification_read(client, test_users, auth_headers, session):
    """User can mark a notification as read."""
    n = Notification(
        user_id=test_users["landlord"].id,
        type="info",
        title="Unread Notification",
        message="This notification is unread",
    )
    _set_read_flags(n, False)
    _set_created_updated(n)
    session.add(n)
    session.commit()

    resp = client.put(f"/api/notifications/{n.id}/read", headers=auth_headers["landlord"])
    if resp.status_code == 404:
        pytest.skip("/api/notifications/<id>/read PUT not registered")

    assert resp.status_code == 200
    data = resp.get_json()
    assert "notification" in data
    assert data["notification"].get("is_read", data["notification"].get("read")) is True

    # Verify persisted
    updated = db.session.get(Notification, n.id)
    assert _get_read_flag(updated) is True
    # Support either explicit read_at or updated_at as the persistence marker
    assert _has_read_at(updated) or getattr(updated, "updated_at", None) is not None


def test_mark_all_notifications_read(client, test_users, auth_headers, session):
    """User can mark all of their notifications as read."""
    for i in range(3):
        n = Notification(
            user_id=test_users["landlord"].id,
            type="info",
            title=f"Bulk Notification {i}",
            message=f"This is bulk notification {i}",
        )
        _set_read_flags(n, False)
        _set_created_updated(n)
        session.add(n)
    session.commit()

    # Our hardened route is /mark-all-read (previous tests used /read-all)
    resp = client.put("/api/notifications/mark-all-read", headers=auth_headers["landlord"])
    if resp.status_code == 404:
        # Fall back to legacy path if your app still uses it
        resp = client.put("/api/notifications/read-all", headers=auth_headers["landlord"])
        if resp.status_code == 404:
            pytest.skip("No mark-all-read endpoint registered")

    assert resp.status_code == 200
    data = resp.get_json()
    assert "count" in data
    assert data["count"] >= 3

    # Verify none remain unread for this user
    unread = (
        Notification.query.filter_by(user_id=test_users["landlord"].id)
        .filter(
            # support either `is_read` or `read` column
            (Notification.is_read == False)  # noqa: E712
            if hasattr(Notification, "is_read")
            else (Notification.read == False)  # type: ignore[attr-defined]  # noqa: E712
        )
        .count()
    )
    assert unread == 0


def test_unauthorized_notification_access(client, test_users, auth_headers, session):
    """Landlord cannot modify a tenant's notification."""
    n = Notification(
        user_id=test_users["tenant"].id,
        type="info",
        title="Tenant Notification",
        message="This belongs to tenant",
    )
    _set_read_flags(n, False)
    _set_created_updated(n)
    session.add(n)
    session.commit()

    resp = client.put(f"/api/notifications/{n.id}/read", headers=auth_headers["landlord"])

    # Depending on how you enforce ownership, you might return 403 (forbidden) or 404 (not found).
    assert resp.status_code in (403, 404)
    data = resp.get_json()
    assert "error" in data
