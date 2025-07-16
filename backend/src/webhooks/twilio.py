"""
Webhook handlers for Twilio messaging service.
"""
from flask import request, jsonify, current_app
import os
from datetime import datetime

from ..models.message import Message
from ..models.user import User
from ..extensions import db

# Try to import Twilio, with a fallback if not installed
try:
    from twilio.request_validator import RequestValidator
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    current_app.logger.warning("Twilio SDK not installed. SMS validation will be disabled.")
    # Define a dummy RequestValidator class to avoid errors
    class RequestValidator:
        def __init__(self, token):
            self.token = token
        
        def validate(self, *args, **kwargs):
            return False

def register_twilio_webhooks(bp):
    """Register Twilio webhook routes with the provided blueprint"""
    
    @bp.route("/twilio/sms", methods=["POST"])
    def twilio_sms_webhook():
        # Validate that the request is from Twilio (if Twilio is available)
        if TWILIO_AVAILABLE:
            validator = RequestValidator(os.getenv("TWILIO_AUTH_TOKEN"))
            request_valid = validator.validate(
                request.url,
                request.form,
                request.headers.get("X-Twilio-Signature", "")
            )
            
            if not request_valid and not current_app.debug:
                current_app.logger.warning("Invalid Twilio request signature")
                return jsonify({"error": "Invalid request signature"}), 403
        else:
            current_app.logger.warning("Twilio SDK not available, skipping signature validation")
            
        # Process incoming SMS
        try:
            from_number = request.form.get("From", "")
            body = request.form.get("Body", "")
            message_sid = request.form.get("MessageSid", "")
            
            # Process the message
            process_incoming_sms(from_number, body, message_sid)
            
            # Return TwiML response
            response = """<?xml version="1.0" encoding="UTF-8"?><Response></Response>"""
            return response, 200, {"Content-Type": "text/xml"}
            
        except Exception as e:
            current_app.logger.error(f"Error processing Twilio SMS webhook: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    
    @bp.route("/twilio/voice", methods=["POST"])
    def twilio_voice_webhook():
        # Validate that the request is from Twilio (if Twilio is available)
        if TWILIO_AVAILABLE:
            validator = RequestValidator(os.getenv("TWILIO_AUTH_TOKEN"))
            request_valid = validator.validate(
                request.url,
                request.form,
                request.headers.get("X-Twilio-Signature", "")
            )
            
            if not request_valid and not current_app.debug:
                current_app.logger.warning("Invalid Twilio request signature")
                return jsonify({"error": "Invalid request signature"}), 403
        else:
            current_app.logger.warning("Twilio SDK not available, skipping signature validation")
            
        # Process incoming call
        try:
            from_number = request.form.get("From", "")
            call_sid = request.form.get("CallSid", "")
            
            # Log the incoming call
            current_app.logger.info(f"Incoming call from {from_number}, CallSid: {call_sid}")
            
            # Return TwiML response with instructions for the call
            response = """
            <?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Say>Thank you for calling the property management system. Please log in to your account or contact support for assistance.</Say>
            </Response>
            """
            return response, 200, {"Content-Type": "text/xml"}
            
        except Exception as e:
            current_app.logger.error(f"Error processing Twilio voice webhook: {str(e)}")
            return jsonify({"error": str(e)}), 500


def process_incoming_sms(from_number, body, message_sid):
    """Process an incoming SMS message"""
    # Normalize phone number
    normalized_number = normalize_phone_number(from_number)
    
    # Find user by phone number
    user = User.query.filter_by(phone=normalized_number).first()
    if not user:
        current_app.logger.info(f"SMS from unknown number: {from_number}")
        # Could send an automated response that this number isn't recognized
        return
    
    # Determine the message type and handle accordingly
    if body.lower().startswith("help"):
        # Handle help request
        send_help_message(user)
    elif body.lower().startswith("status"):
        # Handle status request for maintenance
        process_status_request(user, body)
    elif body.lower().startswith("pay"):
        # Handle payment confirmation or inquiry
        process_payment_request(user, body)
    else:
        # General message - store in message system
        store_incoming_message(user, body, message_sid)


def normalize_phone_number(phone):
    """Normalize a phone number to standard format"""
    # Remove all non-digit characters
    digits_only = ''.join(filter(str.isdigit, phone))
    
    # If US/Canada number with country code, remove the leading 1
    if len(digits_only) == 11 and digits_only.startswith('1'):
        digits_only = digits_only[1:]
        
    return digits_only


def send_help_message(user):
    """Send a help message to the user"""
    # Implementation depends on your SMS sending functionality
    help_text = (
        "Property Management Commands:\n"
        "STATUS - Check maintenance request status\n"
        "PAY - Get payment information\n"
        "HELP - Show this message"
    )
    
    # Log the help request
    current_app.logger.info(f"Help message sent to user {user.id}")


def process_status_request(user, message):
    """Process a maintenance status request"""
    # Query recent maintenance requests for this user
    from ..models.maintenance_request import MaintenanceRequest
    
    recent_requests = MaintenanceRequest.query.filter_by(tenant_id=user.id)\
        .order_by(MaintenanceRequest.created_at.desc())\
        .limit(3).all()
    
    if not recent_requests:
        status_text = "You have no recent maintenance requests."
    else:
        status_lines = []
        for req in recent_requests:
            status_lines.append(f"{req.title}: {req.status.upper()}")
        status_text = "Maintenance Requests:\n" + "\n".join(status_lines)
    
    # Send status information
    # Implementation depends on your SMS sending functionality
    current_app.logger.info(f"Status request processed for user {user.id}")


def process_payment_request(user, message):
    """Process a payment-related message"""
    # Query recent invoices for this user
    from ..models.invoice import Invoice
    
    due_invoices = Invoice.query.filter_by(tenant_id=user.id, status="due")\
        .order_by(Invoice.due_date.asc())\
        .limit(2).all()
    
    if not due_invoices:
        payment_text = "You have no outstanding payments due."
    else:
        payment_lines = []
        for inv in due_invoices:
            payment_lines.append(f"${inv.amount:.2f} due on {inv.due_date.strftime('%m/%d/%Y')}")
        payment_text = "Payments Due:\n" + "\n".join(payment_lines)
    
    # Send payment information
    # Implementation depends on your SMS sending functionality
    current_app.logger.info(f"Payment request processed for user {user.id}")


def store_incoming_message(user, body, message_sid):
    """Store an incoming message in the database"""
    # This would depend on your message model structure
    # This is just a placeholder based on a hypothetical Message model
    try:
        message = Message(
            user_id=user.id,
            message_type="sms",
            direction="incoming",
            content=body,
            external_id=message_sid,
            created_at=datetime.utcnow()
        )
        db.session.add(message)
        db.session.commit()
        current_app.logger.info(f"Stored incoming SMS from user {user.id}")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error storing incoming SMS: {str(e)}")