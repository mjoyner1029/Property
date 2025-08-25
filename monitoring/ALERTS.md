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
| Prometheus | Metrics collection | Backend + Infrastructure |
| Alertmanager | Alert routing | Prometheus |
| Loki | Log aggregation | Backend + Frontend |
| Tempo | Distributed tracing | All services |
| Grafana | Visualization | All monitoring data |
| Sentry | Error tracking | Backend + Frontend |

## Alert Configuration

### Prometheus Alerts

1. **HighErrorRate**
   - **Severity**: warning
   - **Description**: Service is experiencing an elevated error rate
   - **Query**: `sum(rate(http_requests_total{job="app-server",code=~"5.."}[5m])) / sum(rate(http_requests_total{job="app-server"}[5m])) > 0.05`
   - **Duration**: 5m
   - **Runbook**: [High Error Rate Runbook](#high-error-rate)

2. **APIHighLatency**
   - **Severity**: warning
   - **Description**: API endpoint latency is above threshold
   - **Query**: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="app-server"}[5m])) by (le)) > 0.3`
   - **Duration**: 10m
   - **Runbook**: [API Latency Runbook](#api-latency)

3. **ServiceDown**
   - **Severity**: critical
   - **Description**: Service is not responding to requests
   - **Query**: `up{job=~"app-server|db|cache"} == 0`
   - **Duration**: 1m
   - **Runbook**: [Service Down Runbook](#service-down)

4. **ErrorBudgetBurn**
   - **Severity**: critical
   - **Description**: Error budget is being consumed too quickly
   - **Query**: `availability_slo:error_budget_burn_rate1h > 14.4`
   - **Duration**: 5m
   - **Runbook**: [Error Budget Burn Runbook](#error-budget-burn)

5. **DatabaseConnectionsHigh**
   - **Severity**: warning
   - **Description**: Database connection count near limit
   - **Query**: `sum(pg_stat_activity_count{datname="property_db"}) > (pg_settings_max_connections{} * 0.8)`
   - **Duration**: 10m
   - **Runbook**: [Database Connections Runbook](#database-connections)

6. **HighCPUUsage**
   - **Severity**: warning
   - **Description**: System CPU usage is high
   - **Query**: `100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80`
   - **Duration**: 15m
   - **Runbook**: [High CPU Usage Runbook](#high-cpu-usage)

7. **LowDiskSpace**
   - **Severity**: warning
   - **Description**: Low disk space remaining
   - **Query**: `(node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 15`
   - **Duration**: 10m
   - **Runbook**: [Low Disk Space Runbook](#low-disk-space)

### Loki Alerts

1. **HighErrorRate**
   - **Severity**: warning
   - **Description**: High error rate in application logs
   - **Query**: `sum(rate({app="frontend"} |= "error" [5m])) by (job) > 0.1`
   - **Duration**: 10m
   - **Runbook**: [Log Error Rate Runbook](#log-error-rate)

2. **AuthenticationFailures**
   - **Severity**: warning
   - **Description**: Multiple authentication failures detected
   - **Query**: `sum(rate({app=~"frontend|backend"} |~ "(?i)(failed login|authentication failed)" [5m])) by (app) > 5`
   - **Duration**: 15m
   - **Runbook**: [Authentication Failures Runbook](#authentication-failures)

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

## Runbooks

### High Error Rate {#high-error-rate}

**Alert**: HighErrorRate

**Description**: Service is experiencing an elevated error rate (>5%).

**Diagnosis Steps**:
1. Check application logs for error patterns: `kubectl logs -l app=backend -c app --tail=100`
2. Check recent deployments: `kubectl get deployments -w`
3. Verify downstream dependencies: `curl -v https://api.example.com/health`
4. Look for correlating metrics (CPU, memory, network)

**Resolution Steps**:
1. If tied to a recent deployment, consider rolling back: `kubectl rollout undo deployment/backend`
2. If due to traffic spike, consider scaling: `kubectl scale deployment/backend --replicas=5`
3. If downstream dependency issue, implement circuit breaking or retry logic
4. If persistent, create incident and escalate to development team

### API Latency {#api-latency}

**Alert**: APIHighLatency

**Description**: API endpoint response times exceeding 300ms at P95.

**Diagnosis Steps**:
1. Check database performance metrics in Grafana
2. Identify slowest endpoints: `grep -i "processing time" /var/log/app/backend.log | sort -k5 -n | tail -10`
3. Check for increased load: `kubectl top pods`
4. Review recent code changes that might impact performance

**Resolution Steps**:
1. Scale horizontally if load-related: `kubectl scale deployment/backend --replicas=5`
2. Check and optimize slow database queries
3. Implement caching for frequently accessed endpoints
4. Consider implementing rate limiting if specific clients are causing issues

### Service Down {#service-down}

**Alert**: ServiceDown

**Description**: Service is not responding to requests.

**Diagnosis Steps**:
1. Verify service status: `kubectl get pods -l app=backend`
2. Check for pod crash loops: `kubectl describe pod backend-xyz`
3. Check recent deployments: `kubectl rollout history deployment/backend`
4. Review logs: `kubectl logs -l app=backend --previous`

**Resolution Steps**:
1. If deployment related, rollback: `kubectl rollout undo deployment/backend`
2. If resource constraints, scale resources: `kubectl edit deployment/backend` (adjust CPU/memory)
3. If crash looping, check for configuration issues or missing dependencies
4. If persistent, restart the service: `kubectl rollout restart deployment/backend`

### Error Budget Burn {#error-budget-burn}

**Alert**: ErrorBudgetBurn

**Description**: Error budget is being consumed too quickly.

**Diagnosis Steps**:
1. Identify which SLO is being affected (availability, latency)
2. Check monitoring dashboards for correlation with events
3. Review recent deployments or infrastructure changes
4. Check for external dependency issues

**Resolution Steps**:
1. Halt non-critical deployments
2. Revert recent changes that correlate with burn rate increase
3. Scale resources if load-related
4. Convene incident response team if burn rate continues
5. Document findings for SRE review

### Database Connections {#database-connections}

**Alert**: DatabaseConnectionsHigh

**Description**: Database connection count is approaching the configured limit.

**Diagnosis Steps**:
1. Identify which services are using connections: `SELECT client_addr, count(*) FROM pg_stat_activity GROUP BY client_addr;`
2. Check for connection leaks: `SELECT pid, state, query_start, query FROM pg_stat_activity WHERE state != 'idle';`
3. Verify connection pooling configuration

**Resolution Steps**:
1. Restart services with suspected connection leaks
2. Adjust connection pool settings if needed
3. Consider increasing max connections if consistently hitting limits
4. Implement connection timeout policies
5. Add database replicas if read traffic is high

### High CPU Usage {#high-cpu-usage}

**Alert**: HighCPUUsage

**Description**: System CPU usage exceeding 80% for over 15 minutes.

**Diagnosis Steps**:
1. Identify resource-intensive processes: `top` or `ps aux --sort=-%cpu | head -10`
2. Check for abnormal traffic patterns or DDoS
3. Review application profiling data if available
4. Check for runaway processes or memory leaks

**Resolution Steps**:
1. Scale horizontally if load is legitimate: `kubectl scale deployment/backend --replicas=5`
2. Terminate runaway processes if identified
3. Implement rate limiting if traffic-related
4. Consider vertical scaling if consistently resource-constrained
5. Review code for optimization opportunities

### Low Disk Space {#low-disk-space}

**Alert**: LowDiskSpace

**Description**: Filesystem has less than 15% available disk space.

**Diagnosis Steps**:
1. Identify large files/directories: `du -sh /* | sort -hr`
2. Check for log file growth: `find /var/log -type f -name "*.log" -size +100M`
3. Check for old Docker images: `docker images`
4. Verify disk usage by container: `docker ps -s`

**Resolution Steps**:
1. Rotate and compress logs: `logrotate -f /etc/logrotate.conf`
2. Remove old and unused Docker images: `docker system prune`
3. Delete temporary files: `find /tmp -type f -atime +7 -delete`
4. Increase disk capacity if needed
5. Implement log retention policies

### Log Error Rate {#log-error-rate}

**Alert**: HighErrorRate (Loki)

**Description**: High rate of errors detected in application logs.

**Diagnosis Steps**:
1. Review error patterns: `kubectl logs -l app=frontend --tail=100 | grep -i error`
2. Check for correlating events in other services
3. Identify if errors are frontend or backend related
4. Check recent deployments that might have introduced issues

**Resolution Steps**:
1. Fix client-side validation if frontend errors
2. Address backend issues based on error messages
3. Rollback recent deployments if correlated
4. Add appropriate error handling and recovery mechanisms
5. Document patterns for future prevention

### Authentication Failures {#authentication-failures}

**Alert**: AuthenticationFailures

**Description**: Multiple authentication failures detected.

**Diagnosis Steps**:
1. Check for patterns in failed login attempts (same user, IP)
2. Review auth service logs: `kubectl logs -l app=auth-service --tail=100`
3. Verify identity provider connectivity
4. Check for recent auth configuration changes

**Resolution Steps**:
1. Block suspicious IPs if brute force attack detected
2. Reset affected user accounts if compromised
3. Fix authentication service issues if identified
4. Restore known good auth configuration if recently changed
5. Implement rate limiting for authentication attempts if not already present
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
