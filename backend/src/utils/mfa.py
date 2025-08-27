"""
Multi-factor authentication utilities.
Implements TOTP (Time-based One-Time Password) for 2FA.
"""
import base64
import os
import time
import json
import secrets
from io import BytesIO
import qrcode
from flask import current_app, url_for

# Try to use pyotp, but provide fallback implementation if not available
try:
    import pyotp
    PYOTP_AVAILABLE = True
except ImportError:
    PYOTP_AVAILABLE = False
    import hmac
    import hashlib
    import struct


class MFAManager:
    """Manager for Multi-Factor Authentication operations"""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize with Flask app"""
        self.app = app
        # Default settings
        app.config.setdefault('MFA_ISSUER_NAME', 'AssetAnchor')
        app.config.setdefault('MFA_DIGITS', 6)
        app.config.setdefault('MFA_INTERVAL', 30)
        app.config.setdefault('MFA_BACKUP_CODES', 8)
        app.config.setdefault('MFA_BACKUP_CODE_LENGTH', 10)
    
    def generate_secret(self):
        """Generate a new secret key for TOTP"""
        if PYOTP_AVAILABLE:
            return pyotp.random_base32()
        else:
            # Fallback implementation
            return base64.b32encode(os.urandom(10)).decode('utf-8')
    
    def generate_totp_uri(self, secret, username):
        """Generate the otpauth URI for QR code generation"""
        issuer = self.app.config.get('MFA_ISSUER_NAME')
        if PYOTP_AVAILABLE:
            totp = pyotp.TOTP(secret)
            return totp.provisioning_uri(name=username, issuer_name=issuer)
        else:
            # Manual URI construction
            import urllib.parse
            return f"otpauth://totp/{urllib.parse.quote(issuer)}:{urllib.parse.quote(username)}?secret={secret}&issuer={urllib.parse.quote(issuer)}"
    
    def generate_qr_code(self, totp_uri):
        """Generate QR code image for the TOTP URI"""
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64 string for embedding in HTML
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode()
    
    def verify_totp(self, secret, token):
        """Verify a TOTP token against the secret"""
        if not secret or not token:
            return False
            
        try:
            if PYOTP_AVAILABLE:
                totp = pyotp.TOTP(secret)
                return totp.verify(token)
            else:
                # Fallback TOTP implementation
                return self._verify_totp_fallback(secret, token)
        except Exception as e:
            current_app.logger.error(f"TOTP verification error: {str(e)}")
            return False
    
    def _verify_totp_fallback(self, secret, token):
        """Fallback implementation for TOTP verification if pyotp is not available"""
        try:
            # Convert base32 secret to bytes
            key = base64.b32decode(secret.upper())
            
            # Get current timestamp and convert to intervals
            intervals_no = int(time.time()) // self.app.config.get('MFA_INTERVAL', 30)
            
            # Allow for time skew (check current and previous interval)
            for i in range(-1, 2):
                # Pack time interval into bytes
                msg = struct.pack(">Q", intervals_no + i)
                
                # Calculate HMAC-SHA1
                h = hmac.new(key, msg, hashlib.sha1).digest()
                
                # Extract 4 bytes from the hash based on the offset
                offset = h[19] & 0xf
                code = ((h[offset] & 0x7f) << 24 |
                       (h[offset + 1] & 0xff) << 16 |
                       (h[offset + 2] & 0xff) << 8 |
                       (h[offset + 3] & 0xff))
                
                # Generate 6-digit code
                digits = self.app.config.get('MFA_DIGITS', 6)
                code = code % (10 ** digits)
                
                # Compare with token
                if str(code).zfill(digits) == token:
                    return True
            
            return False
        except Exception as e:
            current_app.logger.error(f"Fallback TOTP verification error: {str(e)}")
            return False
    
    def generate_backup_codes(self):
        """Generate backup codes for account recovery"""
        codes = []
        code_count = self.app.config.get('MFA_BACKUP_CODES', 8)
        code_length = self.app.config.get('MFA_BACKUP_CODE_LENGTH', 10)
        
        for _ in range(code_count):
            # Generate a random code with hyphens for readability
            code = ''.join([secrets.token_hex(2) for _ in range(3)])
            formatted_code = '-'.join([code[i:i+4] for i in range(0, len(code), 4)])
            codes.append(formatted_code)
            
        return codes
    
    def verify_backup_code(self, stored_codes_json, provided_code):
        """Verify and consume a backup code"""
        if not stored_codes_json or not provided_code:
            return False, stored_codes_json
        
        try:
            # Parse stored codes
            stored_codes = json.loads(stored_codes_json)
            
            # Normalize code format (remove hyphens)
            normalized_provided = provided_code.replace('-', '')
            normalized_stored = [code.replace('-', '') for code in stored_codes]
            
            # Check if code exists
            if normalized_provided in normalized_stored:
                # Remove the used code
                stored_codes.remove(provided_code)
                # Return success and updated codes
                return True, json.dumps(stored_codes)
            
            return False, stored_codes_json
        except Exception as e:
            current_app.logger.error(f"Backup code verification error: {str(e)}")
            return False, stored_codes_json
