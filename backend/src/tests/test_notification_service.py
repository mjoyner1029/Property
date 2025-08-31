import pytest
import json
from datetime import datetime

from ..services.notification_service import NotificationService
from ..models.notification import Notification
from ..extensions import db


def test_notification_service_create(session, test_users):
    """Test creating notification"""
    user_id = test_users['tenant'].id
    
    notification, error = NotificationService.create_notification(
        user_id=user_id,
        notification_type="info",
        title="Service Test Notification",
        message="This is a test notification from service",
        data={"test": True}
    )
    
    assert error is None
    assert notification is not None
    assert notification.user_id == user_id
    assert notification.title == "Service Test Notification"
    assert notification.read is False
    
    # Check data was serialized correctly
    data = json.loads(notification.data)
    assert data["test"] is True


def test_notification_service_get_user_notifications(session, test_users):
    """Test getting user notifications"""
    user_id = test_users['tenant'].id
    
    # Create some test notifications
    for i in range(3):
        notification = Notification(
            user_id=user_id,
            type='info',
            title=f'Service Test {i}',
            message=f'Test message {i}',
            read=False,
            created_at=datetime.utcnow()
        )
        session.add(notification)
    session.commit()
    
    # Get notifications
    notifications, total, error = NotificationService.get_user_notifications(user_id)
    
    assert error is None
    assert len(notifications) >= 3
    assert total >= 3
    
    # Verify structure of first notification
    first = notifications[0]
    assert 'id' in first
    assert 'title' in first
    assert 'message' in first
    assert 'read' in first
    assert first['read'] is False


def test_notification_service_mark_as_read(session, test_users):
    """Test marking notification as read"""
    user_id = test_users['tenant'].id
    
    # Create test notification
    notification = Notification(
        user_id=user_id,
        type='info',
        title='Read Test',
        message='Test read status',
        read=False,
        created_at=datetime.utcnow()
    )
    session.add(notification)
    session.commit()
    
    # Mark as read
    success, error = NotificationService.mark_notification_as_read(notification.id, user_id)
    
    assert error is None
    assert success is True
    
    # Verify notification is marked read
    updated = db.session.get(Notification, notification.id)
    assert updated.read is True
    assert updated.read_at is not None


def test_notification_service_mark_all_read(session, test_users):
    """Test marking all notifications as read"""
    user_id = test_users['landlord'].id
    
    # Create test notifications
    for i in range(5):
        notification = Notification(
            user_id=user_id,
            type='info',
            title=f'Mark All Test {i}',
            message=f'Test message {i}',
            read=False,
            created_at=datetime.utcnow()
        )
        session.add(notification)
    session.commit()
    
    # Mark all as read
    count, error = NotificationService.mark_all_as_read(user_id)
    
    assert error is None
    assert count >= 5
    
    # Verify all are read
    unread = Notification.query.filter_by(user_id=user_id, read=False).count()
    assert unread == 0