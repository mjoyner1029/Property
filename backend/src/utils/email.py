from flask import current_app
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_verification_email(to_email, token):
    subject = "Verify your Asset Anchor account"
    verification_link = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/verify/{token}"
    body = f"""
    Hi,

    Please verify your Asset Anchor account by clicking the link below:
    {verification_link}

    If you did not sign up, please ignore this email.

    Thanks,
    The Asset Anchor Team
    """
    send_email(to_email, subject, body)

def send_reset_email(to_email, token):
    subject = "Reset your Asset Anchor password"
    reset_link = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/reset-password/{token}"
    body = f"""
    Hi,

    You requested a password reset for your Asset Anchor account.
    Click the link below to reset your password:
    {reset_link}

    If you did not request this, please ignore this email.

    Thanks,
    The Asset Anchor Team
    """
    send_email(to_email, subject, body)

def send_email(to_email, subject, body):
    smtp_server = current_app.config.get("SMTP_SERVER", "localhost")
    smtp_port = current_app.config.get("SMTP_PORT", 587)
    smtp_username = current_app.config.get("SMTP_USERNAME")
    smtp_password = current_app.config.get("SMTP_PASSWORD")
    from_email = current_app.config.get("MAIL_DEFAULT_SENDER", "no-reply@assetanchor.com")

    msg = MIMEMultipart()
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            if smtp_username and smtp_password:
                server.login(smtp_username, smtp_password)
            server.sendmail(from_email, to_email, msg.as_string())
    except Exception as e:
        current_app.logger.error(f"Failed to send email to {to_email}: {e}")