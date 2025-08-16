# Asset Anchor Security Hardening Guide

This document provides comprehensive security hardening guidelines for Asset Anchor's production environment.

## Infrastructure Security

### Cloud Provider Security

#### Render Security Best Practices

1. **Access Control**
   - Enforce SSO authentication for Render dashboard
   - Implement role-based access control (RBAC)
   - Restrict dashboard access to specific IP ranges
   ```bash
   # Example Render IP restriction configuration
   RENDER_IP_RULES="office:192.168.1.0/24,vpn:10.0.0.0/8"
   ```

2. **Network Security**
   - Enable private networking between services
   - Use internal service URLs for service-to-service communication
   - Configure outbound traffic rules to limit destinations

3. **Secret Management**
   - Use environment variable groups for shared secrets
   - Enable secret rotation and versioning
   - Implement secret detection in CI/CD pipelines

#### Vercel Security Configuration

1. **Domain Security**
   - Enable DNSSEC for all domains
   - Configure CAA DNS records
   ```
   example.com. IN CAA 0 issue "letsencrypt.org"
   example.com. IN CAA 0 issuewild ";"
   ```
   - Implement HSTS preloading

2. **Deployment Security**
   - Restrict production deployments to specific branches
   - Require approval for production deployments
   - Enable preview protection for staging environments

### Database Security

1. **PostgreSQL Hardening**
   - Apply security-focused configuration:
   ```
   # PostgreSQL security settings
   password_encryption = scram-sha-256
   ssl = on
   ssl_cert_file = 'server.crt'
   ssl_key_file = 'server.key'
   log_statement = 'ddl'
   log_min_duration_statement = 1000
   ```

2. **Database Access Controls**
   - Use least-privilege role-based access
   - Implement row-level security for multi-tenant data
   ```sql
   -- Example row-level security policy
   CREATE POLICY tenant_isolation_policy ON properties
     USING (tenant_id = current_setting('app.tenant_id')::uuid);
   ```
   - Audit all database access

3. **Data Protection**
   - Encrypt sensitive columns with pgcrypto
   ```sql
   -- Example column encryption
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   UPDATE users SET ssn = pgp_sym_encrypt(ssn, current_setting('app.encryption_key'));
   ```
   - Implement data masking for non-production environments

## Application Security

### API Security

1. **Authentication Hardening**
   - Implement proper JWT handling:
   ```python
   # JWT security settings
   JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
   JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=14)
   JWT_COOKIE_SECURE = True
   JWT_COOKIE_SAMESITE = 'Lax'
   ```

   - Enforce MFA for all admin operations
   - Implement IP-based rate limiting for auth endpoints

2. **Input Validation**
   - Use strict schema validation for all API requests
   - Implement content security policy headers
   ```python
   # Example CSP header
   CSP_POLICY = "default-src 'self'; script-src 'self'; object-src 'none'; upgrade-insecure-requests;"
   ```
   - Sanitize all user-provided data

3. **Output Encoding**
   - Implement proper encoding for different contexts (HTML, JSON, etc.)
   - Set secure cookie attributes
   ```python
   SESSION_COOKIE_SECURE = True
   SESSION_COOKIE_HTTPONLY = True
   SESSION_COOKIE_SAMESITE = 'Lax'
   ```

### Frontend Security

1. **XSS Prevention**
   - Implement strict Content-Security-Policy
   ```
   Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted-cdn.com; style-src 'self'; img-src 'self' data:; connect-src 'self' https://api.assetanchor.com;
   ```
   - Use React's built-in XSS protections
   - Implement subresource integrity for CDN resources

2. **CSRF Protection**
   - Include anti-CSRF tokens in all state-changing requests
   - Validate Origin and Referer headers
   - Use SameSite cookie attribute

3. **Client-side Storage**
   - Never store sensitive data in localStorage or sessionStorage
   - Implement secure-by-default encryption for any client-side cached data
   - Clear sensitive data when no longer needed

## Security Monitoring

### Logging Configuration

1. **Centralized Logging**
   - Configure structured logging for all services
   ```python
   # Example logging configuration
   LOGGING = {
       'version': 1,
       'formatters': {
           'json': {
               'class': 'pythonjsonlogger.jsonlogger.JsonFormatter',
               'format': '%(asctime)s %(process)d %(levelname)s %(name)s %(message)s'
           }
       },
       'handlers': {
           'console': {
               'class': 'logging.StreamHandler',
               'formatter': 'json'
           }
       },
       'loggers': {
           '': {
               'handlers': ['console'],
               'level': 'INFO'
           }
       }
   }
   ```
   - Ensure PII is masked in all logs
   - Implement log correlation with request IDs

2. **Audit Logging**
   - Log all authentication events
   - Log all privileged operations
   - Log all data access to sensitive information
   ```python
   # Example audit log
   audit_logger.info('User data accessed', extra={
       'user_id': request.user.id,
       'accessed_user_id': target_user_id,
       'action': 'user_profile_view',
       'ip_address': request.remote_addr,
       'success': True
   })
   ```

### Security Monitoring

1. **Intrusion Detection**
   - Configure alert thresholds for suspicious activity
   ```
   # Example alert conditions
   - Multiple failed login attempts (>5 in 10 minutes)
   - Access to admin endpoints from unusual IPs
   - Sudden spike in API error rates
   - Unusual data access patterns
   ```
   - Set up real-time alerting for security events
   - Implement honeypot endpoints to detect scanning

2. **Dependency Monitoring**
   - Configure automatic alerts for vulnerable dependencies
   - Implement supply chain security monitoring
   ```bash
   # Example dependency monitoring setup
   npm install -g dependency-check
   dependency-check --project "Asset Anchor" --scan node_modules
   ```

## Security Automation

### CI/CD Security Checks

1. **Automated Security Testing**
   - Configure SAST tools for code analysis
   ```yaml
   # Example GitHub Action for SAST
   name: Security Scan
   on:
     push:
       branches: [main, develop]
   jobs:
     security:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Run SAST scan
           run: |
             pip install bandit
             bandit -r ./backend -f json -o security-report.json
   ```
   - Implement DAST for deployed environments
   - Run dependency scans on every build

2. **Security Gate**
   - Block deployments with high-severity vulnerabilities
   - Enforce security standards through automation
   ```bash
   # Example pre-deploy security check
   ./scripts/security/check-vulnerabilities.sh || { echo "Security check failed"; exit 1; }
   ```

### Security Compliance Automation

1. **Automated Compliance Checks**
   - Set up scheduled compliance scans
   - Generate compliance reports automatically
   ```bash
   # Example compliance automation
   ./scripts/compliance/run-compliance-scan.sh --standard=PCI-DSS
   ```
   - Track compliance drift over time

2. **Security Configuration Validation**
   - Validate production security settings weekly
   - Compare against security baseline
   ```bash
   # Example security configuration validation
   ./scripts/security/validate-security-config.sh --environment=production
   ```

## Incident Response Automation

1. **Automated Remediation**
   - Implement auto-blocking for malicious IPs
   ```python
   # Example rate-limiting with auto-block
   RATELIMIT_DEFAULT = "100/hour"
   RATELIMIT_STRATEGY = "fixed-window-elastic-expiry"
   RATELIMIT_HEADERS_ENABLED = True
   
   @limiter.limit("10/minute")
   @app.route("/login", methods=["POST"])
   def login():
       # Track failed attempts
       if failed_login:
           track_failed_login(request.remote_addr)
           if get_failed_attempts(request.remote_addr) > 10:
               add_to_blocklist(request.remote_addr)
       # Login logic
   ```
   
   - Configure auto-scaling during DoS attempts
   - Set up automated backup triggers on security events

2. **Threat Hunting**
   - Run scheduled security sweeps
   ```bash
   # Example scheduled security sweep
   0 3 * * * /opt/assetanchor/scripts/security/threat-hunt.sh
   ```
   - Implement behavior analytics to detect anomalies
   - Log and alert on security hygiene metrics

## Security Hardening Checklist

Use this checklist to verify that all security controls have been implemented:

### Infrastructure

- [ ] Render/Vercel team access restricted to authorized personnel
- [ ] MFA enabled for all cloud provider accounts
- [ ] Network security groups properly configured
- [ ] All services use internal networking where possible
- [ ] Private endpoints used for database access
- [ ] Secrets stored in environment variables or secret management service
- [ ] Automatic backup and retention policies in place
- [ ] DNS security controls implemented (DNSSEC, CAA records)
- [ ] TLS 1.2+ enforced for all endpoints

### Application

- [ ] Input validation implemented for all endpoints
- [ ] Output encoding in place for all responses
- [ ] Authentication mechanism uses best practices
- [ ] Session management secure (timeout, secure cookies)
- [ ] Authorization checks in place for all endpoints
- [ ] CSRF protection implemented
- [ ] File upload validation and scanning configured
- [ ] API rate limiting configured
- [ ] Error handling does not expose sensitive information
- [ ] Sensitive data encrypted at rest and in transit

### Monitoring & Response

- [ ] Centralized logging implemented
- [ ] Audit logging for sensitive operations
- [ ] Real-time alerting for security events
- [ ] Regular security scanning automated
- [ ] Incident response plan documented and tested
- [ ] Security response team identified and trained
- [ ] Vulnerability management process in place

## Appendix: Security Tools

### Recommended Security Testing Tools

| Category | Tool | Purpose | Integration |
|----------|------|---------|------------|
| SAST | Bandit | Python code scanning | CI/CD |
| SAST | ESLint Security | JavaScript security rules | CI/CD |
| DAST | OWASP ZAP | Dynamic application scanning | Scheduled |
| Dependency | pip-audit | Python dependency scanning | CI/CD |
| Dependency | npm audit | JavaScript dependency scanning | CI/CD |
| Container | Trivy | Container vulnerability scanning | CI/CD |
| Secret Detection | Gitleaks | Git repository secret scanning | Pre-commit |
| Network | Nmap | Network security scanning | Scheduled |
