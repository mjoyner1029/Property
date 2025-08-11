# Observability Guide for Asset Anchor

This document outlines the observability strategy for monitoring the health and performance of the Asset Anchor application.

## Health Endpoints

Asset Anchor provides health endpoints to monitor the status of the application:

### Backend Health

```
GET https://api.assetanchor.io/api/health
```

This endpoint returns:
- Status: `ok` or `error`
- Version: The current application version
- Git SHA: The current commit hash
- Database status
- Environment information
- Timestamp

Sample response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "git_sha": "a1b2c3d4e5f6...",
  "database": "connected",
  "environment": "production",
  "python_version": "3.11.4",
  "timestamp": "2025-08-10T12:34:56.789Z"
}
```

### Frontend Health

The frontend automatically reports errors to Sentry when configured with `REACT_APP_SENTRY_DSN`.

## Monitoring Strategy

### Uptime Monitoring

Set up the following UptimeRobot checks:

1. **Frontend Heartbeat**
   - URL: `https://assetanchor.io`
   - Check Type: HTTP(s)
   - Interval: 5 minutes
   - Alert when: Down for 2 consecutive checks

2. **API Health**
   - URL: `https://api.assetanchor.io/api/health`
   - Check Type: HTTP(s) + Keyword (look for `"status": "ok"`)
   - Interval: 5 minutes
   - Alert when: Down for 2 consecutive checks

### Performance Monitoring

1. **Frontend Performance**
   - Monitor Core Web Vitals (LCP, FID, CLS)
   - Target LCP < 2.5s, FID < 100ms, CLS < 0.1
   - Collect metrics with Sentry performance monitoring

2. **API Performance**
   - Monitor p50, p95, and p99 response times
   - Target p95 < 500ms for all endpoints
   - Monitor error rates (4xx and 5xx responses)
   - Alert on sudden increases in error rates

### Resource Monitoring

1. **Database**
   - Monitor PostgreSQL connection pool usage
   - Monitor query performance and slow queries
   - Set alerts for high CPU/memory usage

2. **Web Service**
   - Monitor CPU, memory, and disk usage
   - Set alerts for > 80% usage of any resource
   - Monitor request queue length and rejection rate

### Log Management

All application logs are centralized and searchable:

1. **Backend Logs**
   - Severity levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
   - Structured JSON format
   - Context includes request ID, user ID (when available), and endpoint

2. **Frontend Logs**
   - Console errors and warnings
   - Unhandled exceptions
   - User interactions with error states

### Alerts

Configure alerts for:

1. **Availability**
   - API or frontend downtime > 1 minute
   - Database connectivity issues

2. **Performance**
   - API p95 latency > 1 second for 5 minutes
   - Frontend LCP > 3 seconds for 10% of users

3. **Errors**
   - Error rate > 1% for 5 minutes
   - Any unhandled exception in critical flows

4. **Security**
   - Multiple failed login attempts
   - Unusual traffic patterns
   - API rate limit breaches

## Error Tracking with Sentry

Asset Anchor uses Sentry for error tracking in both the frontend and backend.

### Backend Integration

The backend integrates Sentry via the Flask integration:

```python
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn=os.environ.get('SENTRY_DSN'),
    integrations=[FlaskIntegration()],
    traces_sample_rate=0.2,
    environment=os.environ.get('FLASK_ENV', 'development'),
    send_default_pii=False
)
```

### Frontend Integration

The React frontend integrates Sentry:

```javascript
import * as Sentry from '@sentry/react';

if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    integrations: [new Sentry.BrowserTracing()],
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV
  });
}
```

## Dashboard and Visualization

Create dashboards in your monitoring tool of choice with the following views:

1. **System Health**
   - API and frontend uptime
   - Database connectivity
   - Error rates

2. **User Experience**
   - Page load times
   - API response times
   - User flow completion rates

3. **Business Metrics**
   - Active users
   - Subscription statuses
   - Payment success rates
   - Maintenance request resolution times

## Incident Response

1. **Alerting Channels**
   - Primary: PagerDuty/Opsgenie to on-call phone
   - Secondary: Slack #incidents channel
   - Escalation after 15 minutes of non-response

2. **Incident Severity Levels**
   - P1: Complete service outage
   - P2: Major functionality degraded
   - P3: Minor functionality impacted
   - P4: Cosmetic or non-critical issues

3. **Runbook Access**
   - All on-call staff have access to incident response runbooks
   - Common fixes documented in the internal knowledge base

## Implementing Monitoring

1. **Configure UptimeRobot**
   - Create account at [UptimeRobot](https://uptimerobot.com/)
   - Add monitors for `https://assetanchor.io` and `https://api.assetanchor.io/health`
   - Configure notifications to go to the operations team

2. **Setup Sentry**
   - Create projects for both frontend and backend
   - Configure alert rules and notification channels
   - Add source maps for frontend error deobfuscation

3. **Resource Monitoring**
   - Use Render's built-in metrics for service monitoring
   - Set up custom alerts for CPU, memory, and disk usage thresholds
