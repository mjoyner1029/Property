# Observability Guide for Asset Anchor

This document outlines the comprehensive observability strategy for monitoring the health and performance of the Asset Anchor application.

## Observability Stack

Asset Anchor uses the following observability stack:

| Component | Tool | Purpose |
|-----------|------|---------|
| Logs | Cloudwatch Logs | Centralized log collection |
| Metrics | Prometheus | Metrics collection and storage |
| Dashboards | Grafana | Visualization and dashboards |
| Alerts | Grafana Alerting | Alert rules and notifications |
| Tracing | Sentry | Error tracking and performance monitoring |
| Uptime | Pingdom | External availability monitoring |
| Synthetic Testing | k6 | Load testing and synthetic monitoring |

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

### Detailed Health Check

```
GET https://api.assetanchor.io/api/health/detailed
```

This endpoint provides detailed information about all system components:
- Database connectivity and response time
- Redis cache status
- External API dependencies
- Storage service (S3) availability
- Background job processor status

### Readiness Probe

```
GET https://api.assetanchor.io/api/health/readiness
```

Used by load balancers and container orchestrators to determine if the service is ready to receive traffic.

### Liveness Probe

```
GET https://api.assetanchor.io/api/health/liveness
```

Used to determine if the application is running and responsive.
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

## Logging Strategy

### Log Levels and Usage

| Level | Usage | Examples |
|-------|-------|----------|
| ERROR | System failures requiring immediate attention | Database connection failures, payment processing errors |
| WARN | Potential issues that don't break functionality | Rate limiting applied, retry attempts |
| INFO | Normal operation events | User login, resource creation, API calls |
| DEBUG | Detailed troubleshooting information | Request/response payloads, SQL queries |

### Structured Logging Format

All logs should follow this JSON structure:

```json
{
  "timestamp": "2023-08-16T14:35:22.145Z",
  "level": "INFO",
  "service": "api-server",
  "environment": "production",
  "trace_id": "abc123def456",
  "request_id": "req_123456",
  "tenant_id": "tenant_abc123",
  "user_id": "user_xyz789",
  "message": "User logged in successfully",
  "context": {
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "login_method": "password"
  },
  "duration_ms": 125
}
```

### Backend Logging Implementation

```python
# src/utils/logging.py

import logging
import json
import time
import uuid
from datetime import datetime
from flask import request, g
import traceback

class StructuredLogFormatter(logging.Formatter):
    """JSON formatter for structured logs"""
    
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "service": "asset-anchor-api",
            "environment": os.environ.get("ENVIRONMENT", "development"),
            "message": record.getMessage(),
        }
        
        # Add request context if available
        if hasattr(g, 'request_id'):
            log_data["request_id"] = g.request_id
            
        if hasattr(g, 'tenant_id'):
            log_data["tenant_id"] = g.tenant_id
            
        if hasattr(g, 'user_id'):
            log_data["user_id"] = g.user_id
        
        # Add trace IDs for distributed tracing
        if hasattr(g, 'trace_id'):
            log_data["trace_id"] = g.trace_id
        
        # Add extra attributes from the record
        if hasattr(record, 'duration_ms'):
            log_data["duration_ms"] = record.duration_ms
            
        # Include structured data passed via extra
        if record.args and isinstance(record.args, dict):
            log_data["context"] = record.args
            
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "stacktrace": traceback.format_exception(*record.exc_info)
            }
            
        return json.dumps(log_data)
```

### PII Handling in Logs

To comply with data protection regulations, we automatically redact PII from logs:

```python
# src/utils/log_masker.py

import re

class LogMasker:
    """Utility for masking PII in logs"""
    
    # Patterns for sensitive data
    PATTERNS = {
        'credit_card': r'\b(?:\d{4}[-\s]?){3}\d{4}\b',
        'ssn': r'\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b',
        'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        'phone': r'\b(?:\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b'
    }
    
    @classmethod
    def mask_pii(cls, text):
        """Mask PII in text content"""
        if not isinstance(text, str):
            return text
            
        masked = text
        
        # Apply each pattern
        for name, pattern in cls.PATTERNS.items():
            if name == 'credit_card':
                # Keep last 4 digits of credit card
                masked = re.sub(pattern, lambda m: '****-****-****-' + m.group(0)[-4:], masked)
            elif name == 'ssn':
                # Keep last 4 digits of SSN
                masked = re.sub(pattern, '***-**-\\4', masked)
            elif name == 'email':
                # Mask email but keep domain
                masked = re.sub(
                    pattern, 
                    lambda m: m.group(0)[0] + '*****@' + m.group(0).split('@')[1], 
                    masked
                )
            elif name == 'phone':
                # Mask phone but keep last 4 digits
                masked = re.sub(pattern, '(***) ***-\\4', masked)
                
        return masked
```

## Monitoring Strategy

### Uptime Monitoring

Set up the following Pingdom checks:

1. **Frontend Heartbeat**
   - URL: `https://assetanchor.io`
   - Check Type: HTTP(s)
   - Interval: 1 minute
   - Alert when: Down for 2 consecutive checks

2. **API Health**
   - URL: `https://api.assetanchor.io/api/health`
   - Check Type: HTTP(s) + Keyword (look for `"status": "ok"`)
   - Interval: 1 minute
   - Alert when: Down for 2 consecutive checks
   
3. **Critical Business Flows**
   - Transaction check for user login flow
   - Transaction check for property search flow
   - Transaction check for payment processing flow

### Performance Monitoring

#### Key Metrics by Component

##### API Server Metrics

| Metric | Type | Description | Alert Threshold |
|--------|------|-------------|----------------|
| `http_requests_total` | Counter | Total HTTP requests | N/A |
| `http_request_duration_seconds` | Histogram | Request duration | p95 > 1s |
| `http_request_size_bytes` | Histogram | Request size | N/A |
| `http_response_size_bytes` | Histogram | Response size | N/A |
| `http_requests_in_progress` | Gauge | Concurrent requests | > 100 |
| `http_status_codes_total` | Counter | HTTP status codes | 5xx > 1% of traffic |

##### Database Metrics

| Metric | Type | Description | Alert Threshold |
|--------|------|-------------|----------------|
| `db_query_duration_seconds` | Histogram | Query execution time | p95 > 500ms |
| `db_connections_used` | Gauge | Active DB connections | > 80% of max |
| `db_connection_errors_total` | Counter | Failed connection attempts | > 5 in 5min |
| `db_deadlocks_total` | Counter | Number of deadlocks | > 0 |

##### Frontend Performance

1. **Core Web Vitals**
   - Monitor LCP (Largest Contentful Paint), FID (First Input Delay), CLS (Cumulative Layout Shift)
   - Target LCP < 2.5s, FID < 100ms, CLS < 0.1
   - Collect metrics with Sentry performance monitoring and Google Analytics 4

2. **Frontend Navigation Timing**
   - Track page transition times
   - Measure time-to-interactive for critical pages
   - Monitor JavaScript execution time

3. **API Client Metrics**
   - Track API call durations from client perspective
   - Monitor client-side error rates
   - Measure payload sizes and parsing times

### Resource Monitoring

1. **Database**
   - Monitor PostgreSQL connection pool usage
   - Track query performance with pg_stat_statements
   - Set alerts for bloat, vacuum failures, and replication lag
   - Monitor index usage statistics and missing indexes

2. **Web Service**
   - Monitor CPU, memory, and disk usage
   - Track file descriptor usage and network connections
   - Set alerts for > 80% usage of any resource
   - Monitor request queue length and rejection rate

3. **Redis Cache**
   - Monitor hit/miss ratios
   - Track memory usage and fragmentation
   - Set alerts for high eviction rates
   - Monitor command execution times

### Business Metrics

| Metric | Type | Description | Alert Threshold |
|--------|------|-------------|----------------|
| `active_users` | Gauge | Currently active users | N/A |
| `logins_total` | Counter | Number of user logins | N/A |
| `transactions_total` | Counter | Number of transactions | N/A |
| `transaction_value_total` | Counter | Total transaction value | N/A |
| `user_registration_rate` | Gauge | New users per day | < historical average - 25% |
| `conversion_rate` | Gauge | % of visitors who complete key actions | < historical average - 15% |

### Alert Strategy

#### Alert Severity Levels

| Severity | Response Time | Notification | Examples |
|----------|---------------|--------------|----------|
| Critical | 15 minutes | PagerDuty, SMS, Email | Service down, data loss |
| High | 1 hour | PagerDuty, Email | Degraded performance, partial outage |
| Medium | 8 hours | Email | Warning thresholds, capacity planning |
| Low | 3 days | Slack | Informational, trends |

#### Key Alerts

| Alert Name | Severity | Condition | Description |
|------------|----------|-----------|-------------|
| ServiceDown | Critical | Instance unavailable > 2m | API service instance is down |
| HighErrorRate | Critical | Error rate > 5% for 5m | High rate of 5xx errors |
| APILatency | High | p95 latency > 1s for 10m | API response time degradation |
| DatabaseConnectionPool | High | Connection usage > 90% for 5m | DB connection pool near capacity |
| SlowQueries | Medium | Query time > 1s | Database queries taking too long |
| DiskSpace | High | Disk usage > 85% | Running out of disk space |
| JobQueueGrowing | Medium | Queue size increasing for 30m | Background jobs backing up |
| CPUUsageHigh | Medium | CPU > 80% for 15m | High CPU utilization |
| MemoryUsageHigh | Medium | Memory > 80% for 15m | High memory utilization |
| LowSuccessRate | High | Success rate < 95% for 5m | Business transactions failing |

## Error Tracking and Distributed Tracing

### Sentry Integration

Asset Anchor uses Sentry for error tracking and performance monitoring in both the frontend and backend.

#### Backend Integration

```python
# src/utils/tracing.py

import time
from flask import request, g
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
import logging

logger = logging.getLogger(__name__)

def setup_tracing(app, environment):
    """Configure distributed tracing"""
    # Initialize Sentry for error tracking and performance monitoring
    sentry_sdk.init(
        dsn=app.config['SENTRY_DSN'],
        environment=environment,
        traces_sample_rate=0.1,  # Sample 10% of requests for performance
        integrations=[FlaskIntegration()],
        before_send=before_send_event
    )
    
    # Register middleware
    app.before_request(before_request)
    app.after_request(after_request)

def before_send_event(event, hint):
    """Process events before sending to Sentry"""
    # Skip certain errors we don't want to track
    if 'exc_info' in hint:
        exc_type, exc_value, tb = hint['exc_info']
        if isinstance(exc_value, (
            # Skip expected exceptions
            FileNotFoundError,
            # Add other exception types to ignore
        )):
            return None
    
    # Mask PII in event data
    if 'request' in event and 'data' in event['request']:
        from .log_masker import LogMasker
        event['request']['data'] = LogMasker.mask_dict(event['request']['data'])
    
    return event

def before_request():
    """Setup request context for tracing"""
    g.start_time = time.time()
    
    # Extract or generate trace ID for distributed tracing
    g.trace_id = request.headers.get('X-Trace-ID') or request.headers.get('X-Request-ID')
    if not g.trace_id:
        import uuid
        g.trace_id = str(uuid.uuid4())
        
    # Add user context to traces if authenticated
    if hasattr(g, 'user') and g.user:
        sentry_sdk.set_user({
            "id": g.user.id,
            "email": g.user.email,
            "tenant_id": g.user.tenant_id if hasattr(g.user, 'tenant_id') else None
        })
```

#### Frontend Integration

```javascript
// src/utils/monitoring.js

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export const initMonitoring = () => {
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      integrations: [
        new BrowserTracing({
          tracePropagationTargets: ["https://api.assetanchor.io"],
        }),
      ],
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
      beforeSend: (event) => {
        // Sanitize sensitive data
        if (event.request && event.request.data) {
          const sanitized = {...event.request.data};
          // Remove sensitive fields
          if (sanitized.password) sanitized.password = '[REDACTED]';
          if (sanitized.credit_card) sanitized.credit_card = '[REDACTED]';
          event.request.data = sanitized;
        }
        return event;
      }
    });

    // Set user context when user logs in
    export const setUserContext = (user) => {
      if (user && user.id) {
        Sentry.setUser({
          id: user.id,
          email: user.email,
          tenant_id: user.tenant_id
        });
      } else {
        Sentry.setUser(null); // Clear user on logout
      }
    };

    // Track frontend performance metrics
    export const trackPerformanceMetric = (name, value) => {
      Sentry.captureMessage(`Performance: ${name}`, {
        level: 'info',
        extra: { metric: name, value }
      });
    };
  }
};
```

## Dashboards and Visualization

### Dashboard Organization

| Dashboard | Purpose | Primary Audience | Refresh Rate |
|-----------|---------|-----------------|--------------|
| Executive Overview | High-level system health and business metrics | Management | 5m |
| Operational Health | Detailed system performance and status | Operations | 30s |
| API Performance | API latency, throughput, and errors | Engineering | 30s |
| Database Performance | Query performance, connection pools, locks | Database Engineers | 30s |
| User Experience | Frontend performance, errors, user journeys | Product | 1m |
| Business Metrics | Conversion rates, transaction volumes, growth | Product/Sales | 5m |

### Essential Dashboard Panels

#### Operational Health Dashboard

Key panels:
- Service uptime and health status
- Error rate by service
- API request rate and latency
- Database query rate and latency
- Background job queue size and processing rate
- Memory and CPU usage
- Disk space utilization

#### API Performance Dashboard

Key panels:
- Request rate by endpoint
- Latency percentiles by endpoint
- Error rate by endpoint
- Slow endpoints (p95 > 500ms)
- Top users by request volume
- Authentication failure rate
- Rate limiting events

## Synthetic Monitoring

### K6 Load Testing Script

```javascript
// k6/performance_test.js

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Define custom metrics
const errorRate = new Rate('error_rate');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users for 3 minutes
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should complete below 500ms
    'http_req_failed': ['rate<0.01'],    // Less than 1% of requests should fail
    'error_rate': ['rate<0.02'],         // Custom error rate should be below 2%
  },
};

// Simulate user authentication
function authenticate() {
  const loginRes = http.post('https://api.assetanchor.com/api/auth/login', {
    email: 'performance_test@example.com',
    password: 'testpassword',
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => JSON.parse(r.body).token !== undefined,
  });
  
  return JSON.parse(loginRes.body).token;
}

export default function() {
  const token = authenticate();
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  group('Properties API', function() {
    // Get properties list
    const propertiesRes = http.get('https://api.assetanchor.com/api/properties', {
      headers: authHeaders,
    });
    
    check(propertiesRes, {
      'properties status is 200': (r) => r.status === 200,
      'has properties array': (r) => Array.isArray(JSON.parse(r.body).properties),
    });
    errorRate.add(propertiesRes.status !== 200);
  });

  sleep(2);
}
```

## Incident Response Process

### Incident Response Workflow

1. **Detection**
   - Monitor Sentry alerts and Prometheus dashboards
   - Receive user/customer reports
   - Automated alerts from health checks

2. **Triage**
   - Determine severity level
   - Assign incident owner
   - Create incident channel in Slack (#incident-YYYYMMDD-description)

3. **Investigation**
   - Gather logs (Render, Vercel, Sentry)
   - Check recent deployments
   - Investigate system metrics

4. **Mitigation**
   - Apply temporary fixes if possible
   - Consider rollback to last known good version
   - Update status page

5. **Resolution**
   - Deploy permanent fix
   - Verify functionality
   - Update documentation

6. **Post-Mortem**
   - Document root cause
   - Identify preventative measures
   - Update runbooks and playbooks

### Communication Templates

#### Customer Communication

```
Subject: [SEVERITY] Asset Anchor Service Update

Dear Asset Anchor Customer,

We're currently experiencing [brief description of issue] affecting [specific functionality]. 
Our engineering team has been alerted and is actively working to resolve this issue.

Current Status: [Investigating/Identified/Mitigating/Resolved]

Estimated Resolution Time: [time or "under investigation"]

We'll provide an update [timeframe based on severity].

We apologize for any inconvenience this may cause.

The Asset Anchor Team
```

## Debugging and Troubleshooting

### Common Debugging Scenarios

#### High API Latency

1. **Identify slow endpoints**:
   ```sql
   -- Analyze slow API endpoints in Prometheus
   topk(10, avg(http_request_duration_seconds{job="asset-anchor-api"}) by (endpoint))
   ```

2. **Check database performance**:
   ```sql
   -- Find slow queries in PostgreSQL
   SELECT query, calls, total_time, mean_time, rows
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

#### High Error Rate

1. **Identify error sources**:
   ```sql
   -- Error rate by endpoint
   sum(rate(http_requests_total{status=~"5.."}[5m])) by (endpoint) 
   / 
   sum(rate(http_requests_total[5m])) by (endpoint) 
   ```

2. **Check error logs**:
   ```bash
   # Search error logs for specific timeframe
   grep -i "error" /var/log/asset-anchor/application.log | grep "2023-08-16T14"
   ```

## Implementation Checklist

1. **Set Up Monitoring Infrastructure**
   - [ ] Deploy Prometheus and Grafana
   - [ ] Configure Cloudwatch Logs
   - [ ] Set up Sentry projects for frontend and backend
   - [ ] Create Pingdom account and configure checks

2. **Instrument Application**
   - [ ] Add structured logging to backend
   - [ ] Implement frontend error tracking
   - [ ] Set up API metrics collection
   - [ ] Configure PII masking in logs

3. **Create Dashboards**
   - [ ] Operational health dashboard
   - [ ] API performance dashboard
   - [ ] Database performance dashboard
   - [ ] User experience dashboard
   - [ ] Business metrics dashboard

4. **Configure Alerts**
   - [ ] Set up PagerDuty/Opsgenie integration
   - [ ] Configure Slack notifications
   - [ ] Implement alert rules in Prometheus
   - [ ] Test alert notification flow

5. **Document Procedures**
   - [ ] Create incident response runbooks
   - [ ] Document common debugging procedures
   - [ ] Set up on-call rotation
   - [ ] Schedule regular observability reviews
