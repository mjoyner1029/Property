from ..models.notification import Notification
from ..models.user import User
from ..extensions import db
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
import json

class NotificationService:
    @staticmethod
    def create_notification(user_id, notification_type, title, message, data=None):
        """Create a notification for a user"""
        try:
            # Check if user exists
            user = User.query.get(user_id)
            if not user:
                return None, "User not found"
                
            # Create notification
            notification = Notification(
                user_id=user_id,
                type=notification_type,
                title=title,
                message=message,
                data=json.dumps(data) if data else None,
                read=False,
                created_at=datetime.utcnow()
            )
            
            db.session.add(notification)
            db.session.commit()
            
            return notification, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def get_user_notifications(user_id, page=1, per_page=20, unread_only=False):
        """Get notifications for a user with pagination"""
        try:
            query = Notification.query.filter_by(user_id=user_id)
            
            if unread_only:
                query = query.filter_by(read=False)
                
            # Order by most recent first
            query = query.order_by(Notification.created_at.desc())
            
            # Paginate results
            paginated_notifications = query.paginate(page=page, per_page=per_page)
            
            # Process notifications
            notifications = []
            for notif in paginated_notifications.items:
                # Parse JSON data if present
                data = json.loads(notif.data) if notif.data else None
                
                # Add to results
                notification_dict = {
                    'id': notif.id,
                    'type': notif.type,
                    'title': notif.title,
                    'message': notif.message,
                    'read': notif.read,
                    'data': data,
                    'created_at': notif.created_at.isoformat() if notif.created_at else None
                }
                notifications.append(notification_dict)
                
            return notifications, paginated_notifications.total, None
            
        except SQLAlchemyError as e:
            return [], 0, str(e)
    
    @staticmethod
    def mark_notification_as_read(notification_id, user_id):
        """Mark a notification as read"""
        try:
            notification = Notification.query.get(notification_id)
            
            if not notification:
                return False, "Notification not found"
                
            # Verify ownership
            if notification.user_id != user_id:
                return False, "Not authorized to update this notification"
                
            notification.read = True
            notification.read_at = datetime.utcnow()
            
            db.session.commit()
            
            return True, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return False, str(e)
    
    @staticmethod
    def mark_all_as_read(user_id):
        """Mark all notifications as read for a user"""
        try:
            unread_notifications = Notification.query.filter_by(user_id=user_id, read=False).all()
            current_time = datetime.utcnow()
            
            for notification in unread_notifications:
                notification.read = True
                notification.read_at = current_time
                
            db.session.commit()
            
            return len(unread_notifications), None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return 0, str(e)
    
    @staticmethod
    def create_system_notification(users, title, message, data=None):
        """Create system notification for multiple users"""
        try:
            count = 0
            current_time = datetime.utcnow()
            json_data = json.dumps(data) if data else None
            
            for user_id in users:
                # Create notification
                notification = Notification(
                    user_id=user_id,
                    type='system',
                    title=title,
                    message=message,
                    data=json_data,
                    read=False,
                    created_at=current_time
                )
                
                db.session.add(notification)
                count += 1
                
            db.session.commit()
            
            return count, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return 0, str(e)