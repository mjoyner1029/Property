# Operator Runbook

This runbook provides step-by-step procedures for common operational tasks and troubleshooting scenarios for the Property application.

## System Overview

The Property application consists of:
- **Frontend**: React application
- **Backend**: Flask API server
- **Database**: PostgreSQL
- **Redis**: For rate limiting and caching
- **Stripe**: Payment processing
- **Sentry**: Error tracking

## Common Operations

### Starting and Stopping Services

#### Local Development

```bash
# Start backend server
cd backend
source venv/bin/activate
export FLASK_ENV=development
export DATABASE_URL="sqlite:///instance/app.db"
python run.py

# Start frontend
cd frontend
npm install  # First time only
npm start
```

#### Production (Docker)

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Database Operations

#### Backup Database

```bash
# Local backup
pg_dump -h localhost -U postgres -d property > backup_$(date +%Y%m%d).sql

# Production backup
docker exec property-db pg_dump -U postgres -d property > backup_prod_$(date +%Y%m%d).sql
```

#### Restore Database

```bash
# Local restore
psql -h localhost -U postgres -d property < backup_file.sql

# Production restore
cat backup_file.sql | docker exec -i property-db psql -U postgres -d property
```

#### Run Migrations

```bash
# Local
cd backend
source venv/bin/activate
python migrate.py

# Production
docker exec property-backend python migrate.py
```

### Log Access

#### Backend Logs

```bash
# Local
tail -f backend/logs/app.log

# Production
docker-compose -f docker-compose.prod.yml logs -f backend

# Performance logs (slow queries)
tail -f backend/logs/slow_queries.log
```

#### Frontend Logs

```bash
# Production
docker-compose -f docker-compose.prod.yml logs -f frontend
```

#### Nginx Logs

```bash
# Access logs
docker exec property-nginx tail -f /var/log/nginx/access.log

# Error logs
docker exec property-nginx tail -f /var/log/nginx/error.log
```

## Troubleshooting

### API Server Issues

#### API Not Responding

1. Check server status:
   ```bash
   curl -I https://api.example.com/health
   ```

2. Check logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs --tail=100 backend
   ```

3. Verify database connection:
   ```bash
   docker exec property-backend python -c "from src.database import db; print(db.engine.connect())"
   ```

4. Restart service:
   ```bash
   docker-compose -f docker-compose.prod.yml restart backend
   ```

#### High API Latency

1. Check slow query logs:
   ```bash
   tail -f backend/logs/slow_queries.log
   ```

2. Check system resources:
   ```bash
   docker stats property-backend property-db
   ```

3. Enable performance logging:
   ```bash
   docker exec -e ENABLE_SLOW_QUERY_LOGGING=1 -e SLOW_QUERY_THRESHOLD=100 property-backend
   ```

### Database Issues

#### Connection Failures

1. Check database status:
   ```bash
   docker exec property-db pg_isready
   ```

2. Check connection count:
   ```bash
   docker exec property-db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
   ```

3. Restart database if needed:
   ```bash
   docker-compose -f docker-compose.prod.yml restart db
   ```

#### Performance Issues

1. List long-running queries:
   ```bash
   docker exec property-db psql -U postgres -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '30 seconds' ORDER BY duration DESC;"
   ```

2. Kill a specific query:
   ```bash
   docker exec property-db psql -U postgres -c "SELECT pg_terminate_backend(pid);" 
   ```

### Payment Processing Issues

#### Failed Webhook Deliveries

1. Check Stripe dashboard for events
2. Check webhook logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs --tail=100 backend | grep "webhook"
   ```
3. Verify webhook secret:
   ```bash
   curl -X POST https://api.example.com/api/webhooks/stripe/verify -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

#### Payment Failures

1. Check Stripe dashboard for payment intents
2. Verify API connectivity to Stripe:
   ```bash
   curl -I https://api.stripe.com
   ```
3. Check backend logs for Stripe-related errors

## Monitoring

### Health Checks

Manually verify system health:

```bash
# API health
curl https://api.example.com/health

# Frontend health
curl -I https://app.example.com

# Database health
docker exec property-backend python -c "from src.database import db; print(db.engine.connect())"

# Redis health
docker exec property-backend python -c "import redis; r = redis.Redis.from_url('$REDIS_URL'); print(r.ping())"
```

### Metrics and Dashboards

- **Sentry Dashboard**: https://sentry.io/organizations/property/
- **Stripe Dashboard**: https://dashboard.stripe.com/
- **Server Monitoring**: https://grafana.example.com/

## Disaster Recovery

### Complete System Restore

In case of catastrophic failure:

1. Provision new infrastructure (use Terraform/CloudFormation if applicable)
2. Restore latest database backup
3. Deploy latest application versions
4. Verify system functionality
5. Update DNS if IP addresses changed

### Database Recovery

1. Stop application services
2. Restore from latest backup
3. Run migrations if needed
4. Start application services
5. Verify data integrity

## Security Incidents

### Suspected Data Breach

1. Isolate affected systems
2. Rotate all API keys and secrets
3. Enable additional logging
4. Notify security team
5. Document incident timeline

### Rate Limit Attacks

1. Check IP addresses with high request rates:
   ```bash
   docker exec property-nginx grep -i "rate limiting" /var/log/nginx/error.log | sort | uniq -c | sort -nr
   ```
2. Block malicious IPs at firewall level
3. Adjust rate limits in configuration

## Routine Maintenance

### Certificate Renewal

```bash
# Generate new certificates
./scripts/generate-local-certs.sh

# Restart Nginx to apply
docker-compose -f docker-compose.prod.yml restart nginx
```

### System Updates

```bash
# Update images
docker-compose -f docker-compose.prod.yml pull

# Apply updates
docker-compose -f docker-compose.prod.yml up -d

# Verify system after update
curl https://api.example.com/health
```
