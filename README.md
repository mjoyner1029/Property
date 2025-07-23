# Asset Anchor

AssetAnchor is a full-stack SaaS property management platform for landlords and tenants. It supports recurring rent payments, real-time messaging, maintenance tracking, onboarding flows, and admin tools.

## Features

### Backend (Flask + SQLAlchemy)
- Role-based authentication (landlord, tenant, admin)
- Stripe integration (rent payments, refunds, subscriptions)
- Email verification and invite system
- Real-time messaging via Socket.IO
- Maintenance request tracking
- Notifications system with unread/read state
- RESTful API with JWT-secured endpoints
- Webhook support for Stripe events
- Flask-Migrate and Alembic for schema migrations
- Production-ready config (HTTPS headers, Talisman, logging)
- Unit and integration test scaffolding
- Performance monitoring and metrics
- Centralized error handling
- Redis caching integration

### Frontend (React + Material UI)
- Landlord and tenant onboarding flows
- Admin dashboard with user/property management
- Real-time chat UI per property
- Notifications dropdown with unread badge
- Fully responsive layout (mobile/tablet/desktop)
- Form validation and error handling
- Dashboard analytics and navigation
- Stripe payment UI integration
- Global feedback system
- Performance monitoring
- Error tracking

## Tech Stack

- **Frontend:** React, Material UI, Socket.IO-client, Custom API client
- **Backend:** Flask, SQLAlchemy, Flask-JWT-Extended, Flask-SocketIO, Stripe SDK
- **Database:** PostgreSQL
- **Caching:** Redis
- **Monitoring:** Prometheus, Grafana
- **Deployment:** Docker, Docker Compose, Render
- **DevOps:** GitHub Actions, Automated testing

---

## Development Setup

### 1. Clone the Repo

```bash
git clone https://github.com/mjoyner1029/Property.git
cd Property
```
