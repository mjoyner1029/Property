import pytest
import json
from datetime import datetime

from ..models.notification import Notification

def test_get_notifications(client, test_users, auth_headers, session):
    """Test getting notifications for a user"""
    # Create test notifications
    notifications = []
    for i in range(3):
        notification = Notification(
            user_id=test_users['tenant'].id,
            type='info',
            title=f'Test Notification {i}',
            message=f'This is test notification {i}',
            read=False,
            created_at=datetime.utcnow()
        )
        session.add(notification)
        notifications.append(notification)
    session.commit()
    
    # Get notifications
    response = client.get('/api/notifications',
                         headers=auth_headers['tenant'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'notifications' in data
    assert len(data['notifications']) >= 3
    
    # Verify notification details
    assert any(n['title'] == 'Test Notification 0' for n in data['notifications'])
    assert all(not n['read'] for n in data['notifications'])


def test_mark_notification_read(client, test_users, auth_headers, session):
    """Test marking a notification as read"""
    # Create unread notification
    notification = Notification(
        user_id=test_users['landlord'].id,
        type='info',
        title='Unread Notification',
        message='This notification is unread',
        read=False,
        created_at=datetime.utcnow()
    )
    session.add(notification)
    session.commit()
    
    # Mark as read
    response = client.put(f'/api/notifications/{notification.id}/read',
                         headers=auth_headers['landlord'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['notification']['read'] is True
    
    # Verify in database
    updated = Notification.query.get(notification.id)
    assert updated.read is True
    assert updated.read_at is not None


def test_mark_all_notifications_read(client, test_users, auth_headers, session):
    """Test marking all notifications as read"""
    # Create multiple unread notifications
    for i in range(3):
        notification = Notification(
            user_id=test_users['landlord'].id,
            type='info',
            title=f'Bulk Notification {i}',
            message=f'This is bulk notification {i}',
            read=False,
            created_at=datetime.utcnow()
        )
        session.add(notification)
    session.commit()
    
    # Mark all as read
    response = client.put('/api/notifications/read-all',
                         headers=auth_headers['landlord'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'count' in data
    assert data['count'] >= 3
    
    # Verify all are read
    unread = Notification.query.filter_by(
        user_id=test_users['landlord'].id,
        read=False
    ).count()
    assert unread == 0


def test_unauthorized_notification_access(client, test_users, auth_headers, session):
    """Test accessing notification of another user"""
    # Create notification for tenant
    notification = Notification(
        user_id=test_users['tenant'].id,
        type='info',
        title='Tenant Notification',
        message='This belongs to tenant',
        read=False,
        created_at=datetime.utcnow()
    )
    session.add(notification)
    session.commit()
    
    # Try to access as landlord
    response = client.put(f'/api/notifications/{notification.id}/read',
                         headers=auth_headers['landlord'])
    
    assert response.status_code == 403
    data = json.loads(response.data)
    assert 'error' in data