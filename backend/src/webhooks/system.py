"""
Webhook handlers for internal system events.
"""
from flask import request, jsonify, current_app
import hmac
import hashlib
import os
from datetime import datetime

def register_system_webhooks(bp):
    """Register system webhook routes with the provided blueprint"""
    
    @bp.route("/system", methods=["POST"])
    def system_webhook():
        # Verify the webhook secret
        system_secret = os.getenv("SYSTEM_WEBHOOK_SECRET")
        if system_secret:
            signature = request.headers.get("X-System-Signature")
            if not signature or not verify_system_webhook(request.data, signature, system_secret):
                current_app.logger.warning("Invalid system webhook signature")
                return jsonify({"error": "Invalid signature"}), 401
        
        # Process the webhook
        try:
            webhook_data = request.json
            event_type = webhook_data.get("event_type")
            
            current_app.logger.info(f"Received system webhook: {event_type}")
            
            # Process based on event type
            if event_type == "backup_completed":
                handle_backup_completed(webhook_data)
            elif event_type == "error_alert":
                handle_error_alert(webhook_data)
            elif event_type == "usage_threshold":
                handle_usage_threshold(webhook_data)
            elif event_type == "scheduled_maintenance":
                handle_scheduled_maintenance(webhook_data)
            else:
                current_app.logger.info(f"Unhandled system webhook type: {event_type}")
            
            return jsonify({"status": "success"}), 200
            
        except Exception as e:
            current_app.logger.error(f"Error processing system webhook: {str(e)}")
            return jsonify({"error": str(e)}), 500


def verify_system_webhook(data, signature, secret):
    """Verify the system webhook signature"""
    # Compute expected signature
    h = hmac.new(
        secret.encode("utf-8"),
        data,
        hashlib.sha256
    )
    expected_signature = h.hexdigest()
    
    # Compare signatures using constant-time comparison
    return hmac.compare_digest(signature, expected_signature)


def handle_backup_completed(data):
    """Handle backup completed event"""
    backup_id = data.get("backup_id")
    status = data.get("status")
    timestamp = data.get("timestamp")
    
    if status == "success":
        current_app.logger.info(f"Backup {backup_id} completed successfully at {timestamp}")
    else:
        current_app.logger.error(f"Backup {backup_id} failed at {timestamp}: {data.get('error')}")
        
        # Notify administrators
        notify_admins_of_backup_failure(data)


def handle_error_alert(data):
    """Handle system error alerts"""
    error_type = data.get("error_type")
    error_message = data.get("error_message")
    service = data.get("service")
    
    current_app.logger.error(f"System error in {service}: {error_type} - {error_message}")
    
    # Log to error monitoring system
    log_to_error_system(data)
    
    # Notify administrators for critical errors
    if data.get("severity") == "critical":
        notify_admins_of_critical_error(data)


def handle_usage_threshold(data):
    """Handle resource usage threshold alerts"""
    resource = data.get("resource")
    current_usage = data.get("current_usage")
    threshold = data.get("threshold")
    
    current_app.logger.warning(f"Resource usage alert: {resource} at {current_usage}% (threshold: {threshold}%)")
    
    # Notify administrators if approaching critical levels
    if current_usage > 90:
        notify_admins_of_resource_usage(data)


def handle_scheduled_maintenance(data):
    """Handle scheduled maintenance notifications"""
    maintenance_id = data.get("maintenance_id")
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    services = data.get("affected_services", [])
    
    current_app.logger.info(f"Scheduled maintenance {maintenance_id} from {start_time} to {end_time}")
    
    # Schedule system notice for users if this will affect them
    if services:
        schedule_user_maintenance_notice(data)


# Helper functions

def notify_admins_of_backup_failure(data):
    """Notify administrators of backup failure"""
    # Implementation would depend on your notification system
    pass


def log_to_error_system(data):
    """Log error to monitoring system"""
    # Implementation would depend on your error monitoring system
    pass


def notify_admins_of_critical_error(data):
    """Notify administrators of critical errors"""
    # Implementation would depend on your notification system
    pass


def notify_admins_of_resource_usage(data):
    """Notify administrators of high resource usage"""
    # Implementation would depend on your notification system
    pass


def schedule_user_maintenance_notice(data):
    """Schedule notices to users about upcoming maintenance"""
    # Implementation would depend on your notification system
    pass