import os
import requests
from abc import ABC, abstractmethod
import logging

class EmailProvider(ABC):
    """Abstract base class for email providers."""
    
    @abstractmethod
    def send_email(self, to, subject, html_content, text_content=None, **kwargs):
        """Send an email."""
        pass

class PostmarkProvider(EmailProvider):
    """Postmark email provider implementation."""
    
    def __init__(self, api_key, from_address):
        self.api_key = api_key
        self.from_address = from_address
        self.api_url = "https://api.postmarkapp.com/email"
        
    def send_email(self, to, subject, html_content, text_content=None, **kwargs):
        """Send an email using Postmark API."""
        if not text_content:
            # Generate plain text version if not provided
            text_content = self._html_to_text(html_content)
            
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Postmark-Server-Token": self.api_key
        }
        
        payload = {
            "From": kwargs.get("from_address", self.from_address),
            "To": to,
            "Subject": subject,
            "HtmlBody": html_content,
            "TextBody": text_content,
            "MessageStream": kwargs.get("message_stream", "outbound"),
            "TrackOpens": True,
            "TrackLinks": "HtmlAndText"
        }
        
        # Add optional CC and BCC if provided
        if "cc" in kwargs:
            payload["Cc"] = kwargs["cc"]
        if "bcc" in kwargs:
            payload["Bcc"] = kwargs["bcc"]
            
        # Add attachments if provided
        if "attachments" in kwargs:
            payload["Attachments"] = kwargs["attachments"]
            
        response = requests.post(self.api_url, json=payload, headers=headers)
        
        if response.status_code not in [200, 201]:
            logging.error(f"Failed to send email: {response.text}")
            return False, response.text
            
        return True, response.json()
        
    def _html_to_text(self, html):
        """Convert HTML to plain text."""
        # Simple HTML to text conversion
        # In production, consider using a library like BeautifulSoup
        import re
        text = re.sub(r'<br[^>]*>', '\n', html)
        text = re.sub(r'<[^>]*>', '', text)
        return text

class SendgridProvider(EmailProvider):
    """SendGrid email provider implementation."""
    
    def __init__(self, api_key, from_address):
        self.api_key = api_key
        self.from_address = from_address
        
    def send_email(self, to, subject, html_content, text_content=None, **kwargs):
        """Send an email using SendGrid API."""
        # Import here to avoid dependency if not using SendGrid
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, Email, To, Content
        
        if not text_content:
            # Generate plain text version if not provided
            text_content = self._html_to_text(html_content)
            
        message = Mail(
            from_email=kwargs.get("from_address", self.from_address),
            to_emails=to,
            subject=subject,
            html_content=html_content,
            plain_text_content=text_content
        )
        
        try:
            sg = SendGridAPIClient(self.api_key)
            response = sg.send(message)
            return True, {"status_code": response.status_code}
        except Exception as e:
            logging.error(f"Failed to send email: {str(e)}")
            return False, str(e)
            
    def _html_to_text(self, html):
        """Convert HTML to plain text."""
        # Simple HTML to text conversion
        import re
        text = re.sub(r'<br[^>]*>', '\n', html)
        text = re.sub(r'<[^>]*>', '', text)
        return text

class EmailService:
    """Email service for Asset Anchor."""
    
    def __init__(self, app=None):
        self.provider = None
        
        # Initialize with environment variables if no app is provided
        if app:
            self.init_app(app)
        else:
            self.init_from_env()
            
    def init_from_env(self):
        """Initialize the email service from environment variables."""
        provider_name = os.environ.get("EMAIL_PROVIDER", "postmark").lower()
        api_key = os.environ.get("EMAIL_API_KEY")
        from_address = os.environ.get("EMAIL_FROM", "no-reply@assetanchor.io")
        
        if not api_key and os.environ.get("FLASK_ENV") != "development":
            logging.warning("Email API key not configured")
            
        if provider_name == "postmark":
            self.provider = PostmarkProvider(api_key, from_address)
        elif provider_name == "sendgrid":
            self.provider = SendgridProvider(api_key, from_address)
        else:
            logging.error(f"Unsupported email provider: {provider_name}")
            
    def init_app(self, app):
        """Initialize the email service with the Flask app."""
        provider_name = app.config.get("EMAIL_PROVIDER", "postmark").lower()
        api_key = app.config.get("EMAIL_API_KEY")
        from_address = app.config.get("EMAIL_FROM", "no-reply@assetanchor.io")
        
        if not api_key and app.config.get("ENV") != "development":
            logging.warning("Email API key not configured")
            
        if provider_name == "postmark":
            self.provider = PostmarkProvider(api_key, from_address)
        elif provider_name == "sendgrid":
            self.provider = SendgridProvider(api_key, from_address)
        else:
            logging.error(f"Unsupported email provider: {provider_name}")
    
    def _render_template(self, template_name, **kwargs):
        """Render an email template."""
        # Simple placeholder - in production you'd want a proper template system
        # that doesn't require Flask's render_template
        template_path = os.path.join(os.path.dirname(__file__), '..', 'templates', 'email', f"{template_name}.html")
        
        try:
            with open(template_path, 'r') as f:
                template = f.read()
                
            # Very basic template substitution
            for key, value in kwargs.items():
                template = template.replace("{{ " + key + " }}", str(value))
                
            return template
        except Exception as e:
            logging.error(f"Failed to render template: {str(e)}")
            # Fallback to a simple template
            title = kwargs.get('subject', template_name.title())
            return f"<h1>{title}</h1><p>Please see the content below:</p>" + "\n".join([f"<p>{k}: {v}</p>" for k, v in kwargs.items()])
        
    def send_email(self, to, subject, template_name, **kwargs):
        """Send an email using a template."""
        if not self.provider:
            logging.error("Email provider not configured")
            return False, "Email provider not configured"
            
        # Render the email template
        html_content = self._render_template(template_name, **kwargs)
        
        # Send the email
        return self.provider.send_email(to, subject, html_content, **kwargs)
    
    def send_verification_email(self, user, verification_link):
        """Send an email verification link."""
        return self.send_email(
            to=user.email,
            subject="Verify Your Asset Anchor Account",
            template_name="verification",
            user_name=user.first_name,
            verification_link=verification_link
        )
        
    def send_welcome_email(self, user):
        """Send a welcome email to a new user."""
        return self.send_email(
            to=user.email,
            subject="Welcome to Asset Anchor",
            template_name="welcome",
            user_name=user.first_name
        )
        
    def send_password_reset(self, user, reset_link):
        """Send a password reset email."""
        return self.send_email(
            to=user.email,
            subject="Reset Your Asset Anchor Password",
            template_name="password_reset",
            user_name=user.first_name,
            reset_link=reset_link
        )
        
    def send_invitation(self, email, inviter, invitation_link, role):
        """Send an invitation email."""
        return self.send_email(
            to=email,
            subject=f"{inviter.first_name} invited you to Asset Anchor",
            template_name="invite",
            inviter_name=f"{inviter.first_name} {inviter.last_name}",
            invitation_link=invitation_link,
            role=role
        )
        
    def send_payment_notification(self, user, payment_data, is_success=True):
        """Send a payment notification email."""
        template = "payment_receipt" if is_success else "payment_failed"
        subject = "Payment Receipt" if is_success else "Payment Failed"
        
        return self.send_email(
            to=user.email,
            subject=subject,
            template_name=template,
            user_name=user.first_name,
            amount=payment_data.get("amount"),
            date=payment_data.get("date"),
            description=payment_data.get("description")
        )
        
    def send_maintenance_notification(self, user, maintenance_data):
        """Send a maintenance request notification."""
        is_update = maintenance_data.get("is_update", False)
        template = "maintenance_update" if is_update else "maintenance_request"
        subject = f"Maintenance Request Update: {maintenance_data.get('property_name')}" if is_update else f"New Maintenance Request: {maintenance_data.get('property_name')}"
        
        return self.send_email(
            to=user.email,
            subject=subject,
            template_name=template,
            recipient_name=user.first_name,
            property_name=maintenance_data.get("property_name"),
            description=maintenance_data.get("description"),
            status=maintenance_data.get("status"),
            notes=maintenance_data.get("notes")
        )
