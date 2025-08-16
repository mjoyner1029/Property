import pytest
import logging
from ..utils.log_masker import PiiFilter, setup_pii_filtering

def test_email_masking():
    """Test that emails are properly masked in logs"""
    pii_filter = PiiFilter()
    
    # Create a test log record with an email
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="User johndoe@example.com has logged in",
        args=(),
        exc_info=None
    )
    
    pii_filter.filter(record)
    assert "johndoe@example.com" not in record.msg
    assert "[EMAIL REDACTED]" in record.msg


def test_jwt_token_masking():
    """Test that JWT tokens are properly masked in logs"""
    pii_filter = PiiFilter()
    
    # Create a test log record with a JWT token
    fake_jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg=f"Generated token: {fake_jwt}",
        args=(),
        exc_info=None
    )
    
    pii_filter.filter(record)
    assert fake_jwt not in record.msg
    assert "[JWT REDACTED]" in record.msg


def test_stripe_key_masking():
    """Test that Stripe API keys are properly masked in logs"""
    pii_filter = PiiFilter()
    
    # Create a test log record with a Stripe key
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="Using Stripe key: sk_live_51ABcdEFgHIjklMNOpqrSTUvwxYZ123456789",
        args=(),
        exc_info=None
    )
    
    pii_filter.filter(record)
    assert "sk_live_51A" not in record.msg
    assert "[STRIPE_KEY REDACTED]" in record.msg


def test_stripe_id_masking():
    """Test that Stripe IDs are properly masked in logs"""
    pii_filter = PiiFilter()
    
    # Create a test log record with a Stripe customer ID
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="Customer cus_A1B2C3D4E5F6G7 made a payment",
        args=(),
        exc_info=None
    )
    
    pii_filter.filter(record)
    assert "cus_A1B2C3D4E5F6G7" not in record.msg
    assert "[STRIPE_ID REDACTED]" in record.msg


def test_password_masking():
    """Test that passwords are properly masked in logs"""
    pii_filter = PiiFilter()
    
    # Create a test log record with a password
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg='User provided password: "SecretPass123!"',
        args=(),
        exc_info=None
    )
    
    pii_filter.filter(record)
    assert "SecretPass123!" not in record.msg
    assert "[PASSWORD REDACTED]" in record.msg


def test_phone_masking():
    """Test that phone numbers are properly masked in logs"""
    pii_filter = PiiFilter()
    
    # Create a test log record with a phone number
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="Contact at 555-123-4567 for support",
        args=(),
        exc_info=None
    )
    
    pii_filter.filter(record)
    assert "555-123-4567" not in record.msg
    assert "[PHONE REDACTED]" in record.msg


def test_args_masking():
    """Test that PII in log arguments is properly masked"""
    pii_filter = PiiFilter()
    
    # Create a test log record with PII in args
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="User %s with email %s has logged in with token %s",
        args=("John Doe", "johndoe@example.com", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"),
        exc_info=None
    )
    
    pii_filter.filter(record)
    assert "johndoe@example.com" not in record.args[1]
    assert "[EMAIL REDACTED]" in record.args[1]
    assert "eyJhbGciOiJ" not in record.args[2]
    assert "[JWT REDACTED]" in record.args[2]
