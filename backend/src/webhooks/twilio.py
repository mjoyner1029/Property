"""
Twilio webhook handlers

This module provides webhooks handlers for Twilio SMS and Voice services.
It validates incoming requests using Twilio's signature validation mechanism
and processes webhook payloads.

In development mode, validation can be skipped if TWILIO_AUTH_TOKEN is not set.
"""
import os
import logging
from flask import Blueprint, request, current_app, jsonify
from ..extensions import db

# Create Blueprint for Twilio webhook routes
bp = Blueprint("twilio_webhook", __name__)

# Import the Message model if available
try:
    from ..models.message import Message
    MESSAGE_MODEL_AVAILABLE = True
except ImportError:
    MESSAGE_MODEL_AVAILABLE = False
    logging.warning("Message model not available. SMS messages will not be persisted.")

# Try to import Twilio's RequestValidator
try:
    from twilio.request_validator import RequestValidator
    TWILIO_SDK_AVAILABLE = True
except ImportError:
    TWILIO_SDK_AVAILABLE = False
    logging.warning("Twilio SDK not installed. Webhook signature validation will be skipped.")

def validate_twilio_request(f):
    """Decorator to validate that incoming requests are from Twilio"""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get the Twilio auth token from environment
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        
        # In development mode, allow requests without validation
        if current_app.config.get('ENV') == 'development' and not auth_token:
            current_app.logger.warning("TWILIO_AUTH_TOKEN not set. Skipping signature validation in development mode.")
            return f(*args, **kwargs)
        
        # If not in dev mode and no auth token, reject the request
        if not auth_token and current_app.config.get('ENV') != 'development':
            current_app.logger.error("TWILIO_AUTH_TOKEN not set. Rejecting webhook request.")
            return jsonify({'error': 'Unauthorized'}), 403
        
        # If Twilio SDK not available, handle based on environment
        if not TWILIO_SDK_AVAILABLE:
            if current_app.config.get('ENV') == 'development':
                current_app.logger.warning("Twilio SDK not installed. Skipping signature validation in development mode.")
                return f(*args, **kwargs)
            else:
                current_app.logger.error("Twilio SDK not installed. Rejecting webhook request.")
                return jsonify({'error': 'Server configuration error'}), 500
        
        # Validate the request with Twilio's RequestValidator
        validator = RequestValidator(auth_token)
        
        # Get the request URL and parameters
        request_url = request.url
        # Handle both form data and JSON payloads
        request_data = request.values if request.values else request.json or {}
        
        # Get the X-Twilio-Signature header
        signature = request.headers.get('X-Twilio-Signature', '')
        
        # Validate the request
        valid_request = validator.validate(
            request_url,
            request_data,
            signature
        )
        
        if valid_request or current_app.config.get('ENV') == 'development':
            if not valid_request and current_app.config.get('ENV') == 'development':
                current_app.logger.warning("Invalid Twilio signature but proceeding in development mode.")
            return f(*args, **kwargs)
        else:
            current_app.logger.error("Invalid Twilio signature. Rejecting webhook request.")
            return jsonify({'error': 'Forbidden - invalid signature'}), 403
            
    return decorated_function

# Handle incoming SMS directly on the blueprint
@bp.route('', methods=['POST'])
@bp.route('/', methods=['POST'])
@validate_twilio_request
def twilio_webhook():
    """Handle incoming SMS messages from Twilio"""
    try:
        # Log incoming message data
        current_app.logger.info("Received Twilio webhook")
        
        # Extract SMS data from the webhook payload
        from_number = request.values.get('From', '')
        to_number = request.values.get('To', '')
        body = request.values.get('Body', '')
        message_sid = request.values.get('MessageSid', '')
        
        current_app.logger.debug(f"SMS from {from_number} to {to_number}: {body}")
        
        # Persist the message if the Message model is available
        if MESSAGE_MODEL_AVAILABLE:
            try:
                # Create a new message instance
                new_message = Message(
                    sender_id=None,  # We don't have a user ID for this external sender
                    conversation_id=None,  # We might need to create or find a conversation
                    content=body,
                    is_system_message=True,  # Mark as system message since it's from Twilio
                    room=f"sms_{from_number}"  # Use the phone number as a room identifier
                )
                
                # We might need to find or create a conversation first in a real app
                # For now we'll just log this and not persist if we can't match to a conversation
                current_app.logger.info(f"Received SMS from {from_number}: {body}")
                
                # In a complete implementation, we would:
                # 1. Find the user associated with this phone number
                # 2. Find or create an appropriate conversation
                # 3. Set the sender_id and conversation_id
                # 4. Then persist the message
                
                # db.session.add(new_message)
                # db.session.commit()
                
            except Exception as e:
                current_app.logger.error(f"Error persisting SMS message: {str(e)}")
                # Continue processing even if we can't persist the message
        
        # Return a successful response to Twilio
        return jsonify({
            'status': 'success',
            'message': 'SMS webhook received',
            'sid': message_sid
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error processing Twilio webhook: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# For backwards compatibility with the register_twilio_webhooks function
def register_twilio_webhooks(bp):
    """Register Twilio webhook routes"""
    @bp.route('/twilio', methods=['POST'])
    @validate_twilio_request
    def twilio_webhook_legacy():
        """Handle incoming SMS messages from Twilio (legacy route)"""
        return twilio_webhook()
