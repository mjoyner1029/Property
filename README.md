# Asset Anchor

Asset Anchor is a full-stack SaaS property management platform that connects landlords and tenants. The platform streamlines rent collection, maintenance requests, document management, and communications between all parties.

![Asset Anchor](frontend/public/asset_anchor.png)

## Features

### Backend (Flask + SQLAlchemy)
- Role-based authentication (landlord, tenant, admin)
- Stripe Connect integration for payment processing
- Email verification and password reset flows
- Real-time messaging via Socket.IO
- Maintenance request tracking with status updates
- Document upload and management
- Notifications system with unread/read state
- RESTful API with JWT-secured endpoints
- Webhook support for Stripe events
- Flask-Migrate and Alembic for database migrations
- Production-ready config (HTTPS headers, Talisman, logging)
- Monitoring with Prometheus and Grafana
- Comprehensive test suite

### Frontend (React + Material UI)
- Responsive design for desktop and mobile
- Role-specific dashboards and interfaces
- Real-time updates with Socket.IO
- Stripe Elements integration for payments
- Document viewing and uploading
- Interactive charts for analytics
- Form validation and error handling
- Optimized build for production deployment
- Landlord and tenant onboarding flows
- Admin dashboard with user/property management
- Real-time chat UI per property
- Notifications dropdown with unread badge
- Fully responsive layout (mobile/tablet/desktop)
- Form validation and error handling
- Dashboard analytics and navigation
- Stripe payment UI integration

## Tech Stack

- **Frontend:** React, Material UI, Socket.IO-client, Axios
- **Backend:** Flask, SQLAlchemy, Flask-JWT-Extended, Flask-SocketIO, Stripe SDK
- **Database:** PostgreSQL (production) or SQLite (local development)
- **Deployment:** Docker, Render (backend), Vercel (frontend)

## Setup Instructions

### Prerequisites
- Docker and Docker Compose
- Node.js 16+ and npm (for local frontend development)
- Python 3.11+ (for local backend development)
- Stripe account with API keys
- PostgreSQL (for production)

### Local Development Setup

#### Option 1: Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/mjoyner1029/Property.git
   cd Property
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your settings

   # Frontend
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with your settings
   ```

3. **Generate self-signed SSL certificates for local development** (Optional)
   ```bash
   ./generate-local-certs.sh
   ```

4. **Start the application with Docker Compose**
   ```bash
   docker-compose up
   ```

   This will automatically run database migrations on startup.

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5050/api

#### Option 2: Manual Setup

1. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   flask db upgrade
   flask run --port 5050
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

### Database Initialization
```bash
# Inside Docker container
docker-compose exec backend flask db upgrade

# Local development
cd backend
flask db upgrade
```

## Deployment

For detailed deployment instructions, see:
- [ASSETANCHOR_DEPLOYMENT.md](./ASSETANCHOR_DEPLOYMENT.md) - Comprehensive deployment guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist

### Quick Deployment

1. **Set required environment variables**
   - See "Environment Variables" section below

2. **Run the deployment script**
   ```bash
   ./deploy-assetanchor.sh
   ```

3. **Verify the deployment**
   ```bash
   ./pre-deploy-check.sh
   ```

### Cloud Deployment Options

- **Render**: Use the included `render.yaml` for backend deployment
- **Vercel**: Connect the frontend repository through the Vercel UI

## Environment Variables

### Backend (.env, .env.production)
```
# Flask Configuration
FLASK_ENV=production|development
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret_key

# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Stripe
STRIPE_PUBLIC_KEY=pk_live_your_key
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_key

# Email
MAIL_SERVER=smtp.example.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password

# Frontend URL (for email links)
FRONTEND_URL=https://assetanchor.io
```

### Frontend (.env, .env.production)
```
REACT_APP_API_URL=https://api.assetanchor.io/api
REACT_APP_SOCKET_URL=wss://api.assetanchor.io
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
REACT_APP_DOMAIN=https://assetanchor.io
```

## Stripe Webhook Setup

1. **Local Development**
   - Use Stripe CLI to forward events:
     ```bash
     stripe listen --forward-to localhost:5050/api/webhooks/stripe
     ```
   - Add webhook signing secret to backend .env:
     ```
     STRIPE_WEBHOOK_SECRET=whsec_...
     ```
   - The webhook endpoint should be configured to listen for these events:
     - payment_intent.succeeded
     - payment_intent.payment_failed
     - checkout.session.completed
     - account.updated

2. **Production**
   - Create webhook endpoint in Stripe Dashboard pointing to:
     ```
     https://api.assetanchor.io/api/webhooks/stripe
     ```
   - Select events: payment_intent.succeeded, payment_intent.payment_failed, etc.
   - Add webhook signing secret to backend environment variables

## Admin Access

For initial admin setup:
- Sign up using the registration form
- Use the backend script to upgrade the user to admin:
  ```bash
  flask create-admin-user admin@example.com
  ```

## Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## License

Copyright © 2025 Asset Anchor. All rights reserved.
