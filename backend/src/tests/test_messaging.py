import pytest
import json
from datetime import datetime

from ..models.message import Message
from ..models.message_thread import MessageThread

@pytest.fixture
def test_thread(session, test_users):
    """Create a test message thread"""
    thread = MessageThread(
        subject="Test Thread",
        created_by=test_users['tenant'].id,
        created_at=datetime.utcnow()
    )
    session.add(thread)
    session.flush()
    
    # Add participants
    thread.participants = [test_users['tenant'].id, test_users['landlord'].id]
    
    # Add initial message
    message = Message(
        thread_id=thread.id,
        sender_id=test_users['tenant'].id,
        content="This is a test message",
        created_at=datetime.utcnow()
    )
    session.add(message)
    session.commit()
    
    return thread


def test_create_thread(client, test_users, auth_headers):
    """Test creating a new message thread"""
    response = client.post('/api/messages/threads',
                          headers=auth_headers['tenant'],
                          json={
                              'subject': 'New Thread Subject',
                              'content': 'Initial message content',
                              'recipients': [test_users['landlord'].id]
                          })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'thread' in data
    assert data['thread']['subject'] == 'New Thread Subject'
    assert 'message' in data
    assert data['message']['content'] == 'Initial message content'


def test_get_threads(client, test_users, auth_headers, test_thread):
    """Test getting user's message threads"""
    response = client.get('/api/messages/threads',
                         headers=auth_headers['tenant'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'threads' in data
    assert len(data['threads']) >= 1
    
    thread = next((t for t in data['threads'] if t['id'] == test_thread.id), None)
    assert thread is not None
    assert thread['subject'] == 'Test Thread'


def test_get_thread_messages(client, test_users, auth_headers, test_thread):
    """Test getting messages in a thread"""
    response = client.get(f'/api/messages/threads/{test_thread.id}/messages',
                         headers=auth_headers['tenant'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'messages' in data
    assert len(data['messages']) >= 1
    assert data['messages'][0]['content'] == 'This is a test message'


def test_send_message(client, test_users, auth_headers, test_thread):
    """Test sending a message to a thread"""
    response = client.post(f'/api/messages/threads/{test_thread.id}/messages',
                          headers=auth_headers['landlord'],
                          json={
                              'content': 'Reply from landlord'
                          })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'message' in data
    assert data['message']['content'] == 'Reply from landlord'
    assert data['message']['sender_id'] == test_users['landlord'].id


def test_unauthorized_thread_access(client, test_users, auth_headers, session):
    """Test accessing a thread user is not part of"""
    # Create a thread between admin and landlord (tenant not included)
    thread = MessageThread(
        subject="Private Thread",
        created_by=test_users['admin'].id,
        created_at=datetime.utcnow()
    )
    thread.participants = [test_users['admin'].id, test_users['landlord'].id]
    session.add(thread)
    session.flush()
    
    message = Message(
        thread_id=thread.id,
        sender_id=test_users['admin'].id,
        content="Private message",
        created_at=datetime.utcnow()
    )
    session.add(message)
    session.commit()
    
    # Try to access as tenant
    response = client.get(f'/api/messages/threads/{thread.id}/messages',
                         headers=auth_headers['tenant'])
    
    assert response.status_code == 403
    data = json.loads(response.data)
    assert 'error' in data