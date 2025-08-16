# Asset Anchor Security Best Practices

This document outlines security best practices for the Asset Anchor application development and operations teams.

## Authentication and Authorization

### Password Security

1. **Password Storage**
   - Use Argon2id for password hashing
   - Configure appropriate memory, iterations, and parallelism parameters
   ```python
   # Example implementation
   from argon2 import PasswordHasher
   
   ph = PasswordHasher(
       time_cost=4,       # Number of iterations
       memory_cost=65536,  # Memory usage in kB
       parallelism=4,      # Parallelism factor
       hash_len=32         # Length of the hash in bytes
   )
   
   # Hash password
   hash = ph.hash(password)
   
   # Verify password
   try:
       ph.verify(hash, password)
       # Password is correct
   except:
       # Password is incorrect
   ```

2. **Password Policy**
   - Minimum length: 12 characters
   - Complexity requirements: Include uppercase, lowercase, numbers, and special characters
   - Maximum age: 90 days
   - Password history: Remember last 5 passwords
   - Prevent common/leaked passwords using HaveIBeenPwned API integration

3. **Multi-Factor Authentication**
   - Require MFA for all administrative accounts
   - Support TOTP (Time-based One-Time Password) via authenticator apps
   - Provide backup methods (recovery codes, alternate email)
   - Consider WebAuthn (FIDO2) for phishing-resistant authentication

### JWT Implementation

1. **Token Security**
   - Use RS256 (RSA Signature with SHA-256) for production
   - Set appropriate expiration times (15 minutes for access tokens, 14 days for refresh tokens)
   - Include only necessary claims to minimize token size

   ```python
   # Example JWT configuration
   JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')  # For HS256
   JWT_PRIVATE_KEY = os.environ.get('JWT_PRIVATE_KEY')  # For RS256
   JWT_PUBLIC_KEY = os.environ.get('JWT_PUBLIC_KEY')  # For RS256
   JWT_ALGORITHM = 'RS256'
   JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
   JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=14)
   JWT_COOKIE_SECURE = True
   JWT_COOKIE_SAMESITE = 'Lax'  # Consider 'Strict' for increased security
   ```

2. **Token Management**
   - Implement token blacklisting for logout
   - Use Redis for efficient blacklist storage with TTL
   - Enforce single-device sessions for security-critical operations
   - Implement automatic token refresh mechanism

### Role-Based Access Control (RBAC)

1. **Role Hierarchy**
   ```
   SuperAdmin > Admin > Manager > User > ReadOnly
   ```

2. **Permission Structure**
   - Resource-based permissions (e.g., `property:create`, `property:read`, `property:update`, `property:delete`)
   - Hierarchical inheritance (higher roles inherit permissions from lower roles)
   - Tenant-specific roles for multi-tenant scenarios

3. **Implementation**
   ```python
   # Example permission check decorator
   def require_permission(permission):
       def decorator(f):
           @wraps(f)
           def decorated_function(*args, **kwargs):
               if not current_user.has_permission(permission):
                   abort(403)
               return f(*args, **kwargs)
           return decorated_function
       return decorator
   
   # Usage
   @app.route('/api/properties', methods=['POST'])
   @require_permission('property:create')
   def create_property():
       # Implementation...
   ```

## API Security

### Input Validation

1. **Request Validation**
   - Use Marshmallow or Pydantic schemas for request validation
   - Validate all input parameters including query parameters, headers, and body
   - Implement strict type checking and bounds validation

   ```python
   # Example Marshmallow schema
   class PropertySchema(Schema):
       id = fields.UUID(dump_only=True)
       name = fields.Str(required=True, validate=Length(min=1, max=100))
       address = fields.Str(required=True, validate=Length(min=5, max=200))
       price = fields.Decimal(required=True, validate=Range(min=0))
       bedrooms = fields.Integer(validate=Range(min=0, max=20))
       bathrooms = fields.Float(validate=Range(min=0, max=20))
       
   # In route handler
   @app.route('/api/properties', methods=['POST'])
   @require_permission('property:create')
   def create_property():
       schema = PropertySchema()
       try:
           data = schema.load(request.json)
       except ValidationError as err:
           return jsonify({'errors': err.messages}), 400
       # Continue processing...
   ```

2. **SQL Injection Prevention**
   - Use ORM (SQLAlchemy) with parameterized queries
   - Avoid string formatting or concatenation in SQL statements
   - Apply least privilege to database users

3. **XSS Prevention**
   - Sanitize user-generated HTML content using libraries like `bleach`
   - Set appropriate Content Security Policy (CSP) headers
   - Use React's built-in XSS protection for frontend

### Rate Limiting

1. **Implementation**
   ```python
   # Example Flask rate limiting with flask-limiter
   from flask_limiter import Limiter
   from flask_limiter.util import get_remote_address
   
   limiter = Limiter(
       app,
       key_func=get_remote_address,
       default_limits=["200 per day", "50 per hour"]
   )
   
   # Apply rate limits to specific endpoints
   @app.route('/api/auth/login', methods=['POST'])
   @limiter.limit("10 per minute")  # Prevent brute force attacks
   def login():
       # Implementation...
   
   @app.route('/api/properties/search', methods=['GET'])
   @limiter.limit("30 per minute")  # Limit resource-intensive operations
   def search_properties():
       # Implementation...
   ```

2. **Rate Limit Configuration**
   - Set limits based on endpoint sensitivity and resource cost
   - Apply stricter limits for authentication endpoints
   - Consider different limits for authenticated vs. unauthenticated users
   - Implement exponential backoff for repeated failures

### CORS Configuration

```python
# Example Flask CORS configuration
from flask_cors import CORS

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://assetanchor.io",
            "https://www.assetanchor.io",
            "https://app.assetanchor.io"
        ],
        "supports_credentials": True,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Request-With"]
    }
})
```

## Data Protection

### Encryption

1. **Data at Rest**
   - Enable database encryption for PostgreSQL
   - Use AES-256 for sensitive fields in database
   - Encrypt sensitive files before storing in S3

   ```python
   # Example field-level encryption
   from cryptography.fernet import Fernet
   
   class EncryptionService:
       def __init__(self, key=None):
           if key is None:
               key = os.environ.get('ENCRYPTION_KEY')
           self.fernet = Fernet(key)
       
       def encrypt(self, data):
           if data is None:
               return None
           return self.fernet.encrypt(data.encode()).decode()
       
       def decrypt(self, encrypted_data):
           if encrypted_data is None:
               return None
           return self.fernet.decrypt(encrypted_data.encode()).decode()
   ```

2. **Data in Transit**
   - Enforce HTTPS for all connections
   - Configure TLS 1.2+ with strong cipher suites
   - Implement HSTS (HTTP Strict Transport Security)
   - Consider Certificate Pinning for mobile applications

### Sensitive Data Handling

1. **PII Classification**
   - Level 1 (High Sensitivity): SSN, financial account numbers, government IDs
   - Level 2 (Medium Sensitivity): Email addresses, phone numbers, dates of birth
   - Level 3 (Low Sensitivity): Names, addresses, publicly available information

2. **PII Protection Controls**
   - Apply encryption for Level 1 data
   - Apply access controls for Level 2 data
   - Apply audit logging for access to all sensitive data
   - Implement data masking in logs and non-production environments

3. **Data Retention Policy**
   - Retain user data only as long as necessary for business purposes
   - Implement automated data purging for expired data
   - Provide data export and deletion functionality for user data requests

## Infrastructure Security

### Container Security

1. **Docker Image Security**
   - Use minimal base images (alpine)
   - Keep base images updated with security patches
   - Scan images for vulnerabilities with Trivy
   - Remove development dependencies from production images
   - Run containers as non-root user

   ```dockerfile
   # Example secure Dockerfile
   FROM python:3.11-alpine
   
   # Create non-root user
   RUN addgroup -S appgroup && adduser -S appuser -G appgroup
   
   # Set working directory
   WORKDIR /app
   
   # Copy only the requirements file first
   COPY requirements.txt .
   
   # Install dependencies
   RUN pip install --no-cache-dir -r requirements.txt
   
   # Copy application code
   COPY --chown=appuser:appgroup . .
   
   # Switch to non-root user
   USER appuser
   
   # Run application
   CMD ["gunicorn", "--bind", "0.0.0.0:5000", "wsgi:app"]
   ```

2. **Container Runtime Security**
   - Apply principle of least privilege
   - Use read-only filesystem where possible
   - Limit resource usage (CPU, memory, file descriptors)
   - Implement network policies to restrict container communication

### Cloud Security

1. **AWS Security Best Practices**
   - Follow IAM least privilege principle
   - Use IAM roles instead of access keys when possible
   - Enable CloudTrail for API activity logging
   - Configure VPC with proper security groups and NACLs
   - Use AWS KMS for key management
   - Enable S3 bucket encryption and proper access policies

   ```terraform
   # Example S3 bucket policy enforcing encryption
   resource "aws_s3_bucket" "app_uploads" {
     bucket = "asset-anchor-uploads"
     acl    = "private"
   
     server_side_encryption_configuration {
       rule {
         apply_server_side_encryption_by_default {
           sse_algorithm = "AES256"
         }
       }
     }
   
     # Block public access
     block_public_acls       = true
     block_public_policy     = true
     ignore_public_acls      = true
     restrict_public_buckets = true
   }
   ```

2. **Secret Management**
   - Use environment variables for runtime configuration
   - Store secrets in AWS Secrets Manager or HashiCorp Vault
   - Rotate secrets regularly
   - Never commit secrets to source code

## Security Monitoring and Response

### Logging and Monitoring

1. **Security Event Logging**
   - Log all authentication attempts (successful and failed)
   - Log access to sensitive data
   - Log administrative actions
   - Log security-relevant system events

   ```python
   def log_security_event(event_type, user_id=None, **details):
       """Log security-relevant events to centralized log system"""
       log_data = {
           "event_type": event_type,
           "timestamp": datetime.utcnow().isoformat() + "Z",
           "user_id": user_id,
           "ip_address": request.remote_addr,
           "user_agent": request.user_agent.string,
           "details": details
       }
       app.logger.info(json.dumps(log_data))
   
   # Example usage
   @app.route('/api/auth/login', methods=['POST'])
   def login():
       # Implementation...
       if success:
           log_security_event("login_success", user.id)
           return jsonify({"token": token})
       else:
           log_security_event("login_failure", None, username=request.json.get('username'))
           return jsonify({"error": "Invalid credentials"}), 401
   ```

2. **Alerting on Security Events**
   - Alert on multiple failed login attempts
   - Alert on unusual access patterns
   - Alert on unauthorized access attempts
   - Alert on configuration changes

### Vulnerability Management

1. **Dependency Scanning**
   ```bash
   # Python dependency scanning
   pip install safety
   safety check
   
   # JavaScript dependency scanning
   npm audit
   ```

2. **Static Application Security Testing (SAST)**
   ```bash
   # Python SAST with Bandit
   pip install bandit
   bandit -r ./src
   
   # JavaScript SAST with ESLint security plugin
   npm install eslint-plugin-security
   eslint --plugin security --rule 'security/detect-eval-with-expression: error' ./src
   ```

3. **Container Scanning**
   ```bash
   # Scan container images with Trivy
   trivy image asset-anchor-api:latest
   ```

4. **Patch Management**
   - Update dependencies weekly
   - Apply security patches within 48 hours for critical vulnerabilities
   - Maintain an inventory of all software and dependencies
   - Subscribe to security mailing lists for used technologies

## Security Testing

### Security Testing Checklist

1. **Authentication Testing**
   - Verify password policy enforcement
   - Test account lockout after multiple failed attempts
   - Verify MFA implementation
   - Test password reset functionality
   - Verify session timeout
   
2. **Authorization Testing**
   - Test vertical access control (role-based)
   - Test horizontal access control (resource ownership)
   - Verify direct object reference protection
   - Test API endpoint permissions

3. **Input Validation Testing**
   - Test for SQL injection
   - Test for XSS vulnerabilities
   - Test for command injection
   - Test file upload validation
   - Test for CSRF vulnerabilities

4. **Encryption Testing**
   - Verify TLS configuration
   - Test for sensitive data exposure
   - Verify proper encryption of PII
   - Test key management procedures

### Automated Security Tests

```python
# Example pytest test for password policy
def test_password_policy():
    """Test that password policy is enforced"""
    # Test password too short
    resp = client.post('/api/auth/register', json={
        "email": "test@example.com",
        "password": "short"
    })
    assert resp.status_code == 400
    
    # Test password without complexity
    resp = client.post('/api/auth/register', json={
        "email": "test@example.com",
        "password": "passwordpassword"  # Long but no complexity
    })
    assert resp.status_code == 400
    
    # Test valid password
    resp = client.post('/api/auth/register', json={
        "email": "test@example.com",
        "password": "Secure-Password-123!"
    })
    assert resp.status_code == 201

# Example test for authorization
def test_resource_authorization():
    """Test that users can only access their own resources"""
    # Create two users
    user1 = create_test_user()
    user2 = create_test_user()
    
    # Create resource owned by user1
    resource = create_test_resource(user1.id)
    
    # Attempt to access with user2's token
    token2 = generate_token(user2)
    resp = client.get(f'/api/resources/{resource.id}', headers={
        'Authorization': f'Bearer {token2}'
    })
    
    # Should be forbidden
    assert resp.status_code == 403
```

## Compliance

### GDPR Compliance

1. **Data Subject Rights**
   - Implement data export functionality
   - Implement account deletion with complete data removal
   - Support data correction requests
   - Document data processing activities

2. **Privacy by Design**
   - Conduct Data Protection Impact Assessment (DPIA) for new features
   - Implement data minimization
   - Default to opt-in for optional data collection
   - Use pseudonymization where possible

3. **Breach Notification**
   - Develop breach detection capabilities
   - Create breach notification procedure
   - Document breach response plan
   - Conduct breach response tabletop exercises

### PCI DSS Compliance

1. **Scope Reduction**
   - Use third-party payment processors (Stripe)
   - Never store full card details
   - Implement tokenization for recurring payments
   - Segment network to isolate payment processing

2. **Requirement Implementation**
   - Maintain secure network with firewalls
   - Use strong access controls
   - Monitor and test networks regularly
   - Implement security awareness training

## Security Documentation

### Security Policies

1. **Access Control Policy**
   - Define user roles and responsibilities
   - Document access approval process
   - Specify account lifecycle management
   - Detail authentication requirements

2. **Incident Response Policy**
   - Define incident classification and severity levels
   - Document incident response procedures
   - Specify notification requirements
   - Detail post-incident review process

3. **Data Protection Policy**
   - Define data classification scheme
   - Document handling requirements by classification
   - Specify encryption standards
   - Detail data retention and destruction

### Security Training

1. **Developer Training**
   - OWASP Top 10 awareness
   - Secure coding practices
   - Common vulnerability recognition
   - Security testing methodologies

2. **Operations Training**
   - Incident response procedures
   - Security monitoring
   - Threat detection
   - Secure configuration management

## Appendix: Security Checklist

### Pre-Deployment Security Checklist

- [ ] All default credentials have been changed
- [ ] All unused services are disabled
- [ ] All unused ports are closed
- [ ] TLS is properly configured
- [ ] Security headers are implemented
- [ ] Error messages do not reveal sensitive information
- [ ] Access controls have been tested
- [ ] Input validation has been tested
- [ ] Dependency security scan shows no critical issues
- [ ] SAST scan shows no critical issues
- [ ] Authentication mechanisms have been reviewed
- [ ] Logging captures security-relevant events
- [ ] Rate limiting is configured
- [ ] Sensitive data is encrypted
- [ ] Backup and recovery has been tested
