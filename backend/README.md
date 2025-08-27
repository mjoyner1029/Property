# Asset Anchor API

A secure, production-ready API for the Asset Anchor property management platform.

## Overview

Asset Anchor API is a Flask-based RESTful API that provides the backend services for the Asset Anchor property management platform. It enables property managers, landlords, and tenants to manage properties, leases, payments, communications, and more.

## Features

- **Complete Authentication System**
  - JWT-based authentication with access and refresh tokens
  - Role-based access control (Admin, Landlord, Tenant)
  - Multi-factor authentication support
  - Account lockout protection against brute force attacks

- **Property Management**
  - Property listing and management
  - Unit and lease management
  - Tenant management and communications

- **Payment Processing**
  - Stripe integration for secure payments
  - Automated billing and invoicing
  - Payment history and reporting

- **Communications**
  - In-app messaging
  - Email notifications
  - SMS alerts (via Twilio)

- **Security**
  - Content Security Policy headers
  - Rate limiting to prevent abuse
  - Comprehensive input validation
  - HTTPS enforcement
  - Password strength validation
  - SQL injection protection

- **Observability**
  - Structured JSON logging
  - Request tracing with correlation IDs
  - Sentry error tracking integration
  - Health check endpoints for monitoring

## Technology Stack

- **Framework**: Flask
- **Database**: PostgreSQL (SQLAlchemy ORM)
- **Authentication**: JWT (Flask-JWT-Extended)
- **API Documentation**: OpenAPI/Swagger
- **Payments**: Stripe API
- **Caching & Rate Limiting**: Redis
- **Monitoring**: Sentry, JSON logging
- **Testing**: Pytest
- **Task Queue**: Celery (for background jobs)

## Getting Started

### Prerequisites

- Python 3.10+
- PostgreSQL
- Redis (optional for development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/asset-anchor-api.git
   cd asset-anchor-api
   ```

2. Set up a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment:
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your settings
   ```

5. Initialize the database:
   ```bash
   flask db upgrade
   ```

6. Run the development server:
   ```bash
   python run.py
   ```

The API will be available at http://localhost:5000

## Development

### Project Structure

```
backend/
├── config/                   # Configuration files (nginx, supervisord, etc.)
├── instance/                 # Instance-specific data
├── migrations/               # Database migrations
├── src/
│   ├── controllers/          # Business logic controllers
│   ├── models/               # SQLAlchemy models
│   ├── routes/               # Flask blueprints and route definitions
│   ├── utils/                # Utility functions and helpers
│   │   ├── account_security.py  # Account lockout protection
│   │   ├── mfa.py              # Multi-factor authentication
│   │   ├── password_validation.py  # Password strength validation
│   │   ├── role_required.py    # Role-based access control
│   │   ├── security.py         # Security utilities
│   │   └── tracing.py          # Request tracing utilities
│   ├── app.py                # App factory
│   ├── config.py             # Configuration management
│   ├── extensions.py         # Flask extensions
│   └── wsgi.py               # WSGI entry point
├── tests/                    # Test suite
├── .env.example              # Example environment variables
├── DEPLOY_NOTES.md           # Deployment guide
├── requirements.txt          # Production dependencies
└── requirements-dev.txt      # Development dependencies
```

### Running Tests

```bash
pytest
```

### Code Quality

```bash
flake8 src/
black src/
```

## Deployment

See [DEPLOY_NOTES.md](DEPLOY_NOTES.md) for detailed deployment instructions.

## Security

If you discover any security issues, please email security@assetanchor.io instead of using the issue tracker.

## License

Proprietary - All rights reserved.
