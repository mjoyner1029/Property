# Asset Anchor Database Schema

This document describes the database schema for the Asset Anchor application, including tables, relationships, and important fields.

## Overview

Asset Anchor uses a relational database (PostgreSQL) with the following core entity types:
- Users and authentication
- Properties and assets
- Tenants and leases
- Transactions and financial records
- Documents and files
- System configuration and audit logs

## Entity Relationship Diagram

```
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│     User      │       │    Property   │       │    Tenant     │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ id            │       │ id            │       │ id            │
│ email         │       │ name          │       │ name          │
│ password_hash │       │ address       │       │ email         │
│ first_name    │   ┌───│ owner_id ───┐ │       │ phone         │
│ last_name     │   │   │ status       │ │       │ created_at    │
│ role          │   │   │ created_at   │ │       │ updated_at    │
│ created_at    │   │   │ updated_at   │ │       └───────┬───────┘
│ updated_at    │   │   └───────┬───────┘         ┌─────┘
└───────┬───────┘   │           │                 │
        └───────────┘           │                 │
                                ▼                 │
                     ┌───────────────┐            │
                     │     Lease     │◄───────────┘
                     ├───────────────┤
                     │ id            │
                     │ property_id   │
                     │ tenant_id     │
                     │ start_date    │
                     │ end_date      │
                     │ rent_amount   │
                     │ status        │
                     │ created_at    │
                     │ updated_at    │
                     └───────┬───────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Transaction   │
                    ├─────────────────┤
                    │ id              │
                    │ lease_id        │
                    │ amount          │
                    │ type            │
                    │ status          │
                    │ due_date        │
                    │ payment_date    │
                    │ created_at      │
                    │ updated_at      │
                    └─────────────────┘
```

## Table Definitions

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    phone VARCHAR(20),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Properties Table

```sql
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    owner_id UUID REFERENCES users(id),
    property_type VARCHAR(50) NOT NULL,  -- residential, commercial, etc.
    status VARCHAR(50) NOT NULL DEFAULT 'active',  -- active, inactive, archived
    bedrooms INTEGER,
    bathrooms NUMERIC(3,1),
    square_feet INTEGER,
    year_built INTEGER,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_location ON properties(city, state);
```

### Tenants Table

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    ssn_last_four VARCHAR(4),
    date_of_birth DATE,
    credit_score INTEGER,
    income NUMERIC(12,2),
    background_check_status VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_name ON tenants(last_name, first_name);
```

### Leases Table

```sql
CREATE TABLE leases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rent_amount NUMERIC(10,2) NOT NULL,
    security_deposit NUMERIC(10,2) NOT NULL,
    payment_day INTEGER NOT NULL DEFAULT 1,  -- Day of month rent is due
    status VARCHAR(50) NOT NULL DEFAULT 'active',  -- active, expired, terminated
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Indexes
CREATE INDEX idx_leases_property ON leases(property_id);
CREATE INDEX idx_leases_tenant ON leases(tenant_id);
CREATE INDEX idx_leases_status ON leases(status);
CREATE INDEX idx_leases_dates ON leases(start_date, end_date);
```

### Transactions Table

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lease_id UUID NOT NULL REFERENCES leases(id),
    amount NUMERIC(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- rent, deposit, fee, maintenance
    status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, completed, failed, refunded
    due_date DATE,
    payment_date DATE,
    payment_method VARCHAR(50),  -- credit_card, bank_transfer, cash, check
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_lease ON transactions(lease_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_dates ON transactions(due_date, payment_date);
```

### Documents Table

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    entity_type VARCHAR(50) NOT NULL,  -- property, lease, tenant, transaction
    entity_id UUID NOT NULL,
    uploader_id UUID REFERENCES users(id),
    is_confidential BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_uploader ON documents(uploader_id);
```

### Maintenance Requests Table

```sql
CREATE TABLE maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',  -- low, medium, high, emergency
    status VARCHAR(50) NOT NULL DEFAULT 'open',  -- open, assigned, in_progress, completed, cancelled
    assigned_to UUID REFERENCES users(id),
    estimated_cost NUMERIC(10,2),
    actual_cost NUMERIC(10,2),
    scheduled_date TIMESTAMP,
    completed_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_maintenance_property ON maintenance_requests(property_id);
CREATE INDEX idx_maintenance_tenant ON maintenance_requests(tenant_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_assigned ON maintenance_requests(assigned_to);
```

### User Sessions Table

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    token VARCHAR(255) NOT NULL,
    refresh_token VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

### Audit Logs Table

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

## Common Queries

### Active Leases for Property

```sql
SELECT l.*, t.first_name, t.last_name, t.email
FROM leases l
JOIN tenants t ON l.tenant_id = t.id
WHERE l.property_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
AND l.status = 'active'
AND l.end_date >= CURRENT_DATE;
```

### Overdue Transactions

```sql
SELECT t.*, l.property_id, p.name as property_name, tn.first_name, tn.last_name
FROM transactions t
JOIN leases l ON t.lease_id = l.id
JOIN properties p ON l.property_id = p.id
JOIN tenants tn ON l.tenant_id = tn.id
WHERE t.status = 'pending'
AND t.due_date < CURRENT_DATE
ORDER BY t.due_date ASC;
```

### Properties with Expiring Leases

```sql
SELECT p.*, l.end_date, t.first_name, t.last_name, t.email, t.phone
FROM properties p
JOIN leases l ON p.id = l.property_id
JOIN tenants t ON l.tenant_id = t.id
WHERE l.status = 'active'
AND l.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
ORDER BY l.end_date ASC;
```

## Database Migrations

Asset Anchor uses Alembic with Flask-Migrate for database migrations. Each schema change should be properly tracked with a migration script.

```bash
# Create a migration
flask db migrate -m "Description of changes"

# Apply migrations
flask db upgrade

# Roll back a migration
flask db downgrade
```

## Indexing Strategy

1. **Primary Keys**: All tables use UUID primary keys to prevent enumeration attacks and allow for distributed ID generation.

2. **Foreign Keys**: All relationships are properly indexed with foreign key constraints.

3. **Common Query Paths**: Indexes are created for fields commonly used in WHERE clauses or JOIN conditions.

4. **Compound Indexes**: Used where multiple columns are frequently queried together.

5. **Partial Indexes**: Consider adding partial indexes for specific query patterns on large tables.

## Data Protection

1. **Sensitive Data**: Fields like `ssn_last_four` should be encrypted at the application level.

2. **Auditing**: All changes to core entities are tracked in the `audit_logs` table.

3. **Soft Deletes**: Consider implementing soft deletes for entities that should not be permanently removed.

## Performance Considerations

1. **Partitioning**: For large tables like `transactions` or `audit_logs`, consider time-based partitioning.

2. **Connection Pooling**: Use PgBouncer for efficient connection management.

3. **Query Optimization**: Monitor slow queries and optimize as needed.

4. **Regular Maintenance**: Schedule regular VACUUM and ANALYZE operations.

## Multi-tenancy Support

The current schema supports multi-tenancy through explicit owner relationships. For enhanced isolation:

1. **Row-Level Security**: Implement RLS policies for tenant data segregation.

2. **Schema-Based Isolation**: For large tenants, consider schema-based isolation with identical table structures.

## Backup and Recovery

1. **Backup Strategy**: 
   - Full daily backups
   - Incremental backups every 6 hours
   - WAL archiving for point-in-time recovery

2. **Retention Policy**:
   - Daily backups: 7 days
   - Weekly backups: 4 weeks
   - Monthly backups: 12 months

3. **Recovery Testing**: Regularly test backup restoration to validate the recovery process.
