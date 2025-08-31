from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import or_, and_

from ..models.message import Message
from ..models.message_thread import MessageThread
from ..models.user import User
from ..models.tenant_property import TenantProperty
from ..models.property import Property
from ..extensions import db, socketio
from ..utils.role_required import role_required

messaging_bp = Blueprint('messaging', __name__)

@messaging_bp.route('/threads', methods=['GET'])
@jwt_required()
def get_threads():
    """Get all message threads for the current user"""
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Query threads where the user is either sender or recipient
        query = MessageThread.query.filter(
            or_(
                MessageThread.user1_id == current_user_id,
                MessageThread.user2_id == current_user_id
            )
        ).order_by(MessageThread.updated_at.desc())
        
        # Paginate results
        paginated_threads = query.paginate(page=page, per_page=per_page)
        
        threads_data = []
        for thread in paginated_threads.items:
            # Get the other user in the conversation
            other_user_id = thread.user2_id if thread.user1_id == current_user_id else thread.user1_id
            other_user = db.session.get(User, other_user_id)
            
            # Get the last message in the thread
            last_message = Message.query.filter_by(thread_id=thread.id).order_by(Message.created_at.desc()).first()
            
            # Get unread count for current user
            unread_count = Message.query.filter_by(
                thread_id=thread.id,
                recipient_id=current_user_id,
                read=False
            ).count()
            
            thread_data = {
                "id": thread.id,
                "other_user": {
                    "id": other_user.id,
                    "name": other_user.name,
                    "email": other_user.email,
                    "role": other_user.role
                },
                "last_message": last_message.to_dict() if last_message else None,
                "unread_count": unread_count,
                "created_at": thread.created_at.isoformat(),
                "updated_at": thread.updated_at.isoformat()
            }
            threads_data.append(thread_data)
        
        result = {
            "threads": threads_data,
            "total": paginated_threads.total,
            "pages": paginated_threads.pages,
            "current_page": page
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@messaging_bp.route('/threads/<int:user_id>', methods=['POST'])
@jwt_required()
def create_thread(user_id):
    """Create a new message thread with another user"""
    current_user_id = get_jwt_identity()
    
    # Ensure the other user exists
    other_user = db.session.get(User, user_id)
    if not other_user:
        return jsonify({"error": "User not found"}), 404
        
    # Don't allow creating thread with self
    if current_user_id == user_id:
        return jsonify({"error": "Cannot create a message thread with yourself"}), 400
        
    try:
        # Check if thread already exists between these users
        existing_thread = MessageThread.query.filter(
            or_(
                and_(MessageThread.user1_id == current_user_id, MessageThread.user2_id == user_id),
                and_(MessageThread.user1_id == user_id, MessageThread.user2_id == current_user_id)
            )
        ).first()
        
        if existing_thread:
            return jsonify({
                "message": "Thread already exists",
                "thread_id": existing_thread.id
            }), 200
            
        # If user is tenant, verify they have a property relationship with the landlord
        current_user = db.session.get(User, current_user_id)
        if current_user.role == 'tenant' and other_user.role == 'landlord':
            # Check if tenant has property from this landlord
            tenant_property = TenantProperty.query.join(Property).filter(
                TenantProperty.tenant_id == current_user_id,
                Property.landlord_id == user_id
            ).first()
            
            if not tenant_property:
                return jsonify({"error": "You don't have a property relationship with this landlord"}), 403
                
        # Create a new thread
        new_thread = MessageThread(
            user1_id=current_user_id,
            user2_id=user_id
        )
        
        db.session.add(new_thread)
        db.session.commit()
        
        return jsonify({
            "message": "Thread created successfully",
            "thread_id": new_thread.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@messaging_bp.route('/threads/<int:thread_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(thread_id):
    """Get all messages in a thread"""
    current_user_id = get_jwt_identity()
    
    # Ensure thread exists and user is part of it
    thread = db.session.get(MessageThread, thread_id)
    if not thread:
        return jsonify({"error": "Thread not found"}), 404
        
    if thread.user1_id != current_user_id and thread.user2_id != current_user_id:
        return jsonify({"error": "You don't have access to this thread"}), 403
        
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Query messages in this thread, newest first
        query = Message.query.filter_by(thread_id=thread_id).order_by(Message.created_at.desc())
        
        # Paginate results
        paginated_messages = query.paginate(page=page, per_page=per_page)
        
        # Mark unread messages as read
        unread_messages = Message.query.filter_by(
            thread_id=thread_id,
            recipient_id=current_user_id,
            read=False
        ).all()
        
        for message in unread_messages:
            message.read = True
            message.read_at = datetime.now()
            
        db.session.commit()
        
        # Return messages in chronological order (oldest first for chat display)
        messages_data = [message.to_dict() for message in reversed(paginated_messages.items)]
        
        result = {
            "messages": messages_data,
            "total": paginated_messages.total,
            "pages": paginated_messages.pages,
            "current_page": page
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@messaging_bp.route('/threads/<int:thread_id>/messages', methods=['POST'])
@jwt_required()
def send_message(thread_id):
    """Send a new message in a thread"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate input
    if 'content' not in data or not data['content'].strip():
        return jsonify({"error": "Message content is required"}), 400
        
    # Ensure thread exists and user is part of it
    thread = db.session.get(MessageThread, thread_id)
    if not thread:
        return jsonify({"error": "Thread not found"}), 404
        
    if thread.user1_id != current_user_id and thread.user2_id != current_user_id:
        return jsonify({"error": "You don't have access to this thread"}), 403
        
    try:
        # Determine recipient
        recipient_id = thread.user2_id if thread.user1_id == current_user_id else thread.user1_id
        
        # Create new message
        new_message = Message(
            thread_id=thread_id,
            sender_id=current_user_id,
            recipient_id=recipient_id,
            content=data['content'].strip(),
            read=False
        )
        
        db.session.add(new_message)
        
        # Update thread's updated_at timestamp
        thread.updated_at = datetime.now()
        
        db.session.commit()
        
        # Emit socket event for real-time updates
        socketio.emit(
            'new_message', 
            {
                'thread_id': thread_id,
                'message': new_message.to_dict()
            },
            room=f"user_{recipient_id}"
        )
        
        return jsonify({
            "message": "Message sent successfully",
            "message_id": new_message.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@messaging_bp.route('/messages/<int:message_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(message_id):
    """Mark a specific message as read"""
    current_user_id = get_jwt_identity()
    
    try:
        message = db.session.get(Message, message_id)
        
        if not message:
            return jsonify({"error": "Message not found"}), 404
            
        # Ensure user is the recipient
        if message.recipient_id != current_user_id:
            return jsonify({"error": "You can only mark messages sent to you as read"}), 403
            
        # Mark as read if not already
        if not message.read:
            message.read = True
            message.read_at = datetime.now()
            db.session.commit()
            
        return jsonify({"message": "Message marked as read"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@messaging_bp.route('/threads/<int:thread_id>/read', methods=['PUT'])
@jwt_required()
def mark_thread_as_read(thread_id):
    """Mark all messages in a thread as read"""
    current_user_id = get_jwt_identity()
    
    # Ensure thread exists and user is part of it
    thread = db.session.get(MessageThread, thread_id)
    if not thread:
        return jsonify({"error": "Thread not found"}), 404
        
    if thread.user1_id != current_user_id and thread.user2_id != current_user_id:
        return jsonify({"error": "You don't have access to this thread"}), 403
        
    try:
        # Mark all unread messages as read
        unread_messages = Message.query.filter_by(
            thread_id=thread_id,
            recipient_id=current_user_id,
            read=False
        ).all()
        
        current_time = datetime.now()
        for message in unread_messages:
            message.read = True
            message.read_at = current_time
            
        db.session.commit()
        
        return jsonify({
            "message": f"Marked {len(unread_messages)} messages as read",
            "count": len(unread_messages)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@messaging_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get count of all unread messages for the current user"""
    current_user_id = get_jwt_identity()
    
    try:
        # Count all unread messages
        unread_count = Message.query.filter_by(
            recipient_id=current_user_id,
            read=False
        ).count()
        
        return jsonify({"unread_count": unread_count}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@messaging_bp.route('/contacts', methods=['GET'])
@jwt_required()
def get_contacts():
    """Get users that the current user can message"""
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    try:
        contacts = []
        
        # If user is a tenant, they can message their landlords
        if user.role == 'tenant':
            # Get landlords of properties the tenant is renting
            landlords = db.session.query(User).join(
                Property, Property.landlord_id == User.id
            ).join(
                TenantProperty, TenantProperty.property_id == Property.id
            ).filter(
                TenantProperty.tenant_id == current_user_id,
                TenantProperty.status.in_(['active', 'pending'])
            ).distinct().all()
            
            contacts = [
                {
                    "id": landlord.id,
                    "name": landlord.name,
                    "email": landlord.email,
                    "role": landlord.role
                }
                for landlord in landlords
            ]
            
        # If user is a landlord, they can message their tenants
        elif user.role == 'landlord':
            # Get tenants of properties owned by the landlord
            tenants = db.session.query(User).join(
                TenantProperty, TenantProperty.tenant_id == User.id
            ).join(
                Property, Property.id == TenantProperty.property_id
            ).filter(
                Property.landlord_id == current_user_id,
                TenantProperty.status.in_(['active', 'pending'])
            ).distinct().all()
            
            contacts = [
                {
                    "id": tenant.id,
                    "name": tenant.name,
                    "email": tenant.email,
                    "role": tenant.role
                }
                for tenant in tenants
            ]
            
        # Admin can message anyone
        elif user.role == 'admin':
            users = User.query.filter(User.id != current_user_id).all()
            
            contacts = [
                {
                    "id": u.id,
                    "name": u.name,
                    "email": u.email,
                    "role": u.role
                }
                for u in users
            ]
            
        return jsonify({"contacts": contacts}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Socket.IO event handlers
@socketio.on('connect')
@jwt_required()
def handle_connect():
    """Handle socket connection"""
    current_user_id = get_jwt_identity()
    # Add the user to a room named with their ID for direct messaging
    socketio.join_room(f"user_{current_user_id}")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle socket disconnection"""
    pass