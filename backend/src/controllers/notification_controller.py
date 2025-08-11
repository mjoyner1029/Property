from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from ..models.notification import Notification
from ..models.user import User
from ..extensions import db, socketio
from ..utils.role_required import role_required

notification_bp = Blueprint('notifications', __name__)

@notification_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get notifications for the current user"""
    current_user_id = get_jwt_identity()
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        read_filter = request.args.get('read')
        
        # Build base query
        query = Notification.query.filter_by(user_id=current_user_id)
        
        # Apply read filter if provided
        if read_filter is not None:
            read_status = read_filter.lower() == 'true'
            query = query.filter_by(read=read_status)
            
        # Sort by most recent first
        query = query.order_by(Notification.created_at.desc())
        
        # Paginate results
        paginated_notifications = query.paginate(page=page, per_page=per_page)
        
        result = {
            "notifications": [notification.to_dict() for notification in paginated_notifications.items],
            "total": paginated_notifications.total,
            "pages": paginated_notifications.pages,
            "current_page": page
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@notification_bp.route('/<int:notification_id>', methods=['GET'])
@jwt_required()
def get_notification(notification_id):
    """Get a specific notification"""
    current_user_id = get_jwt_identity()
    
    try:
        notification = Notification.query.get(notification_id)
        
        if not notification:
            return jsonify({"error": "Notification not found"}), 404
            
        # Verify ownership
        if notification.user_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403
            
        return jsonify(notification.to_dict()), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@notification_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark a notification as read"""
    current_user_id = get_jwt_identity()
    
    try:
        notification = Notification.query.get(notification_id)
        
        if not notification:
            return jsonify({"error": "Notification not found"}), 404
            
        # Verify ownership
        if notification.user_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403
            
        # Mark as read if not already
        if not notification.read:
            notification.read = True
            notification.read_at = datetime.now()
            db.session.commit()
            
        return jsonify({"message": "Notification marked as read"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@notification_bp.route('/mark-all-read', methods=['PUT'])
@jwt_required()
def mark_all_as_read():
    """Mark all notifications as read"""
    current_user_id = get_jwt_identity()
    
    try:
        # Get all unread notifications for the user
        unread_notifications = Notification.query.filter_by(
            user_id=current_user_id,
            read=False
        ).all()
        
        # Mark each as read
        current_time = datetime.now()
        for notification in unread_notifications:
            notification.read = True
            notification.read_at = current_time
            
        db.session.commit()
        
        return jsonify({
            "message": f"Marked {len(unread_notifications)} notifications as read",
            "count": len(unread_notifications)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@notification_bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    current_user_id = get_jwt_identity()
    
    try:
        notification = Notification.query.get(notification_id)
        
        if not notification:
            return jsonify({"error": "Notification not found"}), 404
            
        # Verify ownership
        if notification.user_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403
            
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({"message": "Notification deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@notification_bp.route('/clear-all', methods=['DELETE'])
@jwt_required()
def clear_all_notifications():
    """Delete all notifications for the current user"""
    current_user_id = get_jwt_identity()
    
    try:
        # Get count for response
        count = Notification.query.filter_by(user_id=current_user_id).count()
        
        # Delete all notifications for user
        Notification.query.filter_by(user_id=current_user_id).delete()
        db.session.commit()
        
        return jsonify({
            "message": f"Cleared {count} notifications",
            "count": count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@notification_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get count of unread notifications for the current user"""
    current_user_id = get_jwt_identity()
    
    try:
        unread_count = Notification.query.filter_by(
            user_id=current_user_id,
            read=False
        ).count()
        
        return jsonify({"unread_count": unread_count}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Admin endpoints for sending notifications
@notification_bp.route('/send', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_notification():
    """Create a notification for a user (admin only)"""
    data = request.get_json()
    
    try:
        # Validate required fields
        required_fields = ['user_id', 'type', 'title', 'message']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Ensure user exists
        user = User.query.get(data['user_id'])
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Create notification
        new_notification = Notification(
            user_id=data['user_id'],
            type=data['type'],
            title=data['title'],
            message=data['message'],
            resource_type=data.get('resource_type'),
            resource_id=data.get('resource_id'),
            read=False
        )
        
        db.session.add(new_notification)
        db.session.commit()
        
        # Emit socket event for real-time notification
        socketio.emit(
            'new_notification', 
            new_notification.to_dict(),
            room=f"user_{data['user_id']}"
        )
        
        return jsonify({
            "message": "Notification created successfully", 
            "notification_id": new_notification.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@notification_bp.route('/broadcast', methods=['POST'])
@jwt_required()
@role_required('admin')
def broadcast_notification():
    """Send notification to all users of a specific role (admin only)"""
    data = request.get_json()
    
    try:
        # Validate required fields
        required_fields = ['role', 'type', 'title', 'message']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Get all users with the specified role
        role = data['role']
        if role not in ['tenant', 'landlord', 'admin', 'all']:
            return jsonify({"error": "Invalid role specified"}), 400
            
        if role == 'all':
            users = User.query.all()
        else:
            users = User.query.filter_by(role=role).all()
            
        if not users:
            return jsonify({"error": f"No users found with role: {role}"}), 404
            
        # Create notifications for each user
        created_count = 0
        for user in users:
            new_notification = Notification(
                user_id=user.id,
                type=data['type'],
                title=data['title'],
                message=data['message'],
                resource_type=data.get('resource_type'),
                resource_id=data.get('resource_id'),
                read=False
            )
            
            db.session.add(new_notification)
            created_count += 1
            
            # Emit socket event for real-time notification
            socketio.emit(
                'new_notification', 
                new_notification.to_dict(),
                room=f"user_{user.id}"
            )
            
        db.session.commit()
        
        return jsonify({
            "message": f"Successfully sent notification to {created_count} users",
            "count": created_count
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Utility functions for creating notifications programmatically
def create_system_notification(user_id, notification_type, title, message, resource_type=None, resource_id=None):
    """Create a notification from within the system (not through API)"""
    try:
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            resource_type=resource_type,
            resource_id=resource_id,
            read=False
        )
        
        db.session.add(notification)
        db.session.commit()
        
        # Emit socket event for real-time notification
        socketio.emit(
            'new_notification', 
            notification.to_dict(),
            room=f"user_{user_id}"
        )
        
        return notification
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating notification: {str(e)}")
        return None

# Socket.IO event handlers
@socketio.on('connect')
@jwt_required()
def handle_connect():
    """Handle socket connection"""
    current_user_id = get_jwt_identity()
    # Add the user to a room named with their ID for direct notifications
    socketio.join_room(f"user_{current_user_id}")