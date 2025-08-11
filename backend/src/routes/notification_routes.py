# backend/src/routes/notifications.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.notification import Notification
from ..models.user import User
from ..extensions import db
from datetime import datetime

# Create the blueprint with correct name to match imports in __init__.py
notification_bp = Blueprint('notifications', __name__)

@notification_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get all notifications for the current user"""
    current_user_id = get_jwt_identity()
    
    try:
        # Get unread notifications first, then read ones, both ordered by most recent
        notifications = Notification.query.filter_by(user_id=current_user_id)\
            .order_by(Notification.is_read, Notification.created_at.desc())\
            .all()
            
        return jsonify({
            'notifications': [notification.to_dict() for notification in notifications]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notification_bp.route('/<int:notification_id>', methods=['GET'])
@jwt_required()
def get_notification(notification_id):
    """Get a specific notification"""
    current_user_id = get_jwt_identity()
    
    try:
        notification = Notification.query.filter_by(
            id=notification_id, 
            user_id=current_user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
            
        return jsonify({'notification': notification.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notification_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark a notification as read"""
    current_user_id = get_jwt_identity()
    
    try:
        notification = Notification.query.filter_by(
            id=notification_id, 
            user_id=current_user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
            
        notification.is_read = True
        notification.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Notification marked as read',
            'notification': notification.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notification_bp.route('/mark-all-read', methods=['PUT'])
@jwt_required()
def mark_all_read():
    """Mark all notifications as read for the current user"""
    current_user_id = get_jwt_identity()
    
    try:
        notifications = Notification.query.filter_by(
            user_id=current_user_id,
            is_read=False
        ).all()
        
        for notification in notifications:
            notification.is_read = True
            notification.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'All notifications marked as read',
            'count': len(notifications)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notification_bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    current_user_id = get_jwt_identity()
    
    try:
        notification = Notification.query.filter_by(
            id=notification_id, 
            user_id=current_user_id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
            
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({
            'message': 'Notification deleted'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notification_bp.route('/clear-all', methods=['DELETE'])
@jwt_required()
def clear_all_notifications():
    """Clear all notifications for the current user"""
    current_user_id = get_jwt_identity()
    
    try:
        notifications = Notification.query.filter_by(user_id=current_user_id).all()
        count = len(notifications)
        
        for notification in notifications:
            db.session.delete(notification)
        
        db.session.commit()
        
        return jsonify({
            'message': 'All notifications cleared',
            'count': count
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notification_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get count of unread notifications"""
    current_user_id = get_jwt_identity()
    
    try:
        count = Notification.query.filter_by(
            user_id=current_user_id,
            is_read=False
        ).count()
        
        return jsonify({'unread_count': count}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notification_bp.route('/send', methods=['POST'])
@jwt_required()
def create_notification():
    """Create a new notification"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        new_notification = Notification(
            user_id=current_user_id,
            message=data['message'],
            is_read=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.session.add(new_notification)
        db.session.commit()
        
        return jsonify({
            'message': 'Notification created',
            'notification': new_notification.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notification_bp.route('/broadcast', methods=['POST'])
@jwt_required()
def broadcast_notification():
    """Send a notification to all users"""
    data = request.get_json()
    
    try:
        users = User.query.all()
        notifications = []
        
        for user in users:
            new_notification = Notification(
                user_id=user.id,
                message=data['message'],
                is_read=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.session.add(new_notification)
            notifications.append(new_notification.to_dict())
        
        db.session.commit()
        
        return jsonify({
            'message': 'Notification broadcasted to all users',
            'notifications': notifications
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500