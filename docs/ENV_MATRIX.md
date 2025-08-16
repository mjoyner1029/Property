# Environment Variable Matrix

This document serves as a reference for all environment variables required by Asset Anchor across different environments.

## Environment Variable Requirements by Service

| Variable | Render (Backend) | Vercel (Frontend) | Local Dev | Description |
|----------|:----------------:|:-----------------:|:---------:|-------------|
| `DATABASE_URL` | ✅ | ❌ | ✅ | PostgreSQL connection string |
| `SECRET_KEY` | ✅ | ❌ | ✅ | Flask app secret key |
| `JWT_SECRET_KEY` | ✅ | ❌ | ✅ | JWT token signing key |
| `FLASK_ENV` | ✅ | ❌ | ✅ | Environment name (production, development) |
| `APP_ENV` | ✅ | ❌ | ✅ | Application environment (preferred over FLASK_ENV) |
| `CORS_ORIGINS` | ✅ | ❌ | ✅ | Allowed CORS origins (comma-separated) |
| `STRIPE_PUBLIC_KEY` | ✅ | ✅ | ✅ | Stripe publishable key |
| `STRIPE_SECRET_KEY` | ✅ | ❌ | ✅ | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | ✅ | ❌ | ✅ | Stripe webhook signing secret |
| `EMAIL_PROVIDER` | ✅ | ❌ | ✅ | Email service provider (postmark, sendgrid) |
| `EMAIL_API_KEY` | ✅ | ❌ | ✅ | Email service API key |
| `EMAIL_FROM` | ✅ | ❌ | ✅ | Sender email address |
| `LOG_LEVEL` | ✅ | ❌ | ✅ | Log level (DEBUG, INFO, WARNING, ERROR) |
| `REDIS_URL` | ✅ | ❌ | ✅ | Redis connection URL for rate limiting |
| `CSP_ENFORCE` | ✅ | ❌ | ✅ | Enable CSP enforcement (vs report-only) |
| `S3_BUCKET` | ✅ | ❌ | ✅ | AWS S3 bucket name |
| `S3_REGION` | ✅ | ❌ | ✅ | AWS S3 region |
| `AWS_ACCESS_KEY_ID` | ✅ | ❌ | ✅ | AWS access key ID |
| `AWS_SECRET_ACCESS_KEY` | ✅ | ❌ | ✅ | AWS secret access key |
| `SENTRY_DSN` | ✅ | ✅ | ✅ | Sentry error tracking DSN |
| `REACT_APP_API_BASE_URL` | ❌ | ✅ | ✅ | Backend API URL |
| `REACT_APP_STRIPE_PK` | ❌ | ✅ | ✅ | Stripe publishable key (same as STRIPE_PUBLIC_KEY) |
| `REACT_APP_SENTRY_DSN` | ❌ | ✅ | ✅ | Sentry error tracking DSN (same as SENTRY_DSN) |
| `REACT_APP_SOCKET_URL` | ❌ | ✅ | ✅ | Socket.io server URL |
| `NODE_ENV` | ❌ | ✅ | ✅ | Node.js environment (production, development) |

## Production Values

| Environment | Value Format | Example |
|-------------|-------------|---------|
| `DATABASE_URL` | `postgres://username:password@host:port/database_name` | `postgres://doadmin:abc123...xyz@db-postgresql-nyc1-12345.ondigitalocean.com:25060/assetanchor` |
| `SECRET_KEY` | Random string (32+ characters) | `6c1c1ee63a3ab84144e277fd551f0937` |
| `JWT_SECRET_KEY` | Random string (32+ characters) | `f9e015a1cb10e2fc477fdb3979ebbe34` |
| `FLASK_ENV` | String | `production` |
| `APP_ENV` | String | `production` |
| `CORS_ORIGINS` | Comma-separated URLs | `https://assetanchor.io,https://www.assetanchor.io` |
| `STRIPE_PUBLIC_KEY` | Stripe key | `pk_live_51Axyz...` |
| `STRIPE_SECRET_KEY` | Stripe key | `sk_live_51Axyz...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_abc123...` |
| `EMAIL_PROVIDER` | String | `postmark` |
| `EMAIL_API_KEY` | API key | `12345678-90ab-cdef-ghij-klmnopqrstuv` |
| `EMAIL_FROM` | Email address | `no-reply@assetanchor.io` |
| `LOG_LEVEL` | String | `INFO` |
| `REDIS_URL` | Redis connection string | `redis://username:password@host:port` |
| `CSP_ENFORCE` | Boolean | `true` |
| `S3_BUCKET` | String | `assetanchor-uploads-prod` |
| `S3_REGION` | AWS region code | `us-west-2` |
| `AWS_ACCESS_KEY_ID` | AWS key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `SENTRY_DSN` | Sentry DSN | `https://abcdef123456@o123456.ingest.sentry.io/1234567` |
| `REACT_APP_API_BASE_URL` | URL | `https://api.assetanchor.io` |
| `REACT_APP_STRIPE_PK` | Stripe key | `pk_live_51Axyz...` |
| `REACT_APP_SENTRY_DSN` | Sentry DSN | `https://abcdef123456@o123456.ingest.sentry.io/1234567` |
| `REACT_APP_SOCKET_URL` | URL | `https://api.assetanchor.io` |
| `NODE_ENV` | String | `production` |

## Environment Setup Checklist

### Render (Backend)

- [ ] Add all required environment variables in Render Dashboard
- [ ] Set appropriate values for the target environment (dev, staging, prod)
- [ ] Ensure sensitive values are marked as secret
- [ ] Verify that Redis service is connected properly
- [ ] Set `CSP_ENFORCE=false` initially, then enable after testing

### Vercel (Frontend)

- [ ] Add all required environment variables in Vercel Dashboard
- [ ] Set appropriate values for the target environment
- [ ] Ensure API URL points to the correct backend environment
- [ ] Verify that Stripe public key is set correctly

### Local Development

- [ ] Copy `.env.example` to `.env` in backend directory
- [ ] Copy `.env.example` to `.env` in frontend directory
- [ ] Set values appropriate for local development
- [ ] Ensure local database is configured correctly
- [ ] Set up local Redis instance if needed

## Security Considerations

- Do not commit real environment values to the repository
- Use different secrets for different environments
- Rotate secrets regularly, especially production secrets
- Restrict access to environment configuration in CI/CD systems
- Use environment-specific API keys and credentials

## Migration Process

When migrating to a new environment or deploying to production:

1. Create all required environment variables in the target environment
2. Validate database connection string
3. Test email sending with the new configuration
4. Verify S3 bucket permissions
5. Check Stripe webhook configuration
6. Ensure CORS is configured properly
7. Test the full application to verify configuration
