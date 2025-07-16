"""
Socket.IO event handlers for real-time communication.
"""
from flask import request, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from flask_socketio import emit, join_room, leave_room, disconnect  # Added disconnect
from functools import wraps
from datetime import datetime

from .extensions import socketio
from .models.user import User

# Authenticate socket connections using JWT
def authenticated_only(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return f(*args, **kwargs)
        except Exception as e:
            current_app.logger.error(f"Socket authentication failed: {str(e)}")
            disconnect()
        return None
    return wrapped

@socketio.on('connect')
def handle_connect():
    current_app.logger.info('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    current_app.logger.info('Client disconnected')

@socketio.on('join')
@authenticated_only
def handle_join(data):
    user_id = get_jwt_identity()
    room = data.get('room')
    
    # Validate room access
    if validate_room_access(user_id, room):
        join_room(room)
        emit('status', {'message': f'Joined room {room}'}, room=room)
        current_app.logger.info(f'User {user_id} joined room {room}')
    else:
        emit('error', {'message': 'Access denied to this room'})
        current_app.logger.warning(f'User {user_id} attempted to join room {room} - access denied')

@socketio.on('leave')
@authenticated_only
def handle_leave(data):
    user_id = get_jwt_identity()
    room = data.get('room')
    leave_room(room)
    emit('status', {'message': f'Left room {room}'}, room=room)
    current_app.logger.info(f'User {user_id} left room {room}')

@socketio.on('send_message')
@authenticated_only
def handle_send_message(data):
    user_id = get_jwt_identity()
    room = data.get('room')
    message = data.get('message')
    
    # Validate message and room access
    if not message or not room or not validate_room_access(user_id, room):
        emit('error', {'message': 'Invalid message or access denied'})
        return
    
    # Get user details for the message
    user = User.query.get(user_id)
    if not user:
        emit('error', {'message': 'User not found'})
        return
    
    # Create response with user info
    response = {
        'room': room,
        'message': message,
        'user': {
            'id': user.id,
            'name': user.name,
            'role': user.role
        },
        'timestamp': datetime.utcnow().isoformat()
    }
    
    # Broadcast message to the room
    emit('receive_message', response, room=room)
    
    # Store the message in database if needed
    try:
        from .models.message import Message
        from .extensions import db
        
        db_message = Message(
            sender_id=user_id,
            content=message,
            room=room
        )
        db.session.add(db_message)
        db.session.commit()
    except Exception as e:
        current_app.logger.error(f"Error storing message: {str(e)}")

# Property-specific events
@socketio.on('maintenance_update')
@authenticated_only
def handle_maintenance_update(data):
    user_id = get_jwt_identity()
    request_id = data.get('request_id')
    property_id = data.get('property_id')
    
    # Create room name for the property
    property_room = f"property_{property_id}"
    
    # Broadcast update to property room
    emit('maintenance_updated', data, room=property_room)
    current_app.logger.info(f'Maintenance request {request_id} updated by user {user_id}')

@socketio.on('payment_received')
@authenticated_only
def handle_payment_received(data):
    user_id = get_jwt_identity()
    payment_id = data.get('payment_id')
    property_id = data.get('property_id')
    
    # Create room name for the property
    property_room = f"property_{property_id}"
    
    # Broadcast payment notification to property room
    emit('payment_notification', data, room=property_room)
    current_app.logger.info(f'Payment {payment_id} notification sent by user {user_id}')

# Helper functions
def validate_room_access(user_id, room):
    """
    Validate if a user has access to a specific room.
    Rooms can be for properties, conversations, etc.
    
    Args:
        user_id: The user ID
        room: The room name
        
    Returns:
        Boolean indicating if the user has access
    """
    # Property room access check (format: "property_123")
    if room.startswith("property_"):
        try:
            property_id = int(room.split("_")[1])
        except (IndexError, ValueError):
            return False
        
        # Check if user is landlord or tenant of this property
        from .models.property import Property
        from .models.tenant import Tenant
        
        # Check if user is property owner
        property_check = Property.query.filter_by(id=property_id, owner_id=user_id).first()
        if property_check:
            return True
        
        # Check if user is tenant of this property
        tenant_check = Tenant.query.filter_by(property_id=property_id, user_id=user_id).first()
        if tenant_check:
            return True
        
        return False
    
    # Conversation room access check (format: "conversation_123")
    elif room.startswith("conversation_"):
        try:
            conversation_id = int(room.split("_")[1])
        except (IndexError, ValueError):
            return False
        
        # Check if user is participant in this conversation
        from .models.conversation import Conversation
        from .models.conversation_participant import ConversationParticipant
        
        participant = ConversationParticipant.query.filter_by(
            conversation_id=conversation_id, 
            user_id=user_id
        ).first()
        
        return participant is not None
    
    # Admin room access check
    elif room == "admin":
        # Check if user is admin
        user = User.query.get(user_id)
        return user and user.role == "admin"
    
    # By default, deny access
    return False