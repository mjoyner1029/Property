# CI/CD Secrets Configuration

This document provides information about the GitHub secrets required for Asset Anchor's CI/CD pipelines.

## Required GitHub Secrets

### Render Secrets (Backend)

| Secret Name | Description |
|-------------|-------------|
| `RENDER_API_KEY` | API key for Render.com to trigger deployments programmatically |
| `RENDER_BACKEND_SERVICE_ID` | The ID of the main backend service in Render |
| `RENDER_MIGRATIONS_SERVICE_ID` | The ID of the database migrations service in Render |

### Vercel Secrets (Frontend)

| Secret Name | Description |
|-------------|-------------|
| `VERCEL_ORG_ID` | Your Vercel organization ID |
| `VERCEL_PROJECT_ID` | The ID of your frontend project in Vercel |
| `VERCEL_TOKEN` | API token for Vercel to trigger deployments |

## Optional GitHub Secrets

| Secret Name | Description |
|-------------|-------------|
| `SENTRY_AUTH_TOKEN` | Auth token for Sentry source map uploads (if using Sentry) |
| `SLACK_WEBHOOK_URL` | Webhook URL for deployment notifications to Slack |

## How to Obtain Secrets

### Render Secrets

1. **RENDER_API_KEY**
   - Go to Render Dashboard > Account Settings > API Keys
   - Create a new API key with appropriate permissions
   - Copy the key value

2. **RENDER_BACKEND_SERVICE_ID & RENDER_MIGRATIONS_SERVICE_ID**
   - Go to the service in Render Dashboard
   - The service ID is in the URL: `https://dashboard.render.com/web/srv-xxxxxxxxxxxx`
   - The ID is the `srv-xxxxxxxxxxxx` part

### Vercel Secrets

1. **VERCEL_ORG_ID & VERCEL_PROJECT_ID**
   - Go to Vercel Dashboard > Project Settings > General
   - Scroll down to "Project ID" and "Organization ID"
   - Copy these values

2. **VERCEL_TOKEN**
   - Go to Vercel Dashboard > Account Settings > Tokens
   - Create a new token with appropriate permissions
   - Copy the token value

## Setting GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings > Secrets > Actions
3. Click "New repository secret"
4. Enter the secret name and value
5. Click "Add secret"

## Verifying Secrets Configuration

You can verify that all required secrets are properly configured by running the CI/CD workflows.

Each workflow has a preflight check step that will fail with a clear message if any required secrets are missing.

## Troubleshooting

If you encounter CI/CD failures related to secrets:

1. Check that all required secrets are configured correctly
2. Ensure the secrets have the correct permissions
3. Verify that service IDs are valid and active
4. Check if API keys or tokens have expired
