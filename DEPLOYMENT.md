# Production Deployment Guide for Asset Anchor

This guide details how to deploy Asset Anchor to production environments.

## Prerequisites

- GitHub repository with your code
- Render.com account (or alternative cloud provider)
- PostgreSQL database
- Redis instance
- Domain name (optional but recommended)
- SSL certificates

## Step 1: Prepare the Application

1. Set environment variables:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.production
   ```

2. Update environment variables with production values:
   - Database credentials
   - JWT secrets
   - Stripe API keys
   - Mail server settings
   - Redis URL
   - Domain names

3. Test locally with production settings:
   ```bash
   docker-compose up
   ```

## Step 2: Database Setup

1. Create a PostgreSQL database in your cloud provider
2. Run migrations:
   ```bash
   cd backend
   python migrate.py
   ```
3. Consider setting up regular backups

## Step 3: Frontend Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Verify the build:
   ```bash
   npx serve -s build
   ```

3. Deploy to Render:
   - Connect your GitHub repository
   - Configure using the `render.yaml` file
   - Set required environment variables
   - Enable automatic TLS certificates

## Step 4: Backend Deployment

1. Deploy to Render:
   - Connect your GitHub repository
   - Configure using the `render.yaml` file
   - Set all required environment variables
   - Connect to your PostgreSQL database
   - Set up Redis

2. Verify the API is working:
   ```bash
   curl https://api.assetanchor.com/api/status
   ```

## Step 5: Domain Configuration

1. Configure your domains in Render
2. Update DNS settings with your domain registrar
3. Verify SSL certificates are working properly

## Step 6: Monitoring Setup

1. Set up Prometheus and Grafana in your infrastructure
2. Import the dashboard templates
3. Set up alerting for critical metrics
4. Monitor:
   - API response times
   - Error rates
   - Database performance
   - System resource utilization

## Step 7: Post-Deployment

1. Test all critical user flows in production
2. Verify payment processing works correctly
3. Check email sending functionality
4. Test user registration and authentication
5. Monitor error logs for any issues

## Step 8: Scaling (If Needed)

1. Increase instance sizes in Render
2. Scale horizontally by adding more instances
3. Optimize database queries and add indexes
4. Set up read replicas for the database if needed

## Common Issues & Troubleshooting

- **Database Connection Issues**: Verify connection strings and credentials
- **Missing Environment Variables**: Check all required variables are set
- **SSL Certificate Problems**: Ensure domains are correctly configured
- **File Upload Issues**: Verify permissions on upload directories
- **Email Sending Failures**: Test SMTP credentials

## Maintenance

1. Schedule regular backups
2. Plan for database migrations
3. Monitor security updates
4. Implement a staging environment for testing changes

---

For detailed deployment options and configurations, refer to the `DEPLOYMENT_CHECKLIST.md` file.
