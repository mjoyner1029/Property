# Asset Anchor Backend Deployment Guide

This document provides detailed instructions for deploying the Asset Anchor backend to production environments.

## Prerequisites

- PostgreSQL 12+ database
- Redis server (for rate limiting and session management)
- Python 3.10+ runtime
- HTTPS-enabled web server (Nginx recommended)
- Sentry account for error tracking
- Stripe account for payment processing
- SMTP server for sending emails

## Environment Configuration

Copy the `.env.example` file to `.env.production` and fill in all required values:

```bash
cp .env.example .env.production
```

### Critical Security Configuration

The following environment variables are **required** for production deployments:

- `SECRET_KEY`: A high-entropy random string used for Flask session encryption
- `JWT_SECRET_KEY`: A separate high-entropy random string for JWT token signing
- `DATABASE_URL`: PostgreSQL connection string
- `CORS_ORIGINS`: Comma-separated list of allowed frontend origins
- `STRIPE_SECRET_KEY`: Stripe API key
- `STRIPE_WEBHOOK_SECRET`: Secret for verifying Stripe webhook signatures
- `SENTRY_DSN`: Data Source Name for Sentry error tracking

Generate strong secrets for both `SECRET_KEY` and `JWT_SECRET_KEY`:

```bash
# Run these commands to generate secure keys
python -c "import secrets; print('SECRET_KEY=' + secrets.token_hex(32))"
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))"
```

### Security Best Practices

1. **Do not reuse secrets** across environments or applications
2. **Rotate secrets** at least every 90 days
3. **Restrict database access** to only the application servers
4. **Configure CORS** to allow only trusted domains
5. **Enable rate limiting** to prevent abuse
6. **Use secure cookies** with proper SameSite settings
7. **Implement appropriate CSP** headers

## Database Setup

1. Create the database:

```bash
createdb assetanchor
```

2. Run migrations to set up the schema:

```bash
flask db upgrade
```

3. Seed initial data if needed:

```bash
python -m src.scripts.seed_data
```

## Production Server Configuration

We use Gunicorn as the WSGI server with recommended settings:

```bash
gunicorn --workers=4 --threads=2 --worker-class=gthread --bind=127.0.0.1:8000 --log-level=info --access-logfile=- --error-logfile=- "src.wsgi:app"
```

### Nginx Configuration

Configure Nginx as a reverse proxy with proper security headers:

```nginx
server {
    listen 443 ssl http2;
    server_name api.assetanchor.io;

    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy to Gunicorn
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        proxy_buffering off;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }

    # Health check endpoint - bypass rate limits
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.assetanchor.io;
    return 301 https://$server_name$request_uri;
}
```

## Log Rotation

Configure logrotate to manage application logs:

```
/var/log/assetanchor/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload gunicorn
    endscript
}
```

## Health Checks and Monitoring

- `/health`: Basic application health (should return HTTP 200)
- `/ready`: Checks database and Redis connectivity (returns HTTP 503 if services are down)

Configure your monitoring system to alert on any 5xx errors or if health checks fail.

## Background Jobs and Scheduled Tasks

For recurring tasks, configure Celery with Redis as the broker:

```bash
celery -A src.celery_app:app worker --loglevel=info
celery -A src.celery_app:app beat --loglevel=info
```

## Deployment Workflow

1. **Pre-deployment checks**:
   ```bash
   # Run tests and quality checks
   pytest
   flake8
   black --check src/
   ```

2. **Database migrations**:
   ```bash
   # Generate migration if schema changed
   flask db migrate -m "Description of changes"
   # Review migration file
   # Apply migration
   flask db upgrade
   ```

3. **Deploy application code**:
   ```bash
   # Update code
   git pull
   # Install dependencies
   pip install -r requirements.txt
   # Restart services
   systemctl restart gunicorn
   systemctl restart celery-worker
   systemctl restart celery-beat
   ```

4. **Post-deployment verification**:
   ```bash
   # Verify health endpoint
   curl https://api.assetanchor.io/health
   # Verify readiness
   curl https://api.assetanchor.io/ready
   ```

## Rollback Procedure

If a deployment fails, execute the rollback procedure:

1. Revert to the previous known working version:
   ```bash
   git checkout <previous-tag>
   ```

2. Rollback database if needed:
   ```bash
   flask db downgrade
   ```

3. Restart services:
   ```bash
   systemctl restart gunicorn
   systemctl restart celery-worker
   systemctl restart celery-beat
   ```

## Security Incident Response

In case of a security incident:

1. Isolate affected systems
2. Rotate all secrets
3. Review logs for unauthorized access
4. Report incident to security team
5. Implement necessary security patches

## Regular Maintenance

- Rotate secrets every 90 days
- Update dependencies monthly
- Review and update CSP headers quarterly
- Test backup and restore procedures quarterly
- Conduct security scanning monthly
