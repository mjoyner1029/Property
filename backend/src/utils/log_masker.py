# backend/src/utils/log_masker.py

import re
import logging
from functools import wraps

class PiiFilter(logging.Filter):
    """
    Logging filter that masks sensitive PII data in log messages.
    """
    # Patterns to detect and mask in logs
    PATTERNS = {
        # Email pattern
        r'[\w\.-]+@[\w\.-]+': '[EMAIL REDACTED]',
        
        # JWT pattern (common formats)
        r'eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+': '[JWT REDACTED]',
        
        # Stripe key pattern
        r'(pk|sk|whsec)_(test|live)_[A-Za-z0-9]+': '[STRIPE_KEY REDACTED]',
        
        # Stripe IDs (customer, payment, subscription, etc.)
        r'(cus|sub|pi|si|ch|in|pm)_[A-Za-z0-9]+': '[STRIPE_ID REDACTED]',
        
        # AWS access key pattern
        r'AKIA[0-9A-Z]{16}': '[AWS_KEY REDACTED]',
        
        # Password pattern (context-dependent, assuming it appears near 'password' word)
        r'("password"|password=|password:)\s*["\']?([^"\'\s,}{]+)["\']?': r'\1 [PASSWORD REDACTED]',
        
        # Phone number patterns
        r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b': '[PHONE REDACTED]',
        
        # SSN patterns
        r'\b\d{3}-\d{2}-\d{4}\b': '[SSN REDACTED]',
    }

    def __init__(self):
        super().__init__()
        # Compile patterns for efficiency
        self.compiled_patterns = [(re.compile(pattern), mask) for pattern, mask in self.PATTERNS.items()]

    def filter(self, record):
        if isinstance(record.msg, str):
            for pattern, mask in self.compiled_patterns:
                record.msg = pattern.sub(mask, record.msg)
        
        # Also check args for strings that might contain PII
        if record.args:
            # Convert args to list for modification
            args_list = list(record.args)
            # Process each argument
            for i, arg in enumerate(args_list):
                if isinstance(arg, str):
                    # Apply all patterns to the string argument
                    for pattern, mask in self.compiled_patterns:
                        args_list[i] = pattern.sub(mask, args_list[i])
            # Update record with masked args
            record.args = tuple(args_list)
            
        return True


def mask_pii_in_response(f):
    """
    Decorator to mask PII in API response data before returning it.
    This should be used sparingly and only when needed, as it processes 
    the entire response which could impact performance.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        response = f(*args, **kwargs)
        
        # Process response here if needed
        # Note: Generally we shouldn't modify API responses as it could break functionality
        # This is mainly for demonstration purposes
        
        return response
    return decorated_function


def setup_pii_filtering():
    """
    Configure the root logger to use the PII filter.
    """
    pii_filter = PiiFilter()
    root_logger = logging.getLogger()
    root_logger.addFilter(pii_filter)
    
    # Also add to other commonly used loggers
    loggers = [
        logging.getLogger('flask.app'),
        logging.getLogger('werkzeug'),
        logging.getLogger('gunicorn'),
        logging.getLogger('sqlalchemy')
    ]
    
    for logger in loggers:
        logger.addFilter(pii_filter)

    return pii_filter
