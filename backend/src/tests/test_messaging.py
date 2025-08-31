import pytest
import json
from datetime import datetime

from ..models.message import Message
from ..models.message_thread import MessageThread

@pytest.fixture
def test_thread(session, test_users):
    """Create a test message thread"""
    # First check if the thread already exists
    thread = MessageThread.query.filter(
        MessageThread.user1_id == test_users['tenant'].id,
        MessageThread.user2_id == test_users['landlord'].id
    ).first()
    
    if not thread:
        # Create a new thread if one doesn't exist
        thread = MessageThread(
            user1_id=test_users['tenant'].id,
            user2_id=test_users['landlord'].id,
            subject="Test Thread",
            created_by=test_users['tenant'].id,
            created_at=datetime.utcnow()
        )
        session.add(thread)
        session.flush()
        
        # Add participants
        thread.participants = [test_users['tenant'].id, test_users['landlord'].id]
        
        # Create a conversation for this thread
        from ..models.conversation import Conversation
        conversation = Conversation(
            id=thread.id,  # Use the same ID as the thread
            created_by=test_users['tenant'].id,
            property_id=None
        )
        session.add(conversation)
        session.flush()
        
        # Add initial message
        message = Message(
            conversation_id=thread.id,
            sender_id=test_users['tenant'].id,
            content="This is a test message",
            created_at=datetime.utcnow()
        )
        session.add(message)
        session.commit()
    
    # Print thread info for debugging
    print(f"Test thread: user1_id={thread.user1_id}, user2_id={thread.user2_id}, id={thread.id}")
    
    # Verify the conversation exists
    from ..models.conversation import Conversation
    conversation = Conversation.query.filter_by(id=thread.id).first()
    if conversation:
        print(f"Conversation found with id={conversation.id}")
    else:
        print(f"No conversation found for thread id={thread.id}")
        # Create it if missing
        conversation = Conversation(
            id=thread.id,
            created_by=test_users['tenant'].id,
            property_id=None
        )
        session.add(conversation)
        session.commit()
        print(f"Created conversation with id={conversation.id}")
    
    # Verify messages exist for this thread
    from ..models.message import Message
    messages = Message.query.filter_by(conversation_id=thread.id).all()
    print(f"Found {len(messages)} messages for thread {thread.id}")
    
    # Add a message if there are none
    if not messages:
        print(f"Adding test message to thread {thread.id}")
        message = Message(
            conversation_id=thread.id,
            sender_id=test_users['tenant'].id,
            content="This is a test message",
            created_at=datetime.utcnow()
        )
        session.add(message)
        session.commit()
        print(f"Added message with ID {message.id} to thread {thread.id}")
    
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
    # Use the actual subject from the fixture
    assert thread['subject'] == test_thread.subject


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
        user1_id=test_users['admin'].id,
        user2_id=test_users['landlord'].id,
        subject="Private Thread",
        created_by=test_users['admin'].id,
        created_at=datetime.utcnow()
    )
    thread.participants = [test_users['admin'].id, test_users['landlord'].id]
    session.add(thread)
    session.flush()
    
    # Create a conversation for this thread
    from ..models.conversation import Conversation
    conversation = Conversation(
        id=thread.id,  # Use the same ID as the thread
        created_by=test_users['admin'].id
    )
    session.add(conversation)
    session.flush()
    
    message = Message(
        conversation_id=thread.id,
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