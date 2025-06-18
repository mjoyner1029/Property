# PortfolioPilot

A multi-tenant SaaS property management platform for landlords and tenants.

## Features

- Landlord/Tenant Auth (JWT)
- Properties, Tenants, Payments, Maintenance
- Stripe Subscriptions + Platform Fee
- React + MUI Dashboard
- PostgreSQL (via Docker) or SQLite fallback

## Tech Stack

- Frontend: React, MUI, Chart.js
- Backend: Flask, SQLAlchemy, Stripe, JWT
- DB: PostgreSQL or SQLite
- CI: GitHub Actions
- Dockerized Dev Setup

## Dev Setup

```bash
git clone https://github.com/yourusername/portfolio-pilot.git
cd portfolio-pilot
docker-compose up --build
