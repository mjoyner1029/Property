# Error Budget & Alert Policies

This document outlines the error budget policy, monitoring strategy, and alert thresholds for the Property application across environments.

## Error Budget Policy

Error budgets quantify the acceptable level of errors or downtime for our application, balancing reliability with the velocity of feature development.

### Definitions

- **Error Budget**: The allowed amount of errors or downtime within a given time period
- **SLO (Service Level Objective)**: Our internal reliability targets
- **SLI (Service Level Indicator)**: Metrics we use to measure service reliability

### Production Error Budget

| Metric | SLO Target | Error Budget (per 30 days) |
|--------|------------|----------------------------|
| Availability | 99.9% | 43 minutes of downtime |
| API Success Rate | 99.95% | 0.05% of requests can fail |
| P95 Latency | < 300ms | 5% of requests can exceed 300ms |
| Successful Payments | 99.99% | 0.01% of payments can fail |

### Staging Error Budget

| Metric | SLO Target | Error Budget (per 30 days) |
|--------|------------|----------------------------|
| Availability | 99.5% | 3.6 hours of downtime |
| API Success Rate | 99.5% | 0.5% of requests can fail |
| P95 Latency | < 500ms | 5% of requests can exceed 500ms |

### Budget Consumption Rules

1. If 50% of the monthly error budget is consumed within 7 days, trigger a warning alert.
2. If 75% of the monthly error budget is consumed within 14 days, trigger high-priority alerts.
3. If 100% of the error budget is consumed, freeze non-critical deployments until reliability improves.

## Monitoring Strategy

### Key Metrics

1. **Health & Uptime**
   - API and frontend uptime
   - Health check success rate
   - Database connectivity

2. **Performance**
   - API endpoint latency (by path)
   - Database query performance 
   - Frontend load times

3. **Error Rates**
   - HTTP 5xx errors
   - Unhandled exceptions
   - Authentication failures
   - Payment processing errors

4. **Business Metrics**
   - Payment success rate
   - Tenant onboarding success
   - Property listing creation

### Tool Integration

| Tool | Purpose | Integration Point |
|------|---------|-------------------|
| Sentry | Error tracking | Backend + Frontend |
| GitHub Actions | Scheduled health checks | CI/CD Pipeline |
| Pingdom/BetterUptime | Uptime monitoring | Production endpoints |
| Custom Dashboard | Business KPIs | Admin portal |

## Alert Configuration

### Sentry Alerts

1. **Error Spike Rule**
   - **Threshold**: > 10 errors in 5 minutes (production), > 20 errors in 5 minutes (staging)
   - **Actions**: Slack notification, PagerDuty (production only)
   - **Setup**: 
     ```
     Project Settings → Alerts → Create Alert Rule → 
     Select "Number of Errors" → Set threshold and time window
     ```

2. **Release Health**
   - **Threshold**: Session crash rate > 1% (production), > 2% (staging)
   - **Actions**: Slack notification, email to development team
   - **Setup**:
     ```
     Project Settings → Alerts → Create Alert Rule → 
     Select "Crash Rate" → Set threshold
     ```

3. **Performance Alerts**
   - **Threshold**: P95 transaction duration increase > 50% over 1-hour window
   - **Actions**: Slack notification to performance team
   - **Setup**:
     ```
     Performance → Alerts → Create Alert → 
     Select "Transaction Duration" → Set threshold
     ```

### Uptime Monitoring

1. **API Health Checks**
   - **Endpoint**: `/health` and key API endpoints
   - **Frequency**: Every 1 minute
   - **Threshold**: > 2 consecutive failures
   - **Actions**: Slack, SMS to on-call engineer

2. **Frontend Checks**
   - **Pages**: Home, Login, Dashboard
   - **Frequency**: Every 5 minutes
   - **Threshold**: > 2 consecutive failures or latency > 3s
   - **Actions**: Slack notification

### Custom Payment Monitoring

1. **Failed Payment Webhook Alerts**
   - **Threshold**: > 3 failed webhook deliveries in 10 minutes
   - **Actions**: Immediate Slack notification to payments team
   - **Implementation**: Custom logic in webhook handler

2. **Payment Success Rate**
   - **Threshold**: < 98% success rate over 15-minute window
   - **Actions**: Slack, email to finance team
   - **Implementation**: Scheduled job analyzing payment logs

## Response Protocol

### Alert Severity Levels

| Level | Definition | Response Time | Escalation Path |
|-------|------------|---------------|-----------------|
| P0 | Critical production incident affecting all users | 15 minutes | On-call → Engineering Lead → CTO |
| P1 | Production incident affecting subset of users | 30 minutes | On-call → Engineering Team |
| P2 | Degraded experience, not blocking | 4 hours | Engineering Team |
| P3 | Minor issues, non-urgent | 1-2 business days | Product team triage |

### Incident Management Process

1. **Detection**: Alert triggered through monitoring systems
2. **Triage**: On-call engineer assesses impact and severity
3. **Communication**: Update status page, notify stakeholders
4. **Resolution**: Fix issue or implement workaround
5. **Post-mortem**: Document root cause, preventive measures

## Implementation Status

- ✅ Sentry error tracking
- ✅ Basic health check endpoints
- ✅ Scheduled load testing
- 🔜 Automated uptime monitoring
- 🔜 Business metrics dashboard
- 🔜 PagerDuty integration
