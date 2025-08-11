# Environment Variables

This document outlines the required environment variables for Asset Anchor's production deployment.

## Backend (Render)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:port/db` |
| `SECRET_KEY` | Flask app secret key | `random-secure-string` |
| `JWT_SECRET_KEY` | JWT token signing key | `another-random-secure-string` |
| `FLASK_ENV` | Environment name | `production` |
| `CORS_ORIGINS` | Allowed CORS origins | `https://assetanchor.io,https://www.assetanchor.io` |
| `STRIPE_PUBLIC_KEY` | Stripe publishable key | `pk_live_...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `EMAIL_PROVIDER` | Email service provider | `postmark` |
| `EMAIL_API_KEY` | Email service API key | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `EMAIL_FROM` | Sender email address | `no-reply@assetanchor.io` |
| `LOG_LEVEL` | Log level | `INFO` |
| `APP_ENV` | Application environment (preferred over FLASK_ENV) | `production` |
| `REDIS_URL` | Redis connection URL for rate limiting | `redis://username:password@host:port` |
| `CSP_ENFORCE` | Enable CSP enforcement (vs report-only) | `true` |
| `S3_BUCKET` | AWS S3 bucket name | `assetanchor-uploads` |
| `S3_REGION` | AWS S3 region | `us-west-2` |
| `AWS_ACCESS_KEY_ID` | AWS access key ID | `AKIAXXXXXXXXXXXXXXXX` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `SENTRY_DSN` | Sentry error tracking DSN | `https://...@sentry.io/...` |

## Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_BASE_URL` | Backend API URL | `https://api.assetanchor.io` |
| `REACT_APP_STRIPE_PK` | Stripe publishable key | `pk_live_...` |
| `REACT_APP_SENTRY_DSN` | Sentry error tracking DSN | `https://...@sentry.io/...` |

## Local Development

For local development, copy the example files to create your local environment files:

### Backend

Copy `.env.example` to `.env` in the backend directory.

### Frontend

Copy `.env.example` to `.env` in the frontend directory.

## Security Notes

- Never commit real secrets to the repository
- Rotate secrets regularly (at least every 90 days)
- Use strong, randomly generated values for all keys
- Store production secrets in a secure vault or password manager
- Use different keys for different environments (development, staging, production)
