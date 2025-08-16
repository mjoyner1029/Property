# Monitoring & Alerting Guide

This document outlines the monitoring strategy for Asset Anchor in production.

## Monitoring Services

| Service Type | Primary Tool | Secondary Tool | What to Monitor |
|--------------|--------------|----------------|-----------------|
| Application Performance | Sentry | Render Metrics | Errors, response times |
| Infrastructure | Render Dashboard | - | CPU, memory, disk usage |
| Uptime | UptimeRobot | StatusCake | API & frontend availability |
| Error Tracking | Sentry | Logging | Exceptions, errors |
| Database | Render Dashboard | - | Connections, query performance |
| Security | AWS CloudTrail | Auth logs | Access attempts, unusual activity |

## Health Check Endpoints

| Endpoint | URL | Expected Response | Frequency |
|----------|-----|-------------------|-----------|
| API Health | https://api.assetanchor.io/api/health | `{"status": "ok"}` | 1 min |
| Frontend | https://assetanchor.io | 200 OK | 5 min |
| DB Status | Internal via API health | "connected" | 1 min |

## Alert Thresholds

### Response Time Alerts

| Endpoint Type | Warning Threshold | Critical Threshold | Action |
|---------------|-------------------|-------------------|--------|
| Health check | p95 > 200ms | p95 > 500ms | Check DB load |
| Auth endpoints | p95 > 500ms | p95 > 1000ms | Check rate limiting |
| Property endpoints | p95 > 600ms | p95 > 1200ms | Check query performance |
| Document endpoints | p95 > 800ms | p95 > 1500ms | Check S3 connectivity |
| All other API | p95 > 500ms | p95 > 1000ms | General investigation |

### Error Rate Alerts

| Error Type | Warning Threshold | Critical Threshold | Action |
|------------|-------------------|-------------------|--------|
| 5xx errors | > 0.1% of requests | > 1% of requests | Check logs, possible rollback |
| 4xx errors | > 5% of requests | > 10% of requests | Check client requests |
| Auth failures | > 20 per minute | > 100 per minute | Check for attack attempts |
| Stripe webhook failures | Any | > 3 consecutive | Check Stripe dashboard |

### Infrastructure Alerts

| Metric | Warning Threshold | Critical Threshold | Action |
|--------|-------------------|-------------------|--------|
| CPU | > 70% for 5 min | > 90% for 5 min | Scale up or optimize |
| Memory | > 80% for 5 min | > 90% for 5 min | Check for leaks, scale up |
| Disk | > 80% usage | > 90% usage | Clean up or expand storage |
| Database connections | > 80% of max | > 90% of max | Check connection pooling |

## Monitoring Setup Instructions

### Uptime Robot Configuration

1. Create a new monitor:
   - Monitor type: HTTP(s)
   - Friendly name: "Asset Anchor API Health"
   - URL: https://api.assetanchor.io/api/health
   - Monitoring interval: 1 minute
   - Alert contacts: on-call team

2. Create frontend monitor:
   - Monitor type: HTTP(s)
   - Friendly name: "Asset Anchor Frontend"
   - URL: https://assetanchor.io
   - Monitoring interval: 5 minutes
   - Alert contacts: on-call team

### Sentry Configuration

1. Backend Error Monitoring:
   - Import Sentry in Flask app
   - Set environment tags
   - Configure alert rules for error frequency

2. Frontend Error Monitoring:
   - Import Sentry in React app
   - Set user context when logged in
   - Configure alert rules for error frequency

### Custom Alert Rules

```js
// Example Sentry alert rule (pseudocode)
if (error.type == 'DatabaseConnectionError' && error.count > 3) {
  notifyViaSlack('#alerts-critical');
  sendSMS(on_call_phone);
}
```

## Dashboard Links

- [Render Dashboard](https://dashboard.render.com/web/srv-abc123)
- [Vercel Dashboard](https://vercel.com/assetanchor/frontend)
- [Sentry Dashboard](https://sentry.io/organizations/assetanchor/issues)
- [UptimeRobot Dashboard](https://uptimerobot.com/dashboard)
- [Stripe Dashboard](https://dashboard.stripe.com)

## Incident Response Process

1. **Alert received**: On-call engineer acknowledges
2. **Investigation**: Determine impact and cause
3. **Mitigation**: Apply immediate fix or rollback
4. **Resolution**: Implement permanent solution
5. **Post-mortem**: Document incident and preventative measures

## Weekly Monitoring Review

Schedule a weekly review of:
- Error rates and patterns
- Performance trends
- Resource utilization
- Security events
- Customer-reported issues
