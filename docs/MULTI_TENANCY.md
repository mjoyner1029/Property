# Asset Anchor Multi-Tenancy Architecture

This document outlines the design, implementation, and security considerations for Asset Anchor's multi-tenant architecture.

## Multi-Tenancy Overview

### What is Multi-Tenancy?

Multi-tenancy is a software architecture where a single instance of the application serves multiple customers (tenants). Each tenant's data remains isolated from other tenants while sharing the same application infrastructure.

### Benefits of Multi-Tenancy

- **Cost Efficiency**: Lower infrastructure costs through resource sharing
- **Simplified Operations**: Single codebase and deployment process
- **Centralized Management**: Easier updates and maintenance
- **Rapid Provisioning**: Quick onboarding of new tenants
- **Resource Optimization**: Better resource utilization across tenants

## Multi-Tenancy Model

Asset Anchor employs a **hybrid multi-tenancy model** combining aspects of:

- **Database-level isolation**: Tenant-specific schemas within a shared database
- **Application-level isolation**: Tenant context enforcement in code
- **Resource-level isolation**: Separate S3 buckets/folders for tenant data
- **Optional Dedicated Resources**: For enterprise clients with specific requirements

### Tenant Identification

Each tenant is uniquely identified by:

1. **Tenant ID**: UUID stored in the `tenants` table
2. **Subdomain**: `{tenant-slug}.assetanchor.com`
3. **Custom Domain**: Optional tenant-specific domain

## Data Isolation Implementation

### Database Isolation

Asset Anchor uses PostgreSQL schemas for tenant isolation:

```sql
-- Create schema for new tenant
CREATE SCHEMA tenant_{id};

-- Create tenant-specific tables
CREATE TABLE tenant_{id}.properties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    -- other columns
);

-- Set default permissions
REVOKE ALL ON SCHEMA tenant_{id} FROM PUBLIC;
GRANT USAGE ON SCHEMA tenant_{id} TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA tenant_{id} TO app_user;
```

#### Schema Creation

When onboarding a new tenant:

```python
def create_tenant_schema(tenant_id):
    """Create database schema for a new tenant."""
    schema_name = f"tenant_{tenant_id}"
    
    # Create schema
    db.session.execute(text(f'CREATE SCHEMA IF NOT EXISTS {schema_name}'))
    
    # Apply migrations to new schema
    with app.app_context():
        command.upgrade(revision='head', sql=False, schema=schema_name)
        
    # Set permissions
    db.session.execute(text(f'REVOKE ALL ON SCHEMA {schema_name} FROM PUBLIC'))
    db.session.execute(text(f'GRANT USAGE ON SCHEMA {schema_name} TO app_user'))
    db.session.execute(text(f'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA {schema_name} TO app_user'))
    db.session.commit()
```

### Shared Tables

Some tables remain in the public schema for cross-tenant functionality:

- `tenants`: Tenant registration and configuration
- `users`: User authentication (linked to tenant-specific profiles)
- `audit_logs`: Security and activity logging
- `plans`: Subscription plans and features

```sql
-- Example of tenant reference in shared tables
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tenant_id UUID REFERENCES public.tenants(id),
    -- other columns
);
```

### Tenant Context

The application maintains tenant context throughout the request lifecycle:

```python
class TenantMiddleware:
    """Middleware to establish tenant context for each request."""
    
    def __init__(self, app):
        self.app = app
        
    def __call__(self, environ, start_response):
        request = Request(environ)
        tenant = self._identify_tenant(request)
        
        if tenant:
            # Set tenant in flask g
            g.tenant = tenant
            
            # Set PostgreSQL search path for tenant isolation
            db.session.execute(text(f'SET search_path TO tenant_{tenant.id}, public'))
            
            # Set up tenant-specific S3 path
            g.s3_prefix = f"tenant_{tenant.id}/"
        
        return self.app(environ, start_response)
    
    def _identify_tenant(self, request):
        """Identify tenant from hostname or auth token."""
        hostname = request.host.split(':')[0]
        
        # Check for tenant subdomain
        if hostname.endswith('assetanchor.com') and hostname != 'assetanchor.com':
            subdomain = hostname.split('.')[0]
            return Tenant.query.filter_by(subdomain=subdomain).first()
            
        # Check for custom domain
        tenant = Tenant.query.filter_by(custom_domain=hostname).first()
        if tenant:
            return tenant
            
        # Check for tenant in JWT if authenticated
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                payload = jwt.decode(token, app.config['JWT_SECRET_KEY'])
                tenant_id = payload.get('tenant_id')
                if tenant_id:
                    return Tenant.query.get(tenant_id)
            except:
                pass
                
        return None
```

### Query Isolation

All database queries automatically apply tenant isolation:

```python
class TenantScopedQuery(Query):
    """Query class that applies tenant filtering automatically."""
    
    def get(self, ident):
        """Override get to enforce tenant isolation."""
        obj = super(TenantScopedQuery, self).get(ident)
        if obj and hasattr(obj, 'tenant_id') and obj.tenant_id != g.tenant.id:
            return None
        return obj
        
    def __iter__(self):
        """Apply tenant filtering on all queries."""
        return super(TenantScopedQuery, self).__iter__()
```

## Resource Isolation

### File Storage Isolation

Tenant files are isolated in S3:

```python
def upload_tenant_file(file, path):
    """Upload file to tenant-specific S3 location."""
    tenant_prefix = f"tenant_{g.tenant.id}/"
    s3_path = tenant_prefix + path
    
    s3_client.upload_fileobj(
        file,
        app.config['S3_BUCKET_NAME'],
        s3_path,
        ExtraArgs={
            'Metadata': {'tenant_id': str(g.tenant.id)}
        }
    )
    
    return s3_path
```

### Tenant Resource Policies

S3 bucket policies enforce tenant isolation:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::123456789012:role/app-role"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::asset-anchor-prod/*",
            "Condition": {
                "StringEquals": {
                    "s3:ExistingObjectTag/tenant_id": "${aws:PrincipalTag/tenant_id}"
                }
            }
        }
    ]
}
```

## Authentication and Authorization

### Tenant-Aware Authentication

JWT tokens include tenant context:

```python
def create_access_token(user):
    """Create JWT with tenant information."""
    payload = {
        'user_id': user.id,
        'tenant_id': user.tenant_id,
        'exp': datetime.utcnow() + timedelta(minutes=60)
    }
    
    return jwt.encode(payload, app.config['JWT_SECRET_KEY'], algorithm='HS256')
```

### Role-Based Access Control

Tenant-specific roles and permissions:

```python
@require_permission('property:edit')
def edit_property(property_id):
    """Edit property with tenant-aware permission check."""
    property = Property.query.get(property_id)
    
    # Tenant isolation is already applied by TenantScopedQuery
    if not property:
        abort(404)
        
    # Check user permission within tenant context
    if not current_user.has_permission('property:edit'):
        abort(403)
        
    # Process property update
    # ...
```

## Tenant Provisioning and Management

### Tenant Onboarding Flow

1. **Tenant Registration**
   - Collect tenant information
   - Create tenant record
   - Generate tenant subdomain

2. **Resource Provisioning**
   - Create database schema
   - Initialize S3 folders
   - Set up tenant configuration

3. **Initial User Setup**
   - Create admin user
   - Set initial permissions
   - Send welcome email

```python
def provision_tenant(name, subdomain, admin_email, plan_id):
    """Provision a new tenant."""
    # Create tenant record
    tenant = Tenant(
        name=name,
        subdomain=subdomain,
        plan_id=plan_id,
        status='active',
        created_at=datetime.utcnow()
    )
    db.session.add(tenant)
    db.session.flush()  # Get tenant ID
    
    # Create database schema
    create_tenant_schema(tenant.id)
    
    # Create admin user
    admin = User(
        email=admin_email,
        tenant_id=tenant.id,
        role='admin',
        status='active'
    )
    admin.set_password(generate_secure_password())
    db.session.add(admin)
    
    # Create default tenant settings
    settings = TenantSettings(
        tenant_id=tenant.id,
        theme='default',
        timezone='UTC'
    )
    db.session.add(settings)
    
    # Commit changes
    db.session.commit()
    
    # Send welcome email with password reset link
    send_welcome_email(admin)
    
    return tenant
```

### Tenant Migration

Process for migrating tenant data:

```python
def migrate_tenant_data(source_tenant_id, target_tenant_id, tables=None):
    """Migrate data from one tenant to another."""
    source_schema = f"tenant_{source_tenant_id}"
    target_schema = f"tenant_{target_tenant_id}"
    
    if not tables:
        # Get all tables in source schema
        result = db.session.execute(text(
            f"SELECT table_name FROM information_schema.tables "
            f"WHERE table_schema = '{source_schema}'"
        ))
        tables = [row[0] for row in result]
    
    for table in tables:
        db.session.execute(text(
            f"INSERT INTO {target_schema}.{table} "
            f"SELECT * FROM {source_schema}.{table}"
        ))
    
    db.session.commit()
```

## Performance Considerations

### Connection Pooling

Efficient connection management with PgBouncer:

```ini
# PgBouncer configuration for multi-tenant setup
[databases]
* = host=127.0.0.1 port=5432 dbname=assetanchor

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 50
min_pool_size = 10
reserve_pool_size = 25
reserve_pool_timeout = 5.0

# Use server_reset_query to reset search_path
server_reset_query = DISCARD ALL
```

### Schema Caching

Optimizing for multiple schemas:

```python
# Cache tenant schemas to reduce metadata lookups
SCHEMA_CACHE = {}

def get_tenant_metadata(tenant_id):
    """Get SQLAlchemy MetaData for tenant schema with caching."""
    if tenant_id in SCHEMA_CACHE:
        return SCHEMA_CACHE[tenant_id]
        
    schema_name = f"tenant_{tenant_id}"
    metadata = MetaData(schema=schema_name)
    
    # Reflect tables for this tenant
    metadata.reflect(bind=db.engine)
    
    # Cache metadata
    SCHEMA_CACHE[tenant_id] = metadata
    return metadata
```

### Query Optimization

Indexes for tenant-specific queries:

```sql
-- Create tenant-aware indexes
CREATE INDEX idx_properties_created_at ON tenant_1.properties(created_at);
CREATE INDEX idx_transactions_status ON tenant_1.transactions(status);

-- For shared tables, include tenant_id in indexes
CREATE INDEX idx_users_tenant_role ON public.users(tenant_id, role);
```

## Tenant Customization and White-Labeling

Asset Anchor provides extensive customization options for tenants:

### Tenant Configuration Store

Central configuration for tenant-specific settings:

```python
class TenantSettings(db.Model):
    """Model for tenant-specific settings."""
    __tablename__ = 'tenant_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.UUID, db.ForeignKey('tenants.id'), nullable=False)
    theme = db.Column(db.String(50), default='default')
    primary_color = db.Column(db.String(7), default='#3f51b5')
    secondary_color = db.Column(db.String(7), default='#f50057')
    logo_url = db.Column(db.String(255))
    favicon_url = db.Column(db.String(255))
    custom_css_url = db.Column(db.String(255))
    custom_js_url = db.Column(db.String(255))
    custom_header_html = db.Column(db.Text)
    custom_footer_html = db.Column(db.Text)
    timezone = db.Column(db.String(50), default='UTC')
    date_format = db.Column(db.String(20), default='YYYY-MM-DD')
    currency = db.Column(db.String(3), default='USD')
    
    # JSON fields for flexible configuration
    feature_flags = db.Column(db.JSON, default={})
    ui_config = db.Column(db.JSON, default={})
    notification_settings = db.Column(db.JSON, default={})
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### White-Labeling Implementation

Backend support for white-labeled tenants:

```python
def get_tenant_branding():
    """Get tenant branding information for current tenant."""
    tenant_id = g.tenant.id
    
    # Try to get from cache first
    cache_key = f"tenant:{tenant_id}:branding"
    branding = cache.get(cache_key)
    
    if not branding:
        # Get from database
        settings = TenantSettings.query.filter_by(tenant_id=tenant_id).first()
        
        if not settings:
            # Return default branding
            return default_branding()
            
        branding = {
            'name': g.tenant.name,
            'logo': settings.logo_url or '/default-logo.png',
            'favicon': settings.favicon_url or '/favicon.ico',
            'primaryColor': settings.primary_color,
            'secondaryColor': settings.secondary_color,
            'theme': settings.theme,
            'customCss': settings.custom_css_url,
            'customJs': settings.custom_js_url,
            'customHeader': settings.custom_header_html,
            'customFooter': settings.custom_footer_html
        }
        
        # Cache for 1 hour
        cache.set(cache_key, branding, timeout=3600)
        
    return branding
```

Frontend integration with React:

```javascript
// src/contexts/TenantContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const TenantContext = createContext();

export function TenantProvider({ children }) {
  const [tenantBranding, setTenantBranding] = useState({
    name: 'Asset Anchor',
    logo: '/default-logo.png',
    primaryColor: '#3f51b5',
    secondaryColor: '#f50057',
    theme: 'default'
  });
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch tenant branding on component mount
    async function fetchTenantBranding() {
      try {
        const response = await axios.get('/api/tenant/branding');
        
        if (response.data) {
          setTenantBranding(response.data);
          
          // Apply tenant colors to CSS variables
          document.documentElement.style.setProperty(
            '--primary-color', 
            response.data.primaryColor
          );
          document.documentElement.style.setProperty(
            '--secondary-color', 
            response.data.secondaryColor
          );
          
          // Apply custom CSS if provided
          if (response.data.customCss) {
            const linkElement = document.createElement('link');
            linkElement.setAttribute('rel', 'stylesheet');
            linkElement.setAttribute('type', 'text/css');
            linkElement.setAttribute('href', response.data.customCss);
            document.head.appendChild(linkElement);
          }
          
          // Apply custom JS if provided
          if (response.data.customJs) {
            const scriptElement = document.createElement('script');
            scriptElement.setAttribute('src', response.data.customJs);
            scriptElement.setAttribute('async', true);
            document.body.appendChild(scriptElement);
          }
        }
      } catch (error) {
        console.error('Failed to load tenant branding', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTenantBranding();
  }, []);
  
  return (
    <TenantContext.Provider value={{ tenantBranding, loading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
```

### Custom Domain Support

Supporting tenant-specific domains:

```python
class Tenant(db.Model):
    """Model for tenant."""
    __tablename__ = 'tenants'
    
    id = db.Column(db.UUID, default=uuid.uuid4, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    subdomain = db.Column(db.String(63), unique=True, nullable=False)
    custom_domain = db.Column(db.String(255), unique=True)
    custom_domain_verified = db.Column(db.Boolean, default=False)
    dns_verification_token = db.Column(db.String(64))
    # Other fields...
```

Domain verification process:

```python
def verify_custom_domain(tenant_id):
    """Verify custom domain for tenant."""
    tenant = Tenant.query.get(tenant_id)
    
    if not tenant or not tenant.custom_domain:
        return {
            'status': 'error',
            'message': 'Tenant not found or no custom domain configured'
        }
        
    # Check DNS records
    verification_passed = check_dns_records(
        domain=tenant.custom_domain,
        expected_token=tenant.dns_verification_token
    )
    
    if verification_passed:
        # Update tenant record
        tenant.custom_domain_verified = True
        tenant.verified_at = datetime.utcnow()
        db.session.commit()
        
        # Configure SSL certificate
        provision_ssl_certificate(tenant.custom_domain)
        
        # Update routing configuration
        update_domain_routing(tenant)
        
        return {
            'status': 'success',
            'message': 'Domain verified successfully'
        }
    else:
        return {
            'status': 'error',
            'message': 'Domain verification failed. Please check DNS records.'
        }
```

### Tenant Feature Management

Enabling/disabling features per tenant:

```python
def feature_enabled(feature_name):
    """Check if a feature is enabled for the current tenant."""
    tenant_id = g.tenant.id
    
    # Get tenant settings
    settings = cache.get(f"tenant:{tenant_id}:settings")
    if not settings:
        settings = TenantSettings.query.filter_by(tenant_id=tenant_id).first()
        if settings:
            cache.set(f"tenant:{tenant_id}:settings", settings, timeout=300)
    
    # Check if feature exists in feature flags
    if settings and settings.feature_flags:
        feature_flags = settings.feature_flags
        if feature_name in feature_flags:
            return feature_flags[feature_name]
    
    # Check tenant plan features
    tenant = g.tenant
    plan_features = get_plan_features(tenant.plan_id)
    
    return feature_name in plan_features
```

Using feature flags in routes:

```python
@app.route('/api/advanced-analytics')
@login_required
def advanced_analytics():
    """Advanced analytics endpoint."""
    if not feature_enabled('advanced_analytics'):
        abort(404)  # Hide feature completely
        
    # Implementation for tenants with the feature enabled
    return jsonify(get_advanced_analytics_data())
```

## Security Considerations

### Tenant Data Isolation

Preventing data leakage between tenants:

1. **Schema-based isolation**: Using PostgreSQL search paths
2. **Application-level validation**: Double-checking tenant context
3. **Resource path verification**: Validating S3 paths include tenant prefix

### SQL Injection Prevention

Protecting against tenant context bypass:

```python
# NEVER construct schema names using string formatting
# BAD EXAMPLE - DON'T DO THIS:
# query = f"SELECT * FROM tenant_{tenant_id}.properties"

# GOOD EXAMPLE:
# Set search path properly
db.session.execute(text("SET search_path TO :schema, public"), {"schema": f"tenant_{tenant_id}"})
# Then use normal ORM queries
properties = Property.query.all()
```

### Tenant Context Validation

Multiple layers of protection:

```python
@app.before_request
def validate_tenant_context():
    """Validate tenant context on every request."""
    # Skip for public routes
    if request.endpoint in PUBLIC_ROUTES:
        return
        
    # Ensure tenant is set
    if not hasattr(g, 'tenant') or not g.tenant:
        abort(400, "Invalid tenant context")
        
    # For authenticated requests, validate tenant match
    if current_user and current_user.is_authenticated:
        if current_user.tenant_id != g.tenant.id:
            # Log security event
            log_security_event(
                'tenant_context_mismatch',
                user_id=current_user.id,
                expected_tenant=g.tenant.id,
                actual_tenant=current_user.tenant_id
            )
            abort(403, "Invalid tenant context")
```

## Monitoring and Debugging

### Tenant-Aware Logging

Adding tenant context to all logs:

```python
class TenantContextFilter(logging.Filter):
    """Add tenant information to logs."""
    
    def filter(self, record):
        tenant_id = 'unknown'
        if has_request_context() and hasattr(g, 'tenant') and g.tenant:
            tenant_id = g.tenant.id
            
        record.tenant_id = tenant_id
        return True

# Configure logger with filter
logger = app.logger
logger.addFilter(TenantContextFilter())
```

Logging format:

```python
# Configure log formatter
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter(
    '[%(asctime)s] [%(tenant_id)s] [%(levelname)s] %(message)s'
))
app.logger.addHandler(handler)
```

### Tenant Usage Metrics

Tracking tenant-specific metrics:

```python
def record_tenant_api_call(endpoint, tenant_id, response_time):
    """Record tenant API usage metrics."""
    # Increment API call counter
    redis_client.hincrby(f"tenant:{tenant_id}:api_calls", endpoint, 1)
    
    # Record response time
    redis_client.lpush(f"tenant:{tenant_id}:response_time:{endpoint}", response_time)
    redis_client.ltrim(f"tenant:{tenant_id}:response_time:{endpoint}", 0, 999)  # Keep last 1000
    
    # Record daily usage for billing
    today = date.today().isoformat()
    redis_client.hincrby(f"tenant:{tenant_id}:daily_usage:{today}", endpoint, 1)
```

## Tenant Scaling and Growth Management

### Tenant Growth Stages

Asset Anchor supports tenant growth through multiple stages:

1. **Startup Phase**: Shared database schema, standard resource allocation
2. **Growth Phase**: Enhanced resource allocation, dedicated connection pools
3. **Enterprise Phase**: Option for dedicated database, enhanced isolation

### Resource Allocation by Tenant Tier

| Resource Type | Standard Tier | Professional Tier | Enterprise Tier |
|---------------|--------------|-------------------|-----------------|
| Database      | Shared schema | Shared schema with dedicated pool | Optional dedicated database |
| Storage       | Shared bucket with tenant prefix | Shared bucket with tenant prefix | Optional dedicated bucket |
| API Rate Limits | 100 req/min | 500 req/min | 2000 req/min + custom |
| Connection Pool | Shared | Dedicated allocation | Dedicated allocation |
| Cache Size | 100MB | 500MB | 2GB+ |

### Tenant Usage Monitoring and Auto-Scaling

Asset Anchor monitors tenant resource usage and automatically adjusts resources:

```python
def analyze_tenant_usage(tenant_id):
    """Analyze tenant usage patterns and adjust resources."""
    # Get tenant usage metrics
    metrics = get_tenant_metrics(tenant_id, days=30)
    
    # Check database connection utilization
    if metrics['avg_db_connections'] > 80:  # 80% of allocation
        increase_db_connection_pool(tenant_id)
        
    # Check storage growth rate
    if metrics['storage_growth_rate'] > 0.2:  # 20% growth per month
        notify_tenant_approaching_limit(tenant_id, 'storage')
        
    # Check API usage
    if metrics['api_usage_percentage'] > 90:  # 90% of limit
        notify_tenant_approaching_limit(tenant_id, 'api_calls')
        
    # Check for noisy neighbor issues
    if metrics['avg_query_time'] > metrics['baseline_query_time'] * 2:
        investigate_performance_issue(tenant_id)
```

### Tenant Performance Optimization

Automatic optimization of tenant-specific resources:

```python
def optimize_tenant_resources(tenant_id):
    """Optimize database resources for tenant."""
    # Get tenant database usage statistics
    stats = get_tenant_db_statistics(tenant_id)
    
    # Analyze slow queries
    slow_queries = get_tenant_slow_queries(tenant_id)
    
    # Create tenant-specific indexes based on query patterns
    for query_pattern, frequency in stats['common_queries'].items():
        if frequency > 100 and query_pattern in slow_queries:
            create_optimized_index(tenant_id, query_pattern)
            
    # Update tenant statistics
    update_tenant_query_statistics(tenant_id)
    
    # Vacuum analyze tenant tables if needed
    if stats['last_vacuum'] < (datetime.now() - timedelta(days=7)):
        vacuum_analyze_tenant_tables(tenant_id)
```

## Tenant Data Backup and Restore

### Tenant-Specific Backups

Creating isolated tenant backups:

```bash
#!/bin/bash
# Script: backup_tenant.sh

TENANT_ID=$1
BACKUP_DIR="/backups/tenants"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCHEMA="tenant_${TENANT_ID}"

# Create backup directory
mkdir -p "${BACKUP_DIR}/${TENANT_ID}"

# Backup tenant schema
pg_dump -h localhost -U postgres -d assetanchor -n "${SCHEMA}" \
  -f "${BACKUP_DIR}/${TENANT_ID}/${TIMESTAMP}_schema.sql"

# Backup tenant files from S3
aws s3 sync "s3://asset-anchor-prod/tenant_${TENANT_ID}" \
  "${BACKUP_DIR}/${TENANT_ID}/${TIMESTAMP}_files"

# Backup tenant info from shared tables
psql -h localhost -U postgres -d assetanchor -c \
  "COPY (SELECT * FROM tenants WHERE id='${TENANT_ID}') TO STDOUT" \
  > "${BACKUP_DIR}/${TENANT_ID}/${TIMESTAMP}_tenant.csv"

psql -h localhost -U postgres -d assetanchor -c \
  "COPY (SELECT * FROM users WHERE tenant_id='${TENANT_ID}') TO STDOUT" \
  > "${BACKUP_DIR}/${TENANT_ID}/${TIMESTAMP}_users.csv"
  
# Backup tenant configuration
psql -h localhost -U postgres -d assetanchor -c \
  "COPY (SELECT * FROM tenant_settings WHERE tenant_id='${TENANT_ID}') TO STDOUT" \
  > "${BACKUP_DIR}/${TENANT_ID}/${TIMESTAMP}_settings.csv"

# Create backup manifest
echo "Backup created: $(date)" > "${BACKUP_DIR}/${TENANT_ID}/${TIMESTAMP}_manifest.txt"
echo "Tenant ID: ${TENANT_ID}" >> "${BACKUP_DIR}/${TENANT_ID}/${TIMESTAMP}_manifest.txt"
echo "Schema: ${SCHEMA}" >> "${BACKUP_DIR}/${TENANT_ID}/${TIMESTAMP}_manifest.txt"
echo "Files included:" >> "${BACKUP_DIR}/${TENANT_ID}/${TIMESTAMP}_manifest.txt"
find "${BACKUP_DIR}/${TENANT_ID}/${TIMESTAMP}_files" -type f | wc -l >> "${BACKUP_DIR}/${TENANT_ID}/${TIMESTAMP}_manifest.txt"
```

### Tenant Restoration

Restoring tenant data:

```bash
#!/bin/bash
# Script: restore_tenant.sh

TENANT_ID=$1
BACKUP_ID=$2
BACKUP_DIR="/backups/tenants/${TENANT_ID}/${BACKUP_ID}"

# Restore tenant schema
psql -h localhost -U postgres -d assetanchor -c "DROP SCHEMA IF EXISTS tenant_${TENANT_ID} CASCADE;"
psql -h localhost -U postgres -d assetanchor -f "${BACKUP_DIR}_schema.sql"

# Restore tenant files
aws s3 rm "s3://asset-anchor-prod/tenant_${TENANT_ID}" --recursive
aws s3 sync "${BACKUP_DIR}_files" "s3://asset-anchor-prod/tenant_${TENANT_ID}"

# Restore tenant info in shared tables
# First check if tenant exists
TENANT_EXISTS=$(psql -h localhost -U postgres -d assetanchor -t -c \
  "SELECT count(*) FROM tenants WHERE id='${TENANT_ID}'")

if [ "$TENANT_EXISTS" -eq "0" ]; then
  # Tenant doesn't exist, restore tenant record
  psql -h localhost -U postgres -d assetanchor -c \
    "\\COPY tenants FROM '${BACKUP_DIR}_tenant.csv' WITH CSV"
fi

# Restore users (with conflict handling)
psql -h localhost -U postgres -d assetanchor -c \
  "CREATE TEMP TABLE tmp_users ON COMMIT DROP AS SELECT * FROM users WHERE FALSE;"
  
psql -h localhost -U postgres -d assetanchor -c \
  "\\COPY tmp_users FROM '${BACKUP_DIR}_users.csv' WITH CSV"
  
psql -h localhost -U postgres -d assetanchor -c \
  "INSERT INTO users SELECT * FROM tmp_users 
   ON CONFLICT (id) DO UPDATE 
   SET email = EXCLUDED.email,
       updated_at = NOW();"

# Restore tenant settings
psql -h localhost -U postgres -d assetanchor -c \
  "DELETE FROM tenant_settings WHERE tenant_id='${TENANT_ID}';"
  
psql -h localhost -U postgres -d assetanchor -c \
  "\\COPY tenant_settings FROM '${BACKUP_DIR}_settings.csv' WITH CSV"

echo "Tenant ${TENANT_ID} restore completed at $(date)"
```

### Automated Backup Management

```python
def manage_tenant_backups():
    """Manage tenant backups based on retention policy."""
    tenants = Tenant.query.filter_by(status='active').all()
    
    for tenant in tenants:
        retention = get_tenant_backup_retention(tenant)
        
        # Get list of backups for tenant
        backup_dir = f"/backups/tenants/{tenant.id}"
        if not os.path.exists(backup_dir):
            continue
            
        backups = sorted([d for d in os.listdir(backup_dir) if os.path.isdir(f"{backup_dir}/{d}")])
        
        # Keep all backups within retention period
        cutoff_date = datetime.now() - timedelta(days=retention['days'])
        
        # Always keep minimum number of backups
        if len(backups) <= retention['min_backups']:
            continue
            
        # Process older backups
        for backup in backups[:-retention['min_backups']]:
            backup_date = parse_backup_date(backup)
            if backup_date < cutoff_date:
                if not is_monthly_backup(backup) or backup_date < (datetime.now() - timedelta(days=retention['monthly_days'])):
                    # Delete old backup
                    delete_backup(tenant.id, backup)
```

## Disaster Recovery for Multi-Tenant System

### Per-Tenant Recovery

Options for tenant-level disaster recovery:

1. **Full tenant restore**: Complete restore of a tenant's data
2. **Partial restore**: Restore specific tables or files
3. **Point-in-time recovery**: Restore tenant to specific timestamp

### Cross-Tenant Consistency

Maintaining consistency across tenants:

1. **Global transactions**: For operations affecting shared and tenant tables
2. **Tenant-aware backups**: Coordinated backup points
3. **Recovery validation**: Verify cross-tenant relationships after restore

## Appendix: Multi-Tenancy Test Suite

### Tenant Isolation Tests

```python
def test_tenant_data_isolation():
    """Test that tenants cannot access each other's data."""
    # Create test tenants
    tenant1 = create_test_tenant("tenant1")
    tenant2 = create_test_tenant("tenant2")
    
    # Create test data in tenant1
    with tenant_context(tenant1):
        property1 = Property(name="Tenant 1 Property")
        db.session.add(property1)
        db.session.commit()
        
    # Create test data in tenant2
    with tenant_context(tenant2):
        property2 = Property(name="Tenant 2 Property")
        db.session.add(property2)
        db.session.commit()
        
    # Verify tenant1 can only see its data
    with tenant_context(tenant1):
        properties = Property.query.all()
        assert len(properties) == 1
        assert properties[0].name == "Tenant 1 Property"
        
    # Verify tenant2 can only see its data
    with tenant_context(tenant2):
        properties = Property.query.all()
        assert len(properties) == 1
        assert properties[0].name == "Tenant 2 Property"
```

### Security Tests

```python
def test_cross_tenant_request_blocked():
    """Test that users cannot access other tenants."""
    # Create test tenants and users
    tenant1, user1 = create_test_tenant_and_user("tenant1")
    tenant2, user2 = create_test_tenant_and_user("tenant2")
    
    # Authenticate as user1
    token1 = create_access_token(user1)
    
    # Try to access tenant2's endpoint with user1's token
    response = client.get(
        '/api/properties',
        headers={
            'Authorization': f'Bearer {token1}',
            'Host': f'{tenant2.subdomain}.assetanchor.com'
        }
    )
    
    # Should be forbidden
    assert response.status_code == 403
```

### Performance Tests

```python
def test_multi_tenant_query_performance():
    """Test query performance across multiple tenants."""
    # Create test tenants with data
    tenants = [create_test_tenant_with_data(f"tenant{i}", 1000) for i in range(10)]
    
    # Measure query time for each tenant
    for tenant in tenants:
        with tenant_context(tenant):
            start_time = time.time()
            result = Property.query.filter(Property.price > 100000).all()
            duration = time.time() - start_time
            
            # Assert query completes in reasonable time
            assert duration < 0.1
            # Assert correct results
            assert len(result) > 0
```

## Advanced Multi-Tenant Operations

### Tenant Migration and Data Transfer

For enterprise clients requiring migration between environments:

```python
def migrate_tenant_between_environments(tenant_id, source_env, target_env):
    """Migrate tenant data between environments."""
    # Step 1: Validate environments
    validate_environments(source_env, target_env)
    
    # Step 2: Create backup of tenant data in source environment
    backup_result = create_tenant_backup(tenant_id, source_env)
    
    if backup_result['status'] != 'success':
        return {
            'status': 'error',
            'message': f'Backup failed: {backup_result["message"]}'
        }
    
    # Step 3: Check if tenant exists in target environment
    tenant_exists = check_tenant_exists(tenant_id, target_env)
    
    if tenant_exists:
        # Update existing tenant
        prepare_target_tenant(tenant_id, target_env)
    else:
        # Create new tenant in target environment
        create_tenant_in_environment(tenant_id, backup_result['tenant_data'], target_env)
    
    # Step 4: Transfer data
    transfer_result = transfer_tenant_data(
        tenant_id, 
        source_env, 
        target_env, 
        backup_result['backup_path']
    )
    
    # Step 5: Verify transfer
    verification_result = verify_tenant_transfer(tenant_id, source_env, target_env)
    
    return {
        'status': 'success' if verification_result['success'] else 'error',
        'message': verification_result['message'],
        'details': {
            'data_transferred': transfer_result['data_transferred'],
            'tables_migrated': transfer_result['tables_migrated'],
            'files_migrated': transfer_result['files_migrated']
        }
    }
```

### Cross-Tenant Analytics and Reporting

System-wide reporting across tenants for administrators:

```python
class SystemAnalyticsService:
    """Service for system-wide analytics across tenants."""
    
    @staticmethod
    def get_tenant_growth_metrics(period=30):
        """Get tenant growth metrics over time."""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=period)
        
        # Query tenant creation dates
        results = db.session.execute(text("""
            SELECT 
                DATE(created_at) as date, 
                COUNT(*) as new_tenants
            FROM tenants
            WHERE created_at BETWEEN :start_date AND :end_date
            GROUP BY DATE(created_at)
            ORDER BY date
        """), {
            'start_date': start_date,
            'end_date': end_date
        }).fetchall()
        
        return [{'date': row[0].isoformat(), 'new_tenants': row[1]} for row in results]
    
    @staticmethod
    def get_tenant_activity_metrics(period=7):
        """Get tenant activity metrics across system."""
        # Get activity data from logs
        results = db.session.execute(text("""
            SELECT 
                tenant_id,
                COUNT(*) as activity_count,
                MAX(timestamp) as last_activity
            FROM activity_logs
            WHERE timestamp >= NOW() - INTERVAL ':period days'
            GROUP BY tenant_id
        """), {'period': period}).fetchall()
        
        tenant_activity = {}
        for row in results:
            tenant_activity[str(row[0])] = {
                'activity_count': row[1],
                'last_activity': row[2].isoformat()
            }
        
        # Get tenant information
        tenants = db.session.execute(text("""
            SELECT id, name, subdomain, plan_id, status
            FROM tenants
        """)).fetchall()
        
        return [{
            'tenant_id': str(row[0]),
            'name': row[1],
            'subdomain': row[2],
            'plan': row[3],
            'status': row[4],
            'activity_count': tenant_activity.get(str(row[0]), {}).get('activity_count', 0),
            'last_activity': tenant_activity.get(str(row[0]), {}).get('last_activity', None)
        } for row in tenants]
    
    @staticmethod
    def get_resource_usage_by_tenant():
        """Get resource usage breakdown by tenant."""
        # Get database size by tenant
        db_size_results = db.session.execute(text("""
            SELECT
                tenant_id,
                pg_size_pretty(SUM(pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name)))) as total_size,
                SUM(pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) as size_bytes
            FROM information_schema.tables
            WHERE table_schema LIKE 'tenant_%'
            GROUP BY tenant_id
        """)).fetchall()
        
        # Get storage usage from S3
        storage_usage = get_tenant_storage_usage()
        
        # Combine metrics
        tenant_resource_usage = []
        for row in db_size_results:
            tenant_id = str(row[0])
            tenant = Tenant.query.get(tenant_id)
            
            if not tenant:
                continue
                
            tenant_resource_usage.append({
                'tenant_id': tenant_id,
                'name': tenant.name,
                'plan': tenant.plan_id,
                'db_size': row[1],
                'db_size_bytes': row[2],
                'storage_size_bytes': storage_usage.get(tenant_id, 0),
                'storage_size': format_bytes(storage_usage.get(tenant_id, 0)),
                'api_calls_30d': get_tenant_api_call_count(tenant_id, days=30),
                'user_count': User.query.filter_by(tenant_id=tenant_id).count()
            })
        
        return sorted(tenant_resource_usage, key=lambda x: x['db_size_bytes'], reverse=True)
```

### Tenant Health Monitoring

Automated system for monitoring tenant health:

```python
class TenantHealthMonitor:
    """Monitor tenant health and detect issues."""
    
    @staticmethod
    def check_tenant_health(tenant_id=None):
        """Check health of specific tenant or all tenants."""
        if tenant_id:
            tenants = [Tenant.query.get(tenant_id)]
            if not tenants[0]:
                return {'status': 'error', 'message': f'Tenant {tenant_id} not found'}
        else:
            tenants = Tenant.query.filter_by(status='active').all()
        
        health_reports = []
        
        for tenant in tenants:
            try:
                # Set tenant context
                TenantContext.set_tenant_id(tenant.id)
                
                health_check = {
                    'tenant_id': str(tenant.id),
                    'name': tenant.name,
                    'checks': {}
                }
                
                # Check 1: Database connectivity
                db_check = check_tenant_db_connectivity(tenant.id)
                health_check['checks']['database'] = db_check
                
                # Check 2: Storage access
                storage_check = check_tenant_storage_access(tenant.id)
                health_check['checks']['storage'] = storage_check
                
                # Check 3: Error rate
                error_rate = get_tenant_error_rate(tenant.id, hours=24)
                error_check = {
                    'status': 'healthy' if error_rate < 0.01 else 'warning' if error_rate < 0.05 else 'critical',
                    'details': {
                        'error_rate': error_rate,
                        'threshold_warning': 0.01,
                        'threshold_critical': 0.05
                    }
                }
                health_check['checks']['error_rate'] = error_check
                
                # Check 4: Response times
                response_time = get_tenant_avg_response_time(tenant.id, hours=24)
                response_check = {
                    'status': 'healthy' if response_time < 300 else 'warning' if response_time < 1000 else 'critical',
                    'details': {
                        'avg_response_time_ms': response_time,
                        'threshold_warning': 300,
                        'threshold_critical': 1000
                    }
                }
                health_check['checks']['response_time'] = response_check
                
                # Overall health status
                check_statuses = [check['status'] for check in health_check['checks'].values()]
                if 'critical' in check_statuses:
                    health_check['status'] = 'critical'
                elif 'warning' in check_statuses:
                    health_check['status'] = 'warning'
                else:
                    health_check['status'] = 'healthy'
                
                health_reports.append(health_check)
                
                # Alert on issues
                if health_check['status'] != 'healthy':
                    alert_tenant_health_issue(tenant.id, health_check)
                
            except Exception as e:
                health_reports.append({
                    'tenant_id': str(tenant.id),
                    'name': tenant.name,
                    'status': 'error',
                    'message': str(e)
                })
            finally:
                # Clear tenant context
                TenantContext.clear()
        
        return health_reports
```

## Conclusion and Best Practices

### Multi-Tenancy Implementation Guidelines

When implementing and maintaining the Asset Anchor multi-tenant architecture, follow these guidelines:

1. **Always Maintain Tenant Context**
   - Every database query must include tenant filtering
   - All resource access must verify tenant ownership
   - API endpoints must validate tenant context

2. **Performance Optimization**
   - Use appropriate indexes for tenant-filtered queries
   - Cache tenant-specific configuration and metadata
   - Monitor and address "noisy neighbor" problems

3. **Security First**
   - Regularly audit tenant isolation mechanisms
   - Use defense in depth with multiple isolation layers
   - Implement tenant-aware logging for security analysis

4. **Scalability Planning**
   - Design for horizontal scaling of tenant workloads
   - Implement resource quotas and throttling
   - Support tenant migration between resource tiers

### Key Metrics for Multi-Tenant Health

Monitor these metrics to ensure system health:

| Metric | Description | Warning Threshold | Critical Threshold |
|--------|-------------|-------------------|-------------------|
| Tenant Isolation Failures | Failed attempts to access cross-tenant data | >0 | N/A |
| Query Performance Variance | Deviation in query times across tenants | >50% | >200% |
| Resource Utilization Imbalance | Difference between highest and average tenant resource use | >100% | >300% |
| Tenant Error Rate | API errors per tenant | >1% | >5% |
| Schema Migration Time | Time to apply migrations across all tenants | >10 minutes | >30 minutes |

### Evolution of the Multi-Tenant Architecture

The Asset Anchor multi-tenant architecture will evolve in these directions:

1. **Enhanced Isolation Options**
   - Support for dedicated compute resources
   - Optional VPC isolation for enterprise tenants
   - Tenant-specific encryption keys

2. **Improved Resource Management**
   - Predictive scaling based on tenant usage patterns
   - Automated resource optimization
   - Fine-grained tenant resource quotas

3. **Advanced White-Labeling**
   - Full UI customization capabilities
   - Custom authentication flows
   - Tenant-specific API extensions

Asset Anchor's multi-tenant architecture balances isolation, performance, and operational efficiency to provide a secure and scalable platform for all tenants from small businesses to large enterprises.
