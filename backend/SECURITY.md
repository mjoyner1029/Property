# Security Guide for Asset Anchor API

This document outlines the security features, best practices, and configuration options for the Asset Anchor API.

## Security Features

### Authentication & Authorization

- **JWT Authentication**: JSON Web Tokens with refresh token rotation
- **Role-Based Access Control**: Admin, Landlord, and Tenant role separation
- **Multi-Factor Authentication**: Time-based One-Time Password (TOTP) support
- **Account Lockout**: Protection against brute force attacks

### API Security

- **Rate Limiting**: Prevents abuse and DoS attacks
- **Input Validation**: Comprehensive validation of all inputs
- **CORS Protection**: Strict cross-origin policy
- **Content Security Policy**: Prevents XSS and data injection attacks
- **HTTPS Enforcement**: TLS required for all communications

### Data Protection

- **Password Security**: Argon2id hashing with proper salting
- **Data Encryption**: Sensitive fields encrypted at rest
- **SQL Injection Protection**: Parameterized queries via SQLAlchemy
- **PII Handling**: Proper redaction and minimal collection

### Observability & Monitoring

- **Request Tracing**: Correlation IDs for all requests
- **Error Tracking**: Sentry integration with PII redaction
- **Security Logging**: Structured logging of security events
- **Health Monitoring**: Comprehensive health check endpoints

## Security Configuration

### Account Security Settings

Configure these settings in your environment file:

```
# Number of failed login attempts before lockout
ACCOUNT_LOCKOUT_MAX_ATTEMPTS=5

# Time window to count failed attempts (minutes)
ACCOUNT_LOCKOUT_WINDOW_MINUTES=15

# How long the account stays locked (minutes)
ACCOUNT_LOCKOUT_DURATION_MINUTES=30
```

### Password Policy

Configure password strength requirements:

```
# Minimum password length
PASSWORD_MIN_LENGTH=12

# Character type requirements
PASSWORD_REQUIRE_UPPERCASE=True
PASSWORD_REQUIRE_LOWERCASE=True
PASSWORD_REQUIRE_NUMBERS=True
PASSWORD_REQUIRE_SPECIAL=True
```

### Content Security Policy

The application implements a strong Content Security Policy (CSP) that can be customized:

```
# Enable CSP enforcement (vs. report-only mode)
CSP_ENFORCE=True

# URI for CSP violation reports
CSP_REPORT_URI=https://your-endpoint.com/csp-report

# Add additional domains to CSP directives
# Format: directive1:domain1,domain2;directive2:domain3,domain4
EXTRA_CSP_DOMAINS=script-src:https://cdn.example.com;img-src:https://images.example.com
```

### Rate Limiting

Configure rate limiting to prevent abuse:

```
# Default rate limits
RATELIMIT_DEFAULT=3000 per day,1000 per hour,100 per minute

# Redis backend for rate limiting
RATELIMIT_STORAGE_URL=redis://localhost:6379/0

# Rate limit key prefix
RATELIMIT_KEY_PREFIX=assetanchor-limiter
```

## Security Best Practices

### Secret Management

1. **Generate Strong Secrets**: Use high-entropy random values
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

2. **Use Different Secrets**: Never reuse secrets across environments or applications

3. **Rotate Secrets Regularly**: Implement a 90-day rotation schedule

### Environment Isolation

1. **Separate Environments**: Maintain distinct development, staging, and production environments

2. **Limit Access**: Restrict production access to essential personnel only

3. **Environment-Specific Settings**: Use appropriate security levels for each environment

### Secure Deployment

1. **HTTPS Only**: Configure proper TLS settings on your web server

2. **Minimal Permissions**: Run the application with least-privilege principles

3. **Regular Updates**: Keep dependencies updated to patch security vulnerabilities

## Security Incident Response

In case of a security incident:

1. **Isolate**: Contain the affected systems
2. **Investigate**: Determine the scope and impact
3. **Mitigate**: Address the immediate vulnerability
4. **Notify**: Inform affected parties according to regulations
5. **Learn**: Update procedures to prevent similar incidents

## Security Monitoring

The application provides several endpoints for security monitoring:

- `/health`: Basic application health check
- `/ready`: Database and service connectivity check

## Security Testing

Regularly perform security testing:

1. **Static Analysis**: Run security scanners against the codebase
   ```bash
   bandit -r src/
   ```

2. **Dependency Scanning**: Check for vulnerable dependencies
   ```bash
   safety check -r requirements.txt
   ```

3. **Penetration Testing**: Conduct regular penetration tests

4. **Security Headers**: Verify security headers
   ```bash
   curl -I https://api.assetanchor.io
   ```

## Contacts

For security concerns or questions, contact:
- security@assetanchor.io
