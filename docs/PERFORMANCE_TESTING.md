# Performance Testing and Monitoring Guide

This guide outlines the approaches, tools, and best practices for performance testing, monitoring, and optimization of the Asset Anchor application.

## Table of Contents

- [Performance Testing](#performance-testing)
  - [Load Testing](#load-testing)
  - [Stress Testing](#stress-testing)
  - [Endurance Testing](#endurance-testing)
  - [Spike Testing](#spike-testing)
  - [Tools](#performance-testing-tools)
  - [Test Scenarios](#test-scenarios)
- [Performance Monitoring](#performance-monitoring)
  - [Key Metrics](#key-metrics)
  - [Monitoring Stack](#monitoring-stack)
  - [Alerting](#alerting)
- [Performance Optimization](#performance-optimization)
  - [Backend Optimization](#backend-optimization)
  - [Database Optimization](#database-optimization)
  - [Frontend Optimization](#frontend-optimization)
  - [Infrastructure Optimization](#infrastructure-optimization)
- [Performance Budgets](#performance-budgets)
- [Continuous Performance Testing](#continuous-performance-testing)
- [Performance Testing Environment](#performance-testing-environment)

## Performance Testing

### Load Testing

Load testing evaluates system behavior under expected load conditions to ensure the application can handle the anticipated traffic without performance degradation.

#### Methodology

1. **Identify Key Scenarios**: Determine the critical user journeys to test.
2. **Define Target Metrics**: Set performance objectives for each scenario.
3. **Create Virtual Users**: Simulate concurrent users performing realistic actions.
4. **Execute Tests**: Run load tests with gradually increasing user counts.
5. **Analyze Results**: Evaluate response times, throughput, and error rates.

#### Example K6 Load Test

```javascript
// k6/load_test.js
import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metric for tracking failure rate
const failRate = new Rate('failed_requests');

export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Ramp-up to 50 users
    { duration: '3m', target: 50 },    // Stay at 50 users for 3 minutes
    { duration: '1m', target: 100 },   // Ramp-up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users for 5 minutes
    { duration: '1m', target: 0 },     // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p95<500'], // 95% of requests must complete below 500ms
    'failed_requests': ['rate<0.01'],  // Less than 1% of requests should fail
  },
};

export default function() {
  // Login request
  const loginRes = http.post('https://api.assetanchor.io/v1/auth/login', JSON.stringify({
    email: 'loadtest@example.com',
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  // Check if login was successful
  const checkLogin = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'login has token': (r) => JSON.parse(r.body).data.access_token !== undefined,
  });
  
  failRate.add(!checkLogin);
  
  // Extract token from response
  const token = checkLogin ? JSON.parse(loginRes.body).data.access_token : '';
  
  // Fetch properties
  const propertiesRes = http.get('https://api.assetanchor.io/v1/properties', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  check(propertiesRes, {
    'properties retrieved': (r) => r.status === 200,
    'properties count correct': (r) => JSON.parse(r.body).data.length > 0,
  });
  
  // Simulate user think-time
  sleep(3);
  
  // Fetch tenants
  const tenantsRes = http.get('https://api.assetanchor.io/v1/tenants', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  check(tenantsRes, {
    'tenants retrieved': (r) => r.status === 200,
  });
  
  sleep(2);
}
```

To run this test:

```bash
k6 run --out json=results.json k6/load_test.js
```

### Stress Testing

Stress testing determines the upper limits of system capacity and identifies breaking points by gradually increasing the load beyond expected maximums.

#### Methodology

1. **Incremental Load Increase**: Continuously increase load until the system fails.
2. **Identify Breaking Points**: Determine where performance degrades unacceptably.
3. **Assess Recovery**: Evaluate how the system recovers after overload.

#### Example K6 Stress Test

```javascript
// k6/stress_test.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },    // Ramp-up to 100 users
    { duration: '5m', target: 100 },    // Stay at 100 users
    { duration: '2m', target: 200 },    // Ramp-up to 200 users
    { duration: '5m', target: 200 },    // Stay at 200 users
    { duration: '2m', target: 300 },    // Ramp-up to 300 users
    { duration: '5m', target: 300 },    // Stay at 300 users
    { duration: '2m', target: 400 },    // Ramp-up to 400 users
    { duration: '5m', target: 400 },    // Stay at 400 users
    { duration: '2m', target: 0 },      // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p95<2000'], // 95% of requests must complete below 2s
  },
};

export default function() {
  // Similar to load test, but with more intensive operations
  // ...
}
```

### Endurance Testing

Endurance testing (also known as soak testing) evaluates system performance over an extended period to identify issues that may not appear in shorter tests.

#### Methodology

1. **Extended Duration**: Run tests for several hours or days.
2. **Consistent Load**: Apply a steady load representing typical usage.
3. **Monitor Resources**: Track memory usage, connections, and other resources over time.

#### Example K6 Endurance Test

```javascript
// k6/endurance_test.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '10m', target: 100 },    // Ramp-up to 100 users
    { duration: '8h', target: 100 },     // Stay at 100 users for 8 hours
    { duration: '10m', target: 0 },      // Ramp-down to 0 users
  ],
};

export default function() {
  // Similar to load test, with realistic user flows
  // ...
}
```

### Spike Testing

Spike testing evaluates system response to sudden, dramatic increases in load to ensure stability during traffic spikes.

#### Methodology

1. **Rapid Increase**: Suddenly increase load to a high level.
2. **Short Duration**: Maintain peak load for a brief period.
3. **Evaluate Recovery**: Assess how quickly the system normalizes after the spike.

#### Example K6 Spike Test

```javascript
// k6/spike_test.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Normal load
    { duration: '1m', target: 500 },   // Spike to 500 users
    { duration: '3m', target: 500 },   // Stay at 500 users for 3 minutes
    { duration: '1m', target: 50 },    // Back to normal load
    { duration: '2m', target: 50 },    // Stay at normal load
  ],
};

export default function() {
  // Similar to load test, focusing on critical paths
  // ...
}
```

### Performance Testing Tools

#### Primary Tool: K6

[k6](https://k6.io/) is our primary load testing tool due to its JavaScript-based scripting, cloud execution capabilities, and rich metrics.

```bash
# Install k6
brew install k6

# Run a local test
k6 run tests/performance/script.js

# Run with cloud execution
k6 cloud tests/performance/script.js
```

#### Additional Tools

1. **JMeter**: For complex testing scenarios and protocol-specific testing.
2. **Lighthouse**: For frontend performance testing.
3. **WebPageTest**: For detailed frontend analysis.
4. **Artillery**: For rapid API testing.

### Test Scenarios

#### Critical Path Scenarios

1. **User Authentication**
   - Login/logout flow
   - Token refresh operations
   - Password reset

2. **Property Management**
   - Property listing (with filtering and sorting)
   - Property detail view
   - Property creation and update

3. **Tenant Operations**
   - Tenant search and filtering
   - Tenant profile viewing
   - Background check process

4. **Financial Transactions**
   - Rent payment processing
   - Transaction history retrieval
   - Financial reporting

5. **Document Management**
   - Document upload
   - Document download
   - Document search

#### Scenario Implementation

Each scenario should include:

1. **Setup**: Data preparation and authentication
2. **Execution**: The core test actions
3. **Validation**: Checks to ensure functionality works correctly
4. **Cleanup**: Removal of test data when needed

## Performance Monitoring

### Key Metrics

#### Backend Metrics

1. **Request Metrics**
   - Request rate (requests per second)
   - Response time (p50, p95, p99)
   - Error rate
   - Request throughput

2. **Resource Metrics**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network I/O

3. **Database Metrics**
   - Query throughput
   - Query execution time
   - Connection pool usage
   - Index usage statistics
   - Slow query count

4. **Service Metrics**
   - Service uptime
   - Health check status
   - External API call performance
   - Cache hit ratio

#### Frontend Metrics

1. **Load Performance**
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)
   - Total Blocking Time (TBT)
   - Cumulative Layout Shift (CLS)

2. **Runtime Performance**
   - JavaScript execution time
   - Long tasks (>50ms)
   - Memory usage
   - Frame rate (for animations)

3. **Network Performance**
   - API call timing
   - Resource load time
   - Bandwidth usage
   - Connection info

4. **User Experience Metrics**
   - Rage clicks
   - Input delay
   - Navigation timing
   - Error rate

### Monitoring Stack

#### Core Monitoring Components

1. **Prometheus**
   - Metrics collection and storage
   - Query language for data analysis
   - Alerting rules

2. **Grafana**
   - Dashboards for visualization
   - Alert management
   - Annotation of events

3. **Elasticsearch, Logstash, Kibana (ELK Stack)**
   - Centralized logging
   - Log search and analysis
   - Log-based alerts

4. **New Relic or Datadog**
   - Application Performance Monitoring (APM)
   - Distributed tracing
   - Real user monitoring

#### Infrastructure Monitoring

1. **AWS CloudWatch** (for AWS resources)
   - EC2 instance monitoring
   - RDS database monitoring
   - S3 monitoring
   - Lambda function performance

2. **Node Exporter**
   - Host-level metrics
   - Hardware resource usage
   - System-level statistics

#### Custom Application Instrumentation

1. **Backend Instrumentation**
   ```python
   # Example Flask instrumentation with Prometheus
   from flask import Flask, request
   from prometheus_client import Counter, Histogram, generate_latest
   import time

   app = Flask(__name__)
   
   # Define metrics
   REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP Requests', ['method', 'endpoint', 'status'])
   REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP Request Latency', ['method', 'endpoint'])
   
   @app.before_request
   def before_request():
       request.start_time = time.time()
   
   @app.after_request
   def after_request(response):
       request_latency = time.time() - request.start_time
       REQUEST_COUNT.labels(request.method, request.path, response.status_code).inc()
       REQUEST_LATENCY.labels(request.method, request.path).observe(request_latency)
       return response
   
   @app.route('/metrics')
   def metrics():
       return generate_latest()
   ```

2. **Frontend Instrumentation**
   ```javascript
   // Example frontend monitoring with web-vitals
   import {getLCP, getFID, getCLS} from 'web-vitals';
   
   function sendToAnalytics({name, delta, value, id}) {
     fetch('https://analytics.assetanchor.io/metrics', {
       method: 'POST',
       body: JSON.stringify({name, delta, value, id}),
       headers: {'Content-Type': 'application/json'}
     });
   }
   
   getCLS(sendToAnalytics);
   getFID(sendToAnalytics);
   getLCP(sendToAnalytics);
   ```

### Alerting

#### Alert Types

1. **Threshold-Based Alerts**
   - Response time > 500ms for 5 minutes
   - Error rate > 1% for 2 minutes
   - CPU usage > 80% for 10 minutes
   - Memory usage > 90% for 5 minutes

2. **Anomaly-Based Alerts**
   - Unusual traffic patterns
   - Abnormal error spikes
   - Unexpected resource consumption

3. **SLO-Based Alerts**
   - Error budget consumption rate
   - Availability below targets
   - Latency budget depletion

#### Alert Severity Levels

1. **P1 (Critical)**
   - Service outage
   - Data loss risk
   - Security breach
   - Response: Immediate action required (24/7)

2. **P2 (High)**
   - Significant performance degradation
   - Feature unavailability
   - Response: Action required within 1 hour

3. **P3 (Medium)**
   - Minor functionality issues
   - Performance outside SLO but not critical
   - Response: Action required within 4 hours

4. **P4 (Low)**
   - Non-critical warnings
   - Approaching thresholds
   - Response: Next business day

#### Alert Configuration

```yaml
# Example Prometheus alerting rules
groups:
- name: asset_anchor_alerts
  rules:
  - alert: HighApiLatency
    expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="api"}[5m])) by (le, endpoint)) > 0.5
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High API latency"
      description: "95th percentile of API latency for {{ $labels.endpoint }} is above 500ms ({{ $value }}s)"

  - alert: HighErrorRate
    expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100 > 1
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High error rate"
      description: "Error rate is above 1% ({{ $value }}%)"

  - alert: DatabaseConnectionPoolSaturation
    expr: sum(pg_stat_activity_count{datname="asset_anchor"}) / sum(pg_settings_max_connections{datname="asset_anchor"}) * 100 > 80
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Database connection pool near saturation"
      description: "Connection pool usage is at {{ $value }}% of maximum capacity"
```

#### Alert Channels

1. **PagerDuty**: For critical and high-severity alerts
2. **Slack**: For team notifications and medium-severity alerts
3. **Email**: For low-severity alerts and daily summaries
4. **SMS**: Backup channel for critical alerts

## Performance Optimization

### Backend Optimization

#### Code Optimization

1. **Asynchronous Processing**
   - Move long-running tasks to background jobs
   - Use task queues (Celery, RQ) for processing
   
   ```python
   # Before
   def process_report(data):
       # Long-running process
       result = compute_intensive_operation(data)
       send_email(result)
       return result
   
   # After
   def process_report(data):
       task_id = process_report_task.delay(data)
       return {"task_id": task_id}
   
   @celery.task
   def process_report_task(data):
       result = compute_intensive_operation(data)
       send_email(result)
       return result
   ```

2. **Caching Strategy**
   - Implement Redis cache for frequently accessed data
   - Use cache invalidation patterns
   
   ```python
   @app.route('/api/properties')
   def get_properties():
       cache_key = f"properties:{request.args.get('filter', '')}"
       cached = redis_client.get(cache_key)
       
       if cached:
           return json.loads(cached)
       
       properties = Property.query.filter(/* filters */).all()
       result = property_schema.dump(properties, many=True)
       
       # Cache for 5 minutes
       redis_client.setex(cache_key, 300, json.dumps(result))
       return result
   ```

3. **Optimize Database Queries**
   - Eager loading to avoid N+1 queries
   - Select only needed columns
   
   ```python
   # Before - N+1 problem
   properties = Property.query.all()
   for property in properties:
       print(f"{property.name} owned by {property.owner.name}")
   
   # After - Eager loading
   properties = Property.query.options(
       joinedload(Property.owner)
   ).all()
   for property in properties:
       print(f"{property.name} owned by {property.owner.name}")
   ```

4. **API Response Optimization**
   - Pagination for large result sets
   - Partial response (fields parameter)
   - Compression for large payloads
   
   ```python
   @app.route('/api/properties')
   def get_properties():
       page = int(request.args.get('page', 1))
       per_page = int(request.args.get('per_page', 20))
       fields = request.args.get('fields', '').split(',')
       
       query = Property.query
       
       # Pagination
       paginated = query.paginate(page=page, per_page=per_page)
       
       # Field selection
       if fields and fields[0]:
           result = [{field: getattr(item, field) for field in fields if hasattr(item, field)} 
                    for item in paginated.items]
       else:
           result = property_schema.dump(paginated.items, many=True)
           
       return {
           "data": result,
           "meta": {
               "page": page,
               "per_page": per_page,
               "total": paginated.total,
               "pages": paginated.pages
           }
       }
   ```

### Database Optimization

1. **Indexing Strategy**
   - Create indexes for commonly queried fields
   - Use composite indexes for multi-column filters
   - Monitor and maintain indexes
   
   ```sql
   -- Create index for common property queries
   CREATE INDEX idx_properties_status_city ON properties(status, city);
   
   -- Create index for transaction date range queries
   CREATE INDEX idx_transactions_date ON transactions USING BRIN (created_at);
   ```

2. **Query Optimization**
   - Use EXPLAIN ANALYZE to identify slow queries
   - Optimize JOIN operations
   - Avoid SELECT *
   
   ```sql
   -- Before
   SELECT * FROM properties 
   JOIN users ON properties.owner_id = users.id
   WHERE properties.status = 'active';
   
   -- After
   SELECT p.id, p.name, p.address, u.first_name, u.last_name 
   FROM properties p
   JOIN users u ON p.owner_id = u.id
   WHERE p.status = 'active';
   ```

3. **Connection Pooling**
   - Configure proper pool size
   - Monitor connection usage
   
   ```python
   # SQLAlchemy connection pool configuration
   engine = create_engine('postgresql://user:pass@localhost/dbname',
                         pool_size=10,
                         max_overflow=20,
                         pool_timeout=30,
                         pool_recycle=1800)
   ```

4. **Data Partitioning**
   - Partition large tables by date
   - Consider table sharding for multi-tenant scenarios
   
   ```sql
   -- Create partitioned table for transactions
   CREATE TABLE transactions (
       id UUID PRIMARY KEY,
       amount DECIMAL(10,2),
       created_at TIMESTAMP
   ) PARTITION BY RANGE (created_at);
   
   -- Create monthly partitions
   CREATE TABLE transactions_y2023m01 PARTITION OF transactions
       FOR VALUES FROM ('2023-01-01') TO ('2023-02-01');
   
   CREATE TABLE transactions_y2023m02 PARTITION OF transactions
       FOR VALUES FROM ('2023-02-01') TO ('2023-03-01');
   ```

### Frontend Optimization

1. **Bundle Optimization**
   - Code splitting
   - Tree shaking
   - Dynamic imports
   
   ```javascript
   // Before
   import { huge } from 'huge-library';
   
   // After
   const HugeComponent = React.lazy(() => import('./HugeComponent'));
   
   function MyComponent() {
     return (
       <React.Suspense fallback={<div>Loading...</div>}>
         <HugeComponent />
       </React.Suspense>
     );
   }
   ```

2. **Resource Loading**
   - Lazy loading images
   - Preloading critical resources
   - Proper caching headers
   
   ```html
   <!-- Lazy load images -->
   <img loading="lazy" src="image.jpg" alt="Description">
   
   <!-- Preload critical resources -->
   <link rel="preload" href="critical.css" as="style">
   <link rel="preload" href="critical.js" as="script">
   ```

3. **Rendering Optimization**
   - Virtual scrolling for long lists
   - Memoization for expensive calculations
   - Debouncing user inputs
   
   ```javascript
   // Virtual scrolling with react-window
   import { FixedSizeList } from 'react-window';
   
   function PropertyList({ properties }) {
     const Row = ({ index, style }) => (
       <div style={style}>
         <PropertyItem property={properties[index]} />
       </div>
     );
   
     return (
       <FixedSizeList
         height={500}
         width={400}
         itemCount={properties.length}
         itemSize={100}
       >
         {Row}
       </FixedSizeList>
     );
   }
   ```

4. **Network Optimization**
   - GraphQL for reduced payload size
   - HTTP/2 for multiplexing
   - Service worker for offline capabilities
   
   ```javascript
   // Service worker registration
   if ('serviceWorker' in navigator) {
     window.addEventListener('load', () => {
       navigator.serviceWorker.register('/sw.js')
         .then(registration => {
           console.log('SW registered: ', registration);
         })
         .catch(error => {
           console.log('SW registration failed: ', error);
         });
     });
   }
   ```

### Infrastructure Optimization

1. **CDN Configuration**
   - Distribute static assets via CDN
   - Configure proper cache headers
   - Use CDN for API caching
   
   ```nginx
   # Nginx configuration for CDN headers
   location /static/ {
       expires 30d;
       add_header Cache-Control "public, max-age=2592000";
       add_header X-Content-Type-Options nosniff;
   }
   ```

2. **Auto-scaling**
   - Configure appropriate scaling metrics
   - Set proper min/max instance counts
   - Implement predictive scaling for known traffic patterns
   
   ```terraform
   # AWS Auto Scaling Group
   resource "aws_autoscaling_group" "api_asg" {
     name                 = "asset-anchor-api-asg"
     min_size             = 2
     max_size             = 10
     desired_capacity     = 2
     health_check_type    = "ELB"
     vpc_zone_identifier  = [aws_subnet.private_a.id, aws_subnet.private_b.id]
     
     target_tracking_configuration {
       predefined_metric_specification {
         predefined_metric_type = "ASGAverageCPUUtilization"
       }
       target_value = 70.0
     }
   }
   ```

3. **Load Balancing**
   - Configure proper health checks
   - Enable connection draining
   - Use WAF for filtering malicious traffic
   
   ```terraform
   # AWS Application Load Balancer
   resource "aws_lb" "api_alb" {
     name               = "asset-anchor-alb"
     internal           = false
     load_balancer_type = "application"
     security_groups    = [aws_security_group.alb_sg.id]
     subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]
     
     enable_deletion_protection = true
     idle_timeout               = 60
     
     access_logs {
       bucket  = aws_s3_bucket.lb_logs.bucket
       prefix  = "alb-logs"
       enabled = true
     }
   }
   ```

4. **Caching Layer**
   - Redis for application caching
   - CloudFront for CDN caching
   - Database query cache
   
   ```terraform
   # AWS ElastiCache Redis
   resource "aws_elasticache_cluster" "redis" {
     cluster_id           = "asset-anchor-redis"
     engine               = "redis"
     node_type            = "cache.t3.medium"
     num_cache_nodes      = 1
     parameter_group_name = "default.redis5.0"
     engine_version       = "5.0.6"
     port                 = 6379
     security_group_ids   = [aws_security_group.redis_sg.id]
     subnet_group_name    = aws_elasticache_subnet_group.redis.name
   }
   ```

## Performance Budgets

### API Response Time Budgets

| Endpoint Type | p50 | p95 | p99 |
|---------------|-----|-----|-----|
| Critical Path | 200ms | 500ms | 1s |
| Read Operations | 300ms | 700ms | 1.2s |
| Write Operations | 500ms | 1s | 1.5s |
| Reporting | 1s | 3s | 5s |

### Frontend Performance Budgets

| Metric | Target | Max Allowed |
|--------|--------|------------|
| First Contentful Paint | < 1.8s | < 2.5s |
| Largest Contentful Paint | < 2.5s | < 4s |
| Time to Interactive | < 3.5s | < 5s |
| Total Blocking Time | < 300ms | < 600ms |
| Cumulative Layout Shift | < 0.1 | < 0.25 |
| JS Bundle Size | < 250KB | < 350KB |
| CSS Size | < 50KB | < 100KB |
| Image Size | < 700KB | < 1MB |
| Total Page Weight | < 1.5MB | < 2.5MB |

### Infrastructure Budgets

| Resource | Target | Max Allowed |
|----------|--------|------------|
| CPU Utilization | < 70% | < 85% |
| Memory Usage | < 75% | < 90% |
| Database Connections | < 70% of pool | < 90% of pool |
| Database Query Time | < 100ms | < 250ms |
| Cache Hit Rate | > 80% | > 70% |

## Continuous Performance Testing

### CI/CD Integration

1. **Automated Performance Tests**
   - Run lightweight performance tests on every PR
   - Run comprehensive tests nightly
   - Run full performance suite weekly

2. **Performance Regression Detection**
   - Compare results against baseline
   - Fail build if performance degrades beyond threshold

#### Example GitHub Actions Workflow

```yaml
name: Performance Testing

on:
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight

jobs:
  k6_smoke_test:
    name: K6 Smoke Test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Run k6 smoke test
      uses: grafana/k6-action@v0.2.0
      with:
        filename: ./tests/performance/smoke_test.js

    - name: Upload test results
      uses: actions/upload-artifact@v2
      with:
        name: k6-smoke-results
        path: summary.json
  
  lighthouse:
    name: Lighthouse Test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Run Lighthouse
      uses: treosh/lighthouse-ci-action@v8
      with:
        urls: |
          https://staging.assetanchor.io/
          https://staging.assetanchor.io/login
          https://staging.assetanchor.io/properties
        budgetPath: ./lighthouse-budget.json
        uploadArtifacts: true
```

### Performance Dashboards

1. **Real-time Performance Dashboard**
   - Current performance metrics
   - Alerts and warning indicators
   - Historical comparison

2. **Trend Analysis Dashboard**
   - Performance trends over time
   - Regression identification
   - Correlation with deployments

#### Example Grafana Dashboard Structure

1. **Overview Panel**
   - System health indicators
   - Current user count
   - Error rate
   - Response time averages

2. **API Performance Panel**
   - Endpoint response times
   - Request volume
   - Error rates by endpoint
   - Cache hit ratios

3. **Database Panel**
   - Query execution times
   - Connection pool utilization
   - Slow query count
   - Index usage statistics

4. **Frontend Panel**
   - Core Web Vitals
   - Page load times
   - JS execution metrics
   - Resource loading waterfall

## Performance Testing Environment

### Environment Configuration

1. **Isolated Testing Environment**
   - Dedicated resources
   - Similar to production architecture
   - Controllable conditions

2. **Test Data Generation**
   - Realistic data volume
   - Varied data patterns
   - Multiple tenant scenarios

#### Example Docker Compose for Local Performance Testing

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/testdb
      - REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT=performance
    depends_on:
      - db
      - redis

  db:
    image: postgres:13
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=testdb
    volumes:
      - ./perf/postgres-init:/docker-entrypoint-initdb.d
      - pg_data:/var/lib/postgresql/data

  redis:
    image: redis:6
    ports:
      - "6379:6379"

  k6:
    image: loadimpact/k6:latest
    volumes:
      - ./tests/performance:/tests
    command: run /tests/load_test.js
    environment:
      - K6_OUT=influxdb=http://influxdb:8086/k6
    depends_on:
      - app
      - influxdb

  influxdb:
    image: influxdb:1.8
    ports:
      - "8086:8086"
    environment:
      - INFLUXDB_DB=k6
      - INFLUXDB_HTTP_MAX_BODY_SIZE=0
    volumes:
      - influx_data:/var/lib/influxdb

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
    volumes:
      - ./perf/grafana-dashboards:/etc/grafana/provisioning/dashboards
      - ./perf/grafana-datasources:/etc/grafana/provisioning/datasources
    depends_on:
      - influxdb

volumes:
  pg_data:
  influx_data:
```

### Test Data Management

1. **Data Seeding**
   ```bash
   #!/bin/bash
   # Generate test data
   
   # Number of entities to create
   PROPERTIES=1000
   TENANTS=5000
   LEASES=3000
   TRANSACTIONS=20000
   
   echo "Generating test data..."
   
   # Generate properties
   python -m scripts.generate_test_data properties $PROPERTIES
   
   # Generate tenants
   python -m scripts.generate_test_data tenants $TENANTS
   
   # Generate leases
   python -m scripts.generate_test_data leases $LEASES
   
   # Generate transactions
   python -m scripts.generate_test_data transactions $TRANSACTIONS
   
   echo "Test data generation complete!"
   ```

2. **Data Reset**
   ```bash
   #!/bin/bash
   # Reset performance environment
   
   echo "Resetting performance environment..."
   
   # Clear database
   PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
   TRUNCATE transactions CASCADE;
   TRUNCATE maintenance_requests CASCADE;
   TRUNCATE documents CASCADE;
   TRUNCATE leases CASCADE;
   TRUNCATE tenants CASCADE;
   TRUNCATE properties CASCADE;
   "
   
   # Reset Redis cache
   redis-cli -h $REDIS_HOST FLUSHDB
   
   echo "Environment reset complete!"
   ```

### Performance Test Report Template

```markdown
# Performance Test Report - [DATE]

## Test Overview
- Test type: [Load/Stress/Endurance/Spike]
- Duration: [Duration]
- User load: [User count]
- Environment: [Test environment]

## Key Metrics Summary

### API Performance
- Average response time: [Time] ms
- 95th percentile response time: [Time] ms
- Requests per second: [Count]
- Error rate: [Percentage]%

### Database Performance
- Average query time: [Time] ms
- Max query time: [Time] ms
- Connection pool utilization: [Percentage]%

### Resource Utilization
- Average CPU: [Percentage]%
- Max CPU: [Percentage]%
- Average memory: [Percentage]%
- Max memory: [Percentage]%

## Test Results by Endpoint

| Endpoint | Avg. Response Time | p95 | p99 | Error Rate |
|----------|-------------------|-----|-----|------------|
| /auth/login | [Time] ms | [Time] ms | [Time] ms | [Rate]% |
| /properties | [Time] ms | [Time] ms | [Time] ms | [Rate]% |
| /tenants | [Time] ms | [Time] ms | [Time] ms | [Rate]% |
| ... | ... | ... | ... | ... |

## Issues and Bottlenecks
- [Description of identified bottlenecks]
- [Performance issues discovered]
- [System limitations reached]

## Optimization Recommendations
- [Specific recommendation 1]
- [Specific recommendation 2]
- [Specific recommendation 3]

## Comparison to Previous Test
- Response time change: [Percentage]% [better/worse]
- Throughput change: [Percentage]% [higher/lower]
- Error rate change: [Percentage]% [higher/lower]

## Attachments
- [Link to full test results]
- [Link to test configuration]
- [Link to monitoring dashboards]
```
