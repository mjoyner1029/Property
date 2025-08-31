from flask import current_app, render_template_string
from flask_mail import Message
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

def send_email(to, subject, template=None, body=None, **kwargs):
    """
    Send an email using Flask-Mail or direct SMTP.
    
    Args:
        to: Recipient email address
        subject: Email subject
        template: Optional HTML template string
        body: Optional plain text body (used if template is None)
        **kwargs: Variables to pass to the template renderer
        
    Returns:
        Boolean indicating success
    """
    # Check if Flask-Mail is configured
    try:
        from ..extensions import mail
        
        if not template and not body:
            logging.error("Either template or body must be provided")
            return False
            
        msg = Message(
            subject=subject,
            recipients=[to]
        )
        
        if template:
            msg.html = render_template_string(template, **kwargs)
        if body:
            msg.body = body
            
        mail.send(msg)
        return True
        
    except (ImportError, AttributeError):
        # Fall back to direct SMTP
        return _send_email_smtp(to, subject, body or template, is_html=bool(template))
    except Exception as e:
        logging.error(f"Error sending email: {str(e)}")
        return False

def _send_email_smtp(to_email, subject, body, is_html=False):
    """Send email using direct SMTP connection"""
    import os
    smtp_server = os.environ.get("SMTP_SERVER", "localhost")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_username = os.environ.get("SMTP_USERNAME")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    from_email = os.environ.get("MAIL_DEFAULT_SENDER", "no-reply@propertymgmt.com")

    msg = MIMEMultipart("alternative" if is_html else "mixed")
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject
    
    if is_html:
        msg.attach(MIMEText(body, "html"))
    else:
        msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            if smtp_username and smtp_password:
                server.login(smtp_username, smtp_password)
            server.sendmail(from_email, to_email, msg.as_string())
        return True
    except Exception as e:
        logging.error(f"Failed to send email to {to_email}: {e}")
        return False

def send_verification_email(user, token, base_url=None):
    """Send email verification link to a new user"""
    import os
    # Use provided base_url or fall back to environment variable or default
    base_url = base_url or os.environ.get("FRONTEND_URL", "http://localhost:3000")
    verification_url = f"{base_url}/verify-email/{token}"
    
    template = """
    <h2>Welcome to Property Management!</h2>
    <p>Hello {{ name }},</p>
    <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
    <p><a href="{{ verification_url }}">Verify Email Address</a></p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't create an account, you can safely ignore this email.</p>
    """
    
    return send_email(
        to=user.email,
        subject="Verify Your Email Address",
        template=template,
        verification_url=verification_url,
        name=user.name
    )

def send_password_reset_email(user, token, base_url=None):
    """Send password reset link"""
    import os
    # Use provided base_url or fall back to environment variable or default
    base_url = base_url or os.environ.get("FRONTEND_URL", "http://localhost:3000")
    reset_url = f"{base_url}/reset-password/{token}"
    
    template = """
    <h2>Password Reset</h2>
    <p>Hello {{ name }},</p>
    <p>You have requested to reset your password. Click the link below to set a new password:</p>
    <p><a href="{{ reset_url }}">Reset Password</a></p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
    """
    
    return send_email(
        to=user.email,
        subject="Reset Your Password",
        template=template,
        reset_url=reset_url,
        name=user.name
    )

def send_welcome_email(user):
    """Send welcome email after email verification"""
    template = """
    <h2>Welcome to Property Management!</h2>
    <p>Hello {{ name }},</p>
    <p>Your email has been verified and your account is now active.</p>
    <p>You can now log in and start using all features of our platform.</p>
    <p>If you have any questions, please don't hesitate to contact our support team.</p>
    """
    
    return send_email(
        to=user.email,
        subject="Welcome to Property Management",
        template=template,
        name=user.name
    )

def send_invite_email(email, inviter_name, property_name, token, role='tenant', base_url=None):
    """Send invitation email to join the platform"""
    import os
    # Use provided base_url or fall back to environment variable or default
    base_url = base_url or os.environ.get("FRONTEND_URL", "http://localhost:3000")
    invite_url = f"{base_url}/invitation/{token}"
    
    template = """
    <h2>You've Been Invited to Property Management!</h2>
    <p>Hello,</p>
    <p>{{ inviter_name }} has invited you to join the Property Management platform
    {% if property_name %} for "{{ property_name }}"{% endif %} as a {{ role }}.</p>
    <p>To accept this invitation, please click the link below:</p>
    <p><a href="{{ invite_url }}">Accept Invitation</a></p>
    <p>This invitation will expire in 7 days.</p>
    """
    
    return send_email(
        to=email,
        subject="Invitation to Property Management",
        template=template,
        invite_url=invite_url,
        inviter_name=inviter_name,
        property_name=property_name,
        role=role
    )

def send_maintenance_notification(user, maintenance_request):
    """Send notification about maintenance request updates"""
    template = """
    <h2>Maintenance Request Update</h2>
    <p>Hello {{ name }},</p>
    <p>There has been an update to your maintenance request:</p>
    <p><strong>Title:</strong> {{ request_title }}</p>
    <p><strong>Status:</strong> {{ request_status }}</p>
    <p><strong>Property:</strong> {{ property_name }}</p>
    {% if notes %}
    <p><strong>Notes:</strong> {{ notes }}</p>
    {% endif %}
    <p>You can view the full details by logging into your account.</p>
    """
    
    return send_email(
        to=user.email,
        subject=f"Maintenance Request Update: {maintenance_request.title}",
        template=template,
        name=user.name,
        request_title=maintenance_request.title,
        request_status=maintenance_request.status,
        property_name=maintenance_request.property.name if maintenance_request.property else "N/A",
        notes=maintenance_request.notes
    )

def send_payment_receipt(user, payment):
    """Send payment receipt"""
    template = """
    <h2>Payment Receipt</h2>
    <p>Hello {{ name }},</p>
    <p>We've received your payment of {{ amount }}.</p>
    <p><strong>Payment Details:</strong></p>
    <ul>
        <li>Date: {{ payment_date }}</li>
        <li>Method: {{ payment_method }}</li>
        <li>Reference: {{ reference }}</li>
    </ul>
    <p>Thank you for your payment!</p>
    """
    
    from ..utils.formatters import format_currency, format_datetime
    
    return send_email(
        to=user.email,
        subject="Payment Receipt",
        template=template,
        name=user.name,
        amount=format_currency(payment.amount),
        payment_date=format_datetime(payment.created_at, format="%B %d, %Y"),
        payment_method=payment.payment_method.capitalize(),
        reference=payment.reference_number
    )

def send_lease_notification(tenant, landlord, lease, action):
    """Send lease-related notifications"""
    if action == 'created':
        # Send to tenant
        tenant_template = """
        <h2>New Lease Agreement</h2>
        <p>Hello {{ tenant_name }},</p>
        <p>A new lease agreement has been created for you by {{ landlord_name }}.</p>
        <p><strong>Property:</strong> {{ property_name }}</p>
        <p><strong>Term:</strong> {{ start_date }} to {{ end_date }}</p>
        <p><strong>Monthly Rent:</strong> {{ rent_amount }}</p>
        <p>Please log in to your account to review and sign the lease agreement.</p>
        """
        
        send_email(
            to=tenant.email,
            subject="New Lease Agreement",
            template=tenant_template,
            tenant_name=tenant.name,
            landlord_name=landlord.name,
            property_name=lease.property.name,
            start_date=lease.start_date.strftime("%B %d, %Y"),
            end_date=lease.end_date.strftime("%B %d, %Y"),
            rent_amount=f"${lease.rent_amount:.2f}"
        )
        
    elif action == 'signed':
        # Send to landlord
        landlord_template = """
        <h2>Lease Agreement Signed</h2>
        <p>Hello {{ landlord_name }},</p>
        <p>{{ tenant_name }} has signed the lease agreement for {{ property_name }}.</p>
        <p>You can review the signed lease by logging into your account.</p>
        """
        
        send_email(
            to=landlord.email,
            subject="Lease Agreement Signed",
            template=landlord_template,
            landlord_name=landlord.name,
            tenant_name=tenant.name,
            property_name=lease.property.name
        )