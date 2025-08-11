from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
import jwt

from ..models.user import User
from ..extensions import db
from ..utils.role_required import role_required

# This would be your actual log model in a real implementation
# For now we'll create a placeholder class to represent what it might look like
class SystemLog:
    def __init__(self, id, user_id, action, resource, details, ip_address, created_at):
        self.id = id
        self.user_id = user_id
        self.action = action
        self.resource = resource
        self.details = details
        self.ip_address = ip_address
        self.created_at = created_at
        
    @staticmethod
    def get_logs(page=1, per_page=20, action_filter=None, resource_filter=None):
        """Placeholder for actual database query"""
        # In a real implementation, this would query the database
        sample_logs = [
            SystemLog(1, 1, "login", "auth", "User logged in", "192.168.1.1", datetime.now()),
            SystemLog(2, 2, "create", "property", "Created new property", "192.168.1.2", datetime.now()),
            SystemLog(3, 1, "update", "user", "Updated profile", "192.168.1.1", datetime.now())
        ]
        return sample_logs, 3  # logs, total count
    
    @staticmethod
    def get_log(log_id):
        """Placeholder for getting a specific log"""
        if log_id == 1:
            return SystemLog(1, 1, "login", "auth", "User logged in", "192.168.1.1", datetime.now())
        return None
    
    def to_dict(self):
        """Convert log to dictionary"""
        user = User.query.get(self.user_id)
        username = user.name if user else "Unknown"
        
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": username,
            "action": self.action,
            "resource": self.resource,
            "details": self.details,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

@jwt_required()
@role_required('admin')
def get_logs():
    """Get system logs with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        action_filter = request.args.get('action')
        resource_filter = request.args.get('resource')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        user_id = request.args.get('user_id', type=int)
        
        # In a real implementation, you would pass these filters to your database query
        logs, total = SystemLog.get_logs(page, per_page, action_filter, resource_filter)
        
        log_data = [log.to_dict() for log in logs]
        
        return jsonify({
            "logs": log_data,
            "total": total,
            "page": page,
            "per_page": per_page
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jwt_required()
@role_required('admin')
def get_log_details(log_id):
    """Get details for a specific log entry"""
    try:
        log = SystemLog.get_log(log_id)
        
        if not log:
            return jsonify({"error": "Log not found"}), 404
            
        return jsonify(log.to_dict()), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jwt_required()
@role_required('admin')
def clear_logs():
    """Clear logs (with optional filters)"""
    try:
        # In a real implementation, you would delete logs from the database
        # based on the provided filters
        
        return jsonify({
            "message": "Logs cleared successfully",
            "count": 0  # Number of logs cleared
        }), 200
        
    except SQLAlchemyError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def log_activity(user_id, action, resource, details, request_obj=None):
    """Utility function to log user activity"""
    try:
        ip_address = request_obj.remote_addr if request_obj else "unknown"
        
        # In a real implementation, you would create and save a log entry
        # log = SystemLog(user_id=user_id, action=action, resource=resource,
        #                details=details, ip_address=ip_address)
        # db.session.add(log)
        # db.session.commit()
        
        return True
    except Exception:
        # Log errors but don't fail the main request
        return False

def frontend_error():
    """Log client-side errors"""
    data = request.get_json()
    
    try:
        # Get error details
        error_message = data.get('message', 'Unknown error')
        error_stack = data.get('stack', '')
        error_url = data.get('url', '')
        user_agent = request.headers.get('User-Agent', '')
        
        # Get user info if available
        user_id = None
        try:
            jwt_header = request.headers.get('Authorization', '')
            if jwt_header.startswith('Bearer '):
                token = jwt_header.split(' ')[1]
                decoded_token = jwt.decode(
                    token, 
                    current_app.config['JWT_SECRET_KEY'], 
                    algorithms=['HS256']
                )
                user_id = decoded_token['sub']
        except:
            # If token decoding fails, continue without user_id
            pass
            
        # Log the error
        current_app.logger.error(
            f"FRONTEND ERROR: {error_message}\n"
            f"URL: {error_url}\n"
            f"User ID: {user_id}\n"
            f"User Agent: {user_agent}\n"
            f"Stack: {error_stack}"
        )
        
        # In a real implementation, you might store this in the database
        # log_entry = ClientErrorLog(
        #     user_id=user_id,
        #     error_message=error_message,
        #     stack_trace=error_stack,
        #     url=error_url,
        #     user_agent=user_agent
        # )
        # db.session.add(log_entry)
        # db.session.commit()
        
        return jsonify({
            "message": "Error logged successfully",
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error logging frontend error: {str(e)}")
        return jsonify({"error": "Failed to log error"}), 500