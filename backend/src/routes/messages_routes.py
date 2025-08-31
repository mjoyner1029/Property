# backend/src/routes/messages_routes.py
from __future__ import annotations

from typing import Any, Tuple
from datetime import datetime

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..controllers.messaging_controller import (
    get_threads,
    create_thread,
    get_messages,
    send_message,
    mark_as_read,
    mark_thread_as_read,
    get_unread_count,
    get_contacts,
)
from ..extensions import db, limiter
from ..models.message_thread import MessageThread
from ..models.user import User

# app.py should register this at url_prefix="/api/messages"
messages_bp = Blueprint("messages", __name__)

# --- helpers -----------------------------------------------------------------

def _ok(payload, code=200):
    return jsonify(payload), code

def _err(msg, code=400):
    return jsonify({"error": msg}), code

def _normalize_response(result: Any):
    """
    Controllers may return (dict, status), a Flask Response, or just dict.
    Normalize to a Flask response.
    """
    # If it's already a Flask Response, just return it
    from flask.wrappers import Response
    if isinstance(result, Response):
        return result

    # If (payload, status) tuple
    if isinstance(result, tuple) and len(result) == 2:
        payload, status = result
        return _ok(payload, status)

    # Otherwise assume dict payload, 200 OK
    return _ok(result, 200)

# --- routes ------------------------------------------------------------------

@messages_bp.route("/threads", methods=["GET"])
@jwt_required()
@limiter.limit("240/hour")
def list_threads():
    """
    GET /api/messages/threads
    
    Retrieves all message threads where the current user is a participant.
    Returns paginated list of threads with basic information about the other participant.
    
    Optional query params:
      - page (int): Page number, defaults to 1
      - per_page (int): Number of threads per page, defaults to 10
      
    Returns:
      - 200 OK: {"threads": [...], "total": int, "pages": int, "current_page": int}
      - 404: If user not found
      - 500: On server error
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return _err("User not found", 404)
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Query threads where the user is either sender or recipient
        from sqlalchemy import or_
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
            other_user = User.query.get(other_user_id)
            
            thread_data = {
                "id": thread.id,
                "subject": thread.subject,
                "other_user": {
                    "id": other_user.id,
                    "name": other_user.name,
                    "email": other_user.email,
                    "role": other_user.role
                },
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
        
        return _ok(result, 200)
    except Exception as e:
        current_app.logger.exception("Failed to list message threads: %s", str(e))
        return _err("Internal server error", 500)


@messages_bp.route("/threads", methods=["POST"])
@jwt_required()
@limiter.limit("60/hour")
def create_thread_direct():
    """
    POST /api/messages/threads
    
    Creates a new message thread between the current user and another user.
    Optionally sends an initial message in the thread.
    If a thread already exists between these users, returns the existing thread.
    
    Request body (JSON):
      - recipients (array): Required. Array of user IDs to create a thread with 
                           (currently only supports one recipient)
      - subject (string): Optional. Subject line for the thread
      - content (string): Optional. Initial message content
      
    Returns:
      - 201 Created: {"thread": {...}, "message": {...}} if new thread created
      - 200 OK: {"thread": {...}, "message": {...}} if thread already exists
      - 400: If recipients not provided or attempting to create thread with self
      - 404: If recipient user not found
      - 500: On server error
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json(silent=True) or {}
        
        # Validate required parameters
        if "recipients" not in data or not data["recipients"]:
            return _err("recipients list is required", 400)
            
        # For now, just use the first recipient (thread is between two users)
        recipient_id = data["recipients"][0]
        subject = data.get("subject", "")
        content = data.get("content", "")
        
        # Ensure the other user exists
        from ..models.user import User
        other_user = User.query.get(recipient_id)
        if not other_user:
            return _err("Recipient user not found", 404)
            
        # Don't allow creating thread with self
        if current_user_id == recipient_id:
            return _err("Cannot create a message thread with yourself", 400)
            
        # Check if thread already exists between these users
        from sqlalchemy import or_, and_
        existing_thread = MessageThread.query.filter(
            or_(
                and_(MessageThread.user1_id == current_user_id, MessageThread.user2_id == recipient_id),
                and_(MessageThread.user1_id == recipient_id, MessageThread.user2_id == current_user_id)
            )
        ).first()
        
        if existing_thread:
            thread_data = existing_thread.to_dict()
            response = {"thread": thread_data}
            
            # Add initial message if content is provided
            if content:
                from ..models.conversation import Conversation
                from ..models.message import Message
                
                # Get the conversation for this thread or create one
                conversation = Conversation.query.filter_by(thread_id=existing_thread.id).first()
                if not conversation:
                    conversation = Conversation(thread_id=existing_thread.id)
                    db.session.add(conversation)
                    db.session.commit()
                
                # Create the initial message
                message = Message(
                    conversation_id=conversation.id,
                    sender_id=current_user_id,
                    content=content
                )
                db.session.add(message)
                db.session.commit()
                response["message"] = message.to_dict()
            
            return _ok(response, 200)
            
        # Create a new thread
        thread = MessageThread(
            user1_id=current_user_id,
            user2_id=recipient_id,
            subject=subject,
            created_by=current_user_id
        )
        
        db.session.add(thread)
        db.session.commit()
        
        # Get or create conversation for this thread
        from ..models.conversation import Conversation
        conversation = Conversation.query.filter_by(id=thread.id).first()
        if not conversation:
            conversation = Conversation(
                id=thread.id,
                created_by=current_user_id
            )
            db.session.add(conversation)
            db.session.flush()
        
        # Return response with thread info
        response = {"thread": thread.to_dict()}
        
        # Add initial message if content is provided
        if content:
            # Create an actual message in the database
            from ..models.message import Message
            new_message = Message(
                conversation_id=conversation.id,
                sender_id=current_user_id,
                content=content
            )
            db.session.add(new_message)
            db.session.flush()
            
            # Add message to response
            response["message"] = new_message.to_dict()
        
        return _ok(response, 201)
    except Exception as e:
        current_app.logger.exception("Failed to create thread")
        db.session.rollback()
        return _err(f"Failed to create thread: {str(e)}", 500)


@messages_bp.route("/threads/<int:other_user_id>", methods=["POST"])
@jwt_required()
@limiter.limit("60/hour")
def create_thread_route(other_user_id: int):
    """
    POST /api/messages/threads/<other_user_id>
    Body may include metadata (subject, initial message, etc.) depending on controller.
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json(silent=True) or {}
        result = create_thread(user_id=user_id, other_user_id=other_user_id, data=data)
        return _normalize_response(result)
    except Exception:
        current_app.logger.exception("Failed to create thread with user %s", other_user_id)
        return _err("Internal server error", 500)


@messages_bp.route("/threads/<int:thread_id>/messages", methods=["GET"])
@jwt_required()
@limiter.limit("480/hour")
def list_messages(thread_id: int):
    """
    GET /api/messages/threads/<thread_id>/messages
    
    Retrieves messages for a specific thread. The user must be a participant in the thread.
    Returns paginated list of messages in chronological order (oldest first).
    
    Path params:
      - thread_id (int): ID of the message thread
      
    Optional query params:
      - page (int): Page number, defaults to 1
      - per_page (int): Number of messages per page, defaults to 20
      - since_id (int): Only return messages newer than this ID (not implemented yet)
      
    Returns:
      - 200 OK: {"messages": [...], "total": int, "pages": int, "current_page": int}
      - 403: If the user doesn't have access to the thread
      - 404: If thread not found
      - 500: On server error
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Ensure thread exists and user is part of it
        thread = MessageThread.query.get(thread_id)
        if not thread:
            return _err("Thread not found", 404)
            
        # Debug user and thread info
        current_app.logger.debug(f"Current user: {current_user_id}, Thread users: {thread.user1_id}, {thread.user2_id}")
        
        # Check if user has access to the thread
        if int(current_user_id) != thread.user1_id and int(current_user_id) != thread.user2_id:
            current_app.logger.debug(f"Access denied: User {current_user_id} not part of thread {thread_id} with users {thread.user1_id}, {thread.user2_id}")
            return _err("You don't have access to this thread", 403)
            
        from ..models.message import Message
        from ..models.conversation import Conversation
        
        # Get or create conversation for this thread
        conversation = Conversation.query.filter_by(id=thread_id).first()
        if not conversation:
            # Create conversation if it doesn't exist yet
            conversation = Conversation(
                id=thread_id,
                created_by=current_user_id
            )
            db.session.add(conversation)
            db.session.commit()
            current_app.logger.debug(f"Created conversation for thread {thread_id}")
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Query messages in this thread
        query = Message.query.filter_by(conversation_id=thread_id).order_by(Message.created_at.asc())
        
        # Paginate results
        paginated_messages = query.paginate(page=page, per_page=per_page)
        
        messages_data = [message.to_dict() for message in paginated_messages.items]
        
        result = {
            "messages": messages_data,
            "total": paginated_messages.total,
            "pages": paginated_messages.pages,
            "current_page": page
        }
        
        return _ok(result, 200)
    except Exception as e:
        current_app.logger.exception("Failed to get messages for thread %s: %s", thread_id, str(e))
        return _err("Internal server error", 500)


@messages_bp.route("/threads/<int:thread_id>/messages", methods=["POST"])
@jwt_required()
@limiter.limit("120/hour")
def send_message_route(thread_id: int):
    """
    POST /api/messages/threads/<thread_id>/messages
    
    Sends a new message to the specified thread. The user must be a participant in the thread.
    Creates a conversation for the thread if one doesn't exist.
    
    Path params:
      - thread_id (int): ID of the message thread
      
    Request body (JSON):
      - content (str): Required. The message content
      - attachments (list): Optional. Not implemented yet
      
    Returns:
      - 201 Created: {"message": {...}, "message_id": int}
      - 400: If content is missing or request body is not JSON
      - 403: If the user doesn't have access to the thread
      - 404: If thread not found
      - 500: On server error
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json(silent=True) or {}
        if not data:
            return _err("Request body must be JSON", 400)
        
        if 'content' not in data or not data['content'].strip():
            return _err("Message content is required", 400)
            
        # Ensure thread exists and user is part of it
        thread = MessageThread.query.get(thread_id)
        if not thread:
            return _err("Thread not found", 404)
        
        # Debug user and thread info
        current_app.logger.debug(f"Current user: {current_user_id}, Thread users: {thread.user1_id}, {thread.user2_id}")
            
        # Check if user has access to the thread
        if int(current_user_id) != thread.user1_id and int(current_user_id) != thread.user2_id:
            current_app.logger.debug(f"Access denied: User {current_user_id} not part of thread {thread_id} with users {thread.user1_id}, {thread.user2_id}")
            return _err("You don't have access to this thread", 403)
            
        from ..models.message import Message
        from ..models.conversation import Conversation
        
        # Get or create conversation for this thread
        conversation = Conversation.query.filter_by(id=thread_id).first()
        if not conversation:
            # Create conversation if it doesn't exist yet
            conversation = Conversation(
                id=thread_id,
                created_by=current_user_id
            )
            db.session.add(conversation)
            db.session.flush()
            current_app.logger.debug(f"Created conversation for thread {thread_id}")
        
        # Create new message
        new_message = Message(
            conversation_id=conversation.id,
            sender_id=current_user_id,
            content=data['content'].strip()
        )
        
        db.session.add(new_message)
        
        # Update thread's updated_at timestamp
        from datetime import datetime
        thread.updated_at = datetime.now()
        
        db.session.commit()
        
        # Get recipient for notification
        recipient_id = thread.user2_id if int(current_user_id) == thread.user1_id else thread.user1_id
        
        return _ok({
            "message": new_message.to_dict(),
            "message_id": new_message.id
        }, 201)
        
    except Exception as e:
        current_app.logger.exception("Failed to send message to thread %s: %s", thread_id, str(e))
        db.session.rollback()
        return _err("Internal server error", 500)


@messages_bp.route("/messages/<int:message_id>/read", methods=["PUT"])
@jwt_required()
@limiter.limit("240/hour")
def mark_message_read(message_id: int):
    """
    PUT /api/messages/messages/<message_id>/read
    """
    try:
        user_id = get_jwt_identity()
        result = mark_as_read(user_id=user_id, message_id=message_id)
        return _normalize_response(result)
    except Exception:
        current_app.logger.exception("Failed to mark message %s as read", message_id)
        return _err("Internal server error", 500)


@messages_bp.route("/threads/<int:thread_id>/read", methods=["PUT"])
@jwt_required()
@limiter.limit("120/hour")
def mark_thread_read(thread_id: int):
    """
    PUT /api/messages/threads/<thread_id>/read
    """
    try:
        user_id = get_jwt_identity()
        result = mark_thread_as_read(user_id=user_id, thread_id=thread_id)
        return _normalize_response(result)
    except Exception:
        current_app.logger.exception("Failed to mark thread %s as read", thread_id)
        return _err("Internal server error", 500)


@messages_bp.route("/unread-count", methods=["GET"])
@jwt_required()
@limiter.limit("960/hour")
def unread_count():
    """
    GET /api/messages/unread-count
    """
    try:
        user_id = get_jwt_identity()
        result = get_unread_count(user_id=user_id)
        return _normalize_response(result)
    except Exception:
        current_app.logger.exception("Failed to get unread count")
        return _err("Internal server error", 500)


@messages_bp.route("/contacts", methods=["GET"])
@jwt_required()
@limiter.limit("480/hour")
def contacts():
    """
    GET /api/messages/contacts
    Optional query params: search (str), page/per_page
    """
    try:
        user_id = get_jwt_identity()
        params = dict(request.args)
        result = get_contacts(user_id=user_id, **params)
        return _normalize_response(result)
    except Exception:
        current_app.logger.exception("Failed to get contacts")
        return _err("Internal server error", 500)
