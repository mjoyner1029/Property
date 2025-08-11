#!/bin/bash
# deploy-assetanchor.sh - Deployment script for AssetAnchor.io

set -e  # Exit immediately if a command exits with a non-zero status

# Display script banner
echo "======================================================"
echo "          AssetAnchor.io Deployment Script           "
echo "======================================================"
echo "Domain: assetanchor.io"
echo "Date: $(date)"
echo "======================================================"

# Check if running with proper permissions
if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

# Configuration variables - REPLACE THESE WITH YOUR ACTUAL VALUES
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-change_this_password}"
DB_NAME="${DB_NAME:-assetanchor}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@assetanchor.io}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-change_this_password}"
ADMIN_NAME="${ADMIN_NAME:-AssetAnchor Admin}"
EMAIL_HOST="${EMAIL_HOST:-smtp.example.com}"
EMAIL_USER="${EMAIL_USER:-noreply@assetanchor.io}"
EMAIL_PASSWORD="${EMAIL_PASSWORD:-change_this_password}"
STRIPE_PUBLIC_KEY="${STRIPE_PUBLIC_KEY:-pk_live_your_stripe_public_key}"
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_live_your_stripe_secret_key}"
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-whsec_your_stripe_webhook_secret}"
DOMAIN="assetanchor.io"
FRONTEND_URL="https://${DOMAIN}"

echo "1. Preparing environment..."

# Create necessary directories
mkdir -p logs
mkdir -p nginx/ssl
mkdir -p backend/uploads
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana/provisioning

# Set up SSL certificates with Let's Encrypt if they don't exist
if [ ! -f "nginx/ssl/fullchain.pem" ] || [ ! -f "nginx/ssl/privkey.pem" ]; then
    echo "2. Setting up SSL certificates with Let's Encrypt..."
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        echo "Installing certbot..."
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Obtain certificates
    certbot certonly --standalone -d ${DOMAIN} -d www.${DOMAIN} --agree-tos --email ${ADMIN_EMAIL} --non-interactive
    
    # Copy certificates to nginx/ssl directory
    cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem nginx/ssl/
    cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem nginx/ssl/
    
    # Set up auto-renewal
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -
else
    echo "2. SSL certificates already exist, skipping setup..."
fi

echo "3. Creating production environment file..."
cat > backend/.env.production << EOF
# Flask Configuration
FLASK_ENV=production
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

# Database
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db/${DB_NAME}

# Stripe Production Keys
STRIPE_PUBLIC_KEY=${STRIPE_PUBLIC_KEY}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}

# Email
MAIL_SERVER=${EMAIL_HOST}
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=${EMAIL_USER}
MAIL_PASSWORD=${EMAIL_PASSWORD}
MAIL_SUPPRESS_SEND=False

# Frontend URL for building email links
FRONTEND_URL=${FRONTEND_URL}

# Logging
LOG_LEVEL=INFO
EOF

echo "4. Creating docker-compose override file..."
cat > docker-compose.override.yml << EOF
version: '3.8'

services:
  frontend:
    environment:
      - REACT_APP_API_URL=https://${DOMAIN}/api
      - NODE_ENV=production

  nginx:
    environment:
      - DOMAIN=${DOMAIN}
EOF

echo "5. Pulling latest code..."
git pull

echo "6. Building and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

echo "7. Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend flask db upgrade

echo "8. Creating admin user..."
docker-compose -f docker-compose.prod.yml exec -e ADMIN_EMAIL=${ADMIN_EMAIL} -e ADMIN_PASSWORD=${ADMIN_PASSWORD} -e ADMIN_NAME="${ADMIN_NAME}" backend python init_db.py

echo "9. Setting up automatic backups..."
mkdir -p /root/backups

# Create backup script
cat > /root/backup-assetanchor.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p ${BACKUP_DIR}

# Database backup
docker-compose -f /root/assetanchor/docker-compose.prod.yml exec -T db pg_dump -U postgres assetanchor > ${BACKUP_DIR}/assetanchor_db_${TIMESTAMP}.sql

# Compress backup
gzip ${BACKUP_DIR}/assetanchor_db_${TIMESTAMP}.sql

# Backup uploads directory
tar -czf ${BACKUP_DIR}/assetanchor_uploads_${TIMESTAMP}.tar.gz -C /root/assetanchor/backend/uploads .

# Keep only last 7 backups
find ${BACKUP_DIR} -name "assetanchor_db_*.sql.gz" -type f -mtime +7 -delete
find ${BACKUP_DIR} -name "assetanchor_uploads_*.tar.gz" -type f -mtime +7 -delete
EOF

chmod +x /root/backup-assetanchor.sh

# Set up daily backup cron job
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-assetanchor.sh") | crontab -

echo "10. Checking service status..."
docker-compose -f docker-compose.prod.yml ps

echo "11. Running health check..."
sleep 5  # Give services time to start
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://${DOMAIN}/api/health || echo "Failed")

if [ "$HEALTH_STATUS" == "200" ]; then
    echo -e "\033[0;32m✅ Deployment completed successfully! AssetAnchor is healthy.\033[0m"
else
    echo -e "\033[0;31m⚠️ Health check returned status $HEALTH_STATUS\033[0m"
    echo "Please check application logs for errors:"
    echo "docker-compose -f docker-compose.prod.yml logs backend"
fi

echo "======================================================"
echo "         AssetAnchor.io Deployment Complete          "
echo "======================================================"
echo "Admin dashboard: https://${DOMAIN}/admin"
echo "API endpoint: https://${DOMAIN}/api"
echo "======================================================"
echo "Deployment completed at $(date)"
echo "======================================================"
