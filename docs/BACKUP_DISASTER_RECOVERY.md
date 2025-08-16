# Asset Anchor Backup and Disaster Recovery Plan

This document outlines the backup strategy, disaster recovery procedures, and business continuity plan for the Asset Anchor application.

## Backup Strategy

### Database Backups

#### PostgreSQL Backup Configuration

| Backup Type | Frequency | Retention | Storage Location | Encryption |
|-------------|-----------|-----------|-----------------|------------|
| Full Backup | Daily at 01:00 UTC | 30 days | Primary: S3 (assetanchor-backups)<br>Secondary: GCS (assetanchor-dr-backups) | AES-256 |
| Incremental | Every 6 hours | 7 days | Same as full backup | AES-256 |
| Transaction Logs (WAL) | Continuous | 7 days | Same as full backup | AES-256 |

#### Backup Implementation

```bash
# Example full backup script (scheduled via cron)
#!/bin/bash
set -e

# Environment variables
source /etc/assetanchor/backup.env

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="pg_backup_${TIMESTAMP}.custom"
BACKUP_PATH="/var/backups/postgresql/${BACKUP_FILE}"

# Create backup directory if it doesn't exist
mkdir -p /var/backups/postgresql

# Create full backup with compression
echo "Creating PostgreSQL backup: ${BACKUP_FILE}"
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F custom -Z 9 -f $BACKUP_PATH

# Encrypt backup
echo "Encrypting backup..."
gpg --encrypt --recipient backup@assetanchor.io --output ${BACKUP_PATH}.gpg ${BACKUP_PATH}
rm ${BACKUP_PATH}

# Upload to S3
echo "Uploading to S3..."
aws s3 cp ${BACKUP_PATH}.gpg s3://assetanchor-backups/database/daily/${BACKUP_FILE}.gpg

# Upload to GCS (secondary storage)
echo "Uploading to GCS..."
gsutil cp ${BACKUP_PATH}.gpg gs://assetanchor-dr-backups/database/daily/${BACKUP_FILE}.gpg

# Cleanup local file
rm ${BACKUP_PATH}.gpg

# Cleanup old backups (keep last 30 days)
echo "Cleaning up old backups..."
aws s3 ls s3://assetanchor-backups/database/daily/ | sort | head -n -30 | awk '{print $4}' | xargs -I {} aws s3 rm s3://assetanchor-backups/database/daily/{}
gsutil ls gs://assetanchor-dr-backups/database/daily/ | sort | head -n -30 | xargs -I {} gsutil rm gs://assetanchor-dr-backups/database/daily/{}

echo "Backup completed successfully"
```

#### WAL Archiving

For point-in-time recovery, configure PostgreSQL to archive write-ahead logs:

```ini
# In postgresql.conf
archive_mode = on
archive_command = 'aws s3 cp %p s3://assetanchor-backups/wal/%f'
archive_timeout = 60
```

### File Storage Backups

#### S3 Storage Configuration

| Content Type | Backup Method | Frequency | Retention | Secondary Storage |
|--------------|--------------|-----------|-----------|-------------------|
| User Uploads | S3 Cross-Region Replication | Real-time | Indefinite | S3 in secondary region |
| Documents | S3 Versioning + Lifecycle Rules | Real-time | 90 days for previous versions | S3 in secondary region |
| Generated Reports | S3 Standard -> Glacier | 30 days in Standard, then Glacier | 7 years | S3 in secondary region |

#### Implementation

```terraform
# Example Terraform configuration for S3 replication
resource "aws_s3_bucket" "primary_bucket" {
  bucket = "assetanchor-uploads"
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    id      = "archive-old-versions"
    enabled = true
    
    noncurrent_version_transition {
      days          = 30
      storage_class = "GLACIER"
    }
    
    noncurrent_version_expiration {
      days = 90
    }
  }
}

resource "aws_s3_bucket" "replica_bucket" {
  bucket = "assetanchor-uploads-dr"
  region = "us-west-2"  # Different region than primary
}

resource "aws_s3_bucket_replication_configuration" "replication" {
  bucket = aws_s3_bucket.primary_bucket.id
  
  rule {
    id     = "entire-bucket"
    status = "Enabled"
    
    destination {
      bucket        = aws_s3_bucket.replica_bucket.arn
      storage_class = "STANDARD_IA"
    }
  }
}
```

### Application Configuration Backups

| Configuration Type | Backup Method | Frequency | Storage |
|-------------------|---------------|-----------|---------|
| Environment Variables | Encrypted export | Weekly + on change | Version controlled in private repo |
| Infrastructure as Code | Git repository | On change | GitHub + offline backup |
| CI/CD Configuration | Git repository | On change | GitHub + offline backup |

#### Implementation

```bash
#!/bin/bash
# Script to backup environment variables

# Export environment variables from Kubernetes secrets
kubectl get secret app-env -o json | jq -r '.data | map_values(@base64d)' > env_backup.json

# Encrypt the file
gpg --encrypt --recipient devops@assetanchor.io --output env_backup.json.gpg env_backup.json
rm env_backup.json

# Store in private Git repository
cp env_backup.json.gpg /path/to/config-backups/
cd /path/to/config-backups/
git add env_backup.json.gpg
git commit -m "Backup environment variables $(date +%Y-%m-%d)"
git push
```

## Disaster Recovery Procedures

### Recovery Time Objectives (RTO)

| Severity | Description | RTO | Example Scenarios |
|----------|-------------|-----|-------------------|
| Critical | Complete service outage | 1 hour | Data center failure, region-wide cloud provider outage |
| High | Major feature unavailability | 4 hours | Database corruption, severe app deployment issue |
| Medium | Degraded service | 12 hours | Performance issues, non-critical component failure |
| Low | Minimal impact | 24 hours | Minor features unavailable, cosmetic issues |

### Recovery Point Objectives (RPO)

| Data Type | RPO | Implementation |
|-----------|-----|----------------|
| Transaction Data | 5 minutes | WAL shipping, database replication |
| User Uploaded Files | 15 minutes | S3 cross-region replication |
| Application Configuration | 24 hours | Regular configuration backups |

### Disaster Scenarios and Recovery Procedures

#### Scenario 1: Primary Database Failure

**Severity**: Critical
**RTO**: 1 hour
**RPO**: 5 minutes

**Recovery Procedure**:

1. **Assessment (5 minutes)**
   - Confirm database is unresponsive
   - Determine if it's a transient issue or permanent failure
   - Alert disaster recovery team via PagerDuty

2. **Failover Decision (5 minutes)**
   - If unrecoverable within 15 minutes, initiate failover
   - Update status page to inform users

3. **Database Restoration (30 minutes)**
   ```bash
   # 1. Provision new database instance if needed
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier asset-anchor-db-new \
     --db-snapshot-identifier asset-anchor-db-snapshot-latest
   
   # 2. Apply transaction logs for point-in-time recovery
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier asset-anchor-db \
     --target-db-instance-identifier asset-anchor-db-new \
     --use-latest-restorable-time
   
   # 3. Verify database integrity
   PGPASSWORD=$DB_PASSWORD psql -h $NEW_DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT count(*) FROM users;"
   ```

4. **Application Reconfiguration (10 minutes)**
   - Update database connection strings in Kubernetes secrets
   - Restart application pods to use new database
   ```bash
   kubectl create secret generic db-creds \
     --from-literal=connection-string="postgresql://$DB_USER:$DB_PASS@$NEW_DB_HOST:5432/$DB_NAME" \
     --dry-run=client -o yaml | kubectl apply -f -
   
   kubectl rollout restart deployment/asset-anchor-api
   ```

5. **Verification (10 minutes)**
   - Run automated test suite against restored system
   - Check latest transactions in admin panel
   - Verify critical user workflows

#### Scenario 2: Cloud Provider Region Outage

**Severity**: Critical
**RTO**: 1 hour
**RPO**: 15 minutes

**Recovery Procedure**:

1. **Activation (5 minutes)**
   - Confirm region-wide outage via status pages and AWS CLI
   - Activate DR team via emergency call
   - Update status page

2. **DNS Failover (10 minutes)**
   - Switch DNS to secondary region endpoints
   ```bash
   # Update Route 53 failover record
   aws route53 change-resource-record-sets \
     --hosted-zone-id $HOSTED_ZONE_ID \
     --change-batch '{
       "Changes": [{
         "Action": "UPSERT",
         "ResourceRecordSet": {
           "Name": "api.assetanchor.io",
           "Type": "A",
           "SetIdentifier": "failover",
           "Failover": "PRIMARY",
           "TTL": 60,
           "ResourceRecords": [{"Value": "$DR_ENDPOINT_IP"}]
         }
       }]
     }'
   ```

3. **Infrastructure Deployment (30 minutes)**
   - Deploy application stack in DR region using Infrastructure as Code
   ```bash
   cd /path/to/terraform
   terraform workspace select dr
   terraform apply -var="region=us-west-2" -auto-approve
   ```

4. **Data Verification (15 minutes)**
   - Confirm database has latest transactions
   - Verify file access from backup S3 bucket
   - Run critical transaction tests

#### Scenario 3: Corrupted Database

**Severity**: High
**RTO**: 4 hours
**RPO**: Depends on corruption detection time

**Recovery Procedure**:

1. **Assessment (30 minutes)**
   - Identify extent of corruption
   - Determine point-in-time for recovery
   - Take emergency database backup
   
2. **Database Restoration (2 hours)**
   - Restore to point before corruption
   ```bash
   # Identify suitable backup
   aws s3 ls s3://assetanchor-backups/database/daily/
   
   # Download and decrypt backup
   aws s3 cp s3://assetanchor-backups/database/daily/pg_backup_20230615_010000.custom.gpg .
   gpg --decrypt pg_backup_20230615_010000.custom.gpg > pg_backup_20230615_010000.custom
   
   # Restore to temporary database
   pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME_TEMP -F custom pg_backup_20230615_010000.custom
   
   # Apply WAL logs to specific timestamp
   pg_waldump /path/to/wal/files --stop-time='2023-06-15 08:30:00'
   ```
   
3. **Data Reconciliation (1 hour)**
   - Compare restored database with corrupted database
   - Identify and manually fix any issues
   - Run database integrity checks
   
4. **Switchover (30 minutes)**
   - Switch application to use restored database
   - Run full verification suite
   - Monitor for any issues

### Infrastructure Recovery

#### Kubernetes Cluster Recovery

```bash
# 1. Create new Kubernetes cluster
eksctl create cluster -f cluster-config.yaml

# 2. Apply all manifests
kubectl apply -f kubernetes/namespaces/
kubectl apply -f kubernetes/config-maps/
kubectl apply -f kubernetes/secrets/
kubectl apply -f kubernetes/deployments/
kubectl apply -f kubernetes/services/
kubectl apply -f kubernetes/ingress/

# 3. Verify all pods are running
kubectl get pods --all-namespaces
```

#### Application Deployment in DR Environment

```bash
# 1. Deploy backend
kubectl apply -f kubernetes/dr/backend-deployment.yaml

# 2. Deploy frontend
aws s3 cp s3://assetanchor-frontend-backup/latest/ s3://assetanchor-dr-frontend/ --recursive
aws cloudfront create-invalidation --distribution-id $DR_DISTRIBUTION_ID --paths "/*"

# 3. Run smoke tests
./scripts/smoke-tests.sh https://dr.api.assetanchor.io
```

## Business Continuity Plan

### Critical Business Functions

| Function | Criticality | Max. Tolerable Downtime | Minimum Resources Required |
|----------|-------------|-------------------------|-----------------------------|
| User Authentication | High | 1 hour | Auth database, API servers |
| Property Data Access | High | 4 hours | Main database, API servers, object storage |
| Payment Processing | Medium | 12 hours | Payment gateway integration, transaction database |
| Document Generation | Low | 24 hours | PDF service, template storage |

### Communication Plan

#### Internal Communication

| Audience | Channel | Responsible | Message Content |
|----------|---------|-------------|----------------|
| Executive Team | Phone call + Email | CTO | Incident summary, business impact, ETA |
| Engineering Team | Slack + PagerDuty | DevOps Lead | Technical details, action items |
| Customer Support | Email + Team meeting | Product Manager | User-facing impact, talking points |

#### Customer Communication

| Incident Severity | Communication Method | Timing | Owner |
|-------------------|----------------------|--------|-------|
| Critical | Status page + Email + In-app | Within 30 minutes | Customer Success Manager |
| High | Status page + Email | Within 1 hour | Customer Success Manager |
| Medium | Status page | Within 2 hours | Support Team |
| Low | Status page | Within business hours | Support Team |

**Template**:

```
Subject: [ALERT] Asset Anchor Service Disruption

Dear [Customer],

We are currently experiencing an issue with [specific service/feature] that may affect your ability to [specific user action]. Our team is actively working to resolve this issue.

Current Status: [brief description]
Estimated Resolution: [timeframe if known]
Workaround: [if available]

We will provide updates on our status page at https://status.assetanchor.io

We apologize for any inconvenience this may cause. If you have urgent concerns, please contact our support team at support@assetanchor.io.

Sincerely,
Asset Anchor Team
```

### Manual Procedures

#### If Automation Tools Unavailable

1. **Manual Database Backup**
   ```bash
   pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > manual_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Manual File Backup**
   ```bash
   aws s3 sync s3://assetanchor-uploads /mnt/backup-drive/assetanchor-uploads
   ```

3. **Manual Deployment**
   ```bash
   # Backend
   docker build -t assetanchor/api:latest .
   docker push assetanchor/api:latest
   
   # SSH to each server and update
   ssh user@server "docker pull assetanchor/api:latest && docker-compose up -d"
   
   # Frontend
   npm run build
   scp -r build/* user@server:/var/www/html/
   ```

## Testing and Maintenance

### DR Testing Schedule

| Test Type | Frequency | Scope | Last Performed | Next Scheduled |
|-----------|-----------|-------|---------------|---------------|
| Table-top Exercise | Quarterly | Team discussion of DR scenarios | 2023-03-15 | 2023-06-15 |
| Database Restore Test | Monthly | Restore DB to isolated environment | 2023-05-01 | 2023-06-01 |
| Regional Failover Test | Quarterly | Full DR activation without user impact | 2023-03-20 | 2023-06-20 |
| Full DR Simulation | Annually | Complete service recovery in DR environment | 2022-11-10 | 2023-11-10 |

### Test Procedure Example

#### Database Restore Test

1. **Preparation**
   - Schedule test during off-hours
   - Notify engineering team
   - Prepare isolated test environment

2. **Execution**
   - Download most recent backup
   ```bash
   aws s3 ls s3://assetanchor-backups/database/daily/ | sort | tail -n 1 | awk '{print $4}' | xargs -I {} aws s3 cp s3://assetanchor-backups/database/daily/{} .
   ```
   - Decrypt backup file
   ```bash
   gpg --decrypt pg_backup_20230601_010000.custom.gpg > pg_backup_20230601_010000.custom
   ```
   - Restore to test environment
   ```bash
   pg_restore -h test-db-host -U test-user -d test_db -F custom pg_backup_20230601_010000.custom
   ```

3. **Verification**
   - Run integrity checks
   ```sql
   -- Check for critical tables
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   
   -- Count records in critical tables
   SELECT 'users' as table, COUNT(*) FROM users
   UNION SELECT 'properties', COUNT(*) FROM properties
   UNION SELECT 'transactions', COUNT(*) FROM transactions;
   
   -- Verify recent data exists
   SELECT MAX(created_at) FROM transactions;
   ```
   - Run application against test database
   ```bash
   docker run -e DB_HOST=test-db-host -e DB_NAME=test_db -e DB_USER=test-user -e DB_PASSWORD=test-pass assetanchor/api:latest
   ```

4. **Documentation**
   - Record restore time
   - Document any issues encountered
   - Update DR plan if needed

### Plan Maintenance

| Activity | Frequency | Responsible | Last Updated |
|----------|-----------|-------------|-------------|
| Review DR Plan | Quarterly | DevOps Lead | 2023-05-01 |
| Update Contact Information | Monthly | Office Manager | 2023-05-15 |
| Verify Backup Integrity | Weekly | Automated + DevOps Engineer | Ongoing |
| Update RTO/RPO Requirements | Annually | CTO + Business Stakeholders | 2023-01-15 |

## Recovery Resources

### Team Contact Information

| Role | Name | Primary Contact | Secondary Contact | Responsibilities |
|------|------|----------------|-------------------|------------------|
| DR Coordinator | Jane Smith | 555-123-4567 | jane@assetanchor.io | Overall coordination, communication |
| Database Specialist | John Doe | 555-234-5678 | john@assetanchor.io | Database recovery |
| Infrastructure Lead | Carlos Rodriguez | 555-345-6789 | carlos@assetanchor.io | Cloud infrastructure recovery |
| Application Lead | Sarah Johnson | 555-456-7890 | sarah@assetanchor.io | Application deployment, verification |

### External Contacts

| Service | Provider | Contact | Account ID | Notes |
|---------|----------|---------|------------|-------|
| Cloud Provider | AWS | 1-888-AWS-SUPPORT | 123456789012 | Enterprise Support |
| Database Service | AWS RDS | 1-888-AWS-SUPPORT | rds-instance-12345 | Same as AWS |
| DNS Provider | Route 53 | 1-888-AWS-SUPPORT | hosted-zone-12345 | Same as AWS |
| CDN | Cloudflare | support@cloudflare.com | account-67890 | Business plan |

### Required Credentials

| System | Credential Type | Storage Location | Access Procedure |
|--------|----------------|------------------|------------------|
| AWS Console | IAM Emergency User | LastPass Shared Folder | Contact DR Coordinator for access |
| Database | Admin Credentials | AWS Secrets Manager | Use AWS CLI with DR role |
| Backup Storage | Encryption Keys | Hardware security keys (x3) | 1 with CTO, 1 with DevOps Lead, 1 in office safe |

### Recovery Environments

| Environment | Provider | Region | Purpose | Setup Time |
|-------------|----------|--------|---------|------------|
| DR Production | AWS | us-west-2 | Full production recovery | 30-60 mins (partially pre-provisioned) |
| Backup Test Env | AWS | us-east-1 | Backup verification | Always available |
| Minimal Recovery | Digital Ocean | NYC1 | Critical services only | 60-90 mins (from scratch) |

## Appendix

### Backup Verification Checklist

- [ ] Backup completed successfully
- [ ] Backup size within expected range
- [ ] Backup can be downloaded and decrypted
- [ ] Database can be restored from backup
- [ ] Application works with restored database
- [ ] Recent transactions appear in restored database
- [ ] User files accessible from backup storage

### Recovery Runbook Quick Reference

1. **Assess the situation**
   - Identify affected components
   - Determine severity level
   - Activate appropriate team members

2. **Communicate**
   - Internal: Alert relevant teams
   - External: Update status page

3. **Recover infrastructure**
   - Database: Restore from backup or activate replica
   - Application: Deploy to recovery environment
   - Configure networking: Update DNS, CDN, load balancers

4. **Verify recovery**
   - Run automated tests
   - Check critical functionality manually
   - Verify data integrity

5. **Return to normal**
   - Monitor system stability
   - Plan migration back to primary (if applicable)
   - Conduct post-incident review
