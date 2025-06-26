# PropertyPilot

PropertyPilot is a full-stack SaaS property management platform for landlords and tenants. It supports recurring rent payments, real-time messaging, maintenance tracking, onboarding flows, and admin tools.

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

### Frontend (React + Tailwind CSS)
- Landlord and tenant onboarding flows
- Admin dashboard with user/property management
- Real-time chat UI per property
- Notifications dropdown with unread badge
- Fully responsive layout (mobile/tablet/desktop)
- Form validation and error handling
- Dashboard analytics and navigation
- Stripe payment UI integration

## Tech Stack

- **Frontend:** React, Tailwind CSS, Socket.IO-client, Axios
- **Backend:** Flask, SQLAlchemy, Flask-JWT-Extended, Flask-SocketIO, Stripe SDK
- **Database:** PostgreSQL (via Render) or SQLite (local)
- **Deployment:** Docker, Render (backend), Vercel (frontend)
- **DevOps:** GitHub Actions (optional), dotenv for environment configs

---

## Setup Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/mjoyner1029/Property.git
cd Property
