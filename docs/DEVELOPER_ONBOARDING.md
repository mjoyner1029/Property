# Asset Anchor Developer Onboarding Guide

Welcome to the Asset Anchor development team! This guide will help you get set up with everything you need to start contributing to the project effectively.

## Table of Contents

- [Project Overview](#project-overview)
- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Resources](#resources)
- [Getting Help](#getting-help)

## Project Overview

Asset Anchor is a property management platform designed to help property owners and managers streamline their operations. The system includes:

- Property portfolio management
- Tenant management and screening
- Lease tracking and renewals
- Financial transaction processing
- Maintenance request handling
- Document management
- Reporting and analytics

### Tech Stack

- **Backend**: Python with Flask RESTful API
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Frontend**: React with TypeScript
- **Infrastructure**: AWS (ECS, RDS, S3, CloudFront)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana, Sentry

## Development Environment Setup

### Prerequisites

- Git
- Python 3.11+
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 13+ (local or Docker)
- Redis (local or Docker)
- AWS CLI

### Initial Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/assetanchor/property.git
   cd property
   ```

2. **Backend Setup**

   ```bash
   # Create and activate virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   cd backend
   pip install -r requirements.txt
   pip install -e .  # Install package in development mode
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env file with your local settings
   
   # Initialize database
   flask db upgrade
   
   # Create test data (optional)
   python init_db.py
   
   # Run development server
   python run.py
   ```

3. **Frontend Setup**

   ```bash
   cd ../frontend
   
   # Install dependencies
   npm install
   
   # Set up environment variables
   cp .env.example .env.local
   # Edit .env.local file with your settings
   
   # Start development server
   npm start
   ```

4. **Using Docker Compose (Optional but Recommended)**

   ```bash
   # Start all services
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   
   # Stop all services
   docker-compose down
   ```

### IDE Configuration

#### VS Code (Recommended)

1. Install recommended extensions:
   - Python
   - Pylance
   - ESLint
   - Prettier
   - Docker
   - GitLens
   
2. Configure settings:
   ```json
   {
     "python.linting.enabled": true,
     "python.linting.flake8Enabled": true,
     "python.formatting.provider": "black",
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     },
     "javascript.updateImportsOnFileMove.enabled": "always",
     "typescript.updateImportsOnFileMove.enabled": "always"
   }
   ```

#### PyCharm

1. Import project from existing sources
2. Configure Python interpreter to use virtual environment
3. Install plugins:
   - NodeJS
   - JavaScript and TypeScript
   - Docker

### Access to Services

Request access to the following services from your team lead:

1. GitHub organization and repository access
2. AWS console access for development environment
3. Jira project access
4. Confluence space access
5. Slack workspace invitation
6. Development database credentials
7. API keys for third-party services

## Project Structure

### Repository Overview

```
├── .github/            # GitHub Actions workflows
├── backend/            # Python Flask backend
│   ├── migrations/     # Alembic database migrations
│   ├── src/            # Source code
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── static/       # Static files
│   │   ├── templates/    # Template files (rarely used)
│   │   ├── tests/        # Test files
│   │   └── utils/        # Utility functions
│   ├── app.db           # Development SQLite database
│   └── requirements.txt  # Python dependencies
├── docs/               # Documentation
├── frontend/           # React frontend
│   ├── public/         # Static assets
│   ├── src/            # Source code
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   ├── services/     # API clients
│   │   ├── store/        # Redux store
│   │   └── utils/        # Utility functions
│   └── package.json    # Node.js dependencies
├── scripts/            # Utility scripts
├── docker-compose.yml  # Docker Compose configuration
└── README.md           # Main project README
```

### Key Files

- `backend/src/app.py`: Main Flask application initialization
- `backend/src/config.py`: Application configuration
- `backend/src/extensions.py`: Flask extensions initialization
- `frontend/src/App.tsx`: Main React application component
- `frontend/src/index.tsx`: Entry point for React application
- `.github/workflows/`: CI/CD pipeline definitions
- `docker-compose.yml`: Development environment configuration

## Development Workflow

### Git Workflow

We follow a GitHub Flow workflow:

1. **Pull the latest changes** from the main branch:

   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create a new branch** for your feature or fix:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

   Branch naming conventions:
   - `feature/` for new features
   - `fix/` for bug fixes
   - `chore/` for maintenance tasks
   - `docs/` for documentation updates

3. **Make your changes** and commit them with descriptive messages:

   ```bash
   git add .
   git commit -m "feat: Add new property search functionality"
   ```

   We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

4. **Push your branch** to GitHub:

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** (PR) from your branch to the main branch.

6. **Address review comments** and make necessary changes.

7. **Once approved**, merge your PR to main.

### Issue Tracking

We use Jira for issue tracking and project management:

1. All work should be related to a Jira ticket
2. Update ticket status as you progress
3. Reference Jira ticket IDs in commit messages and PRs
   ```
   feat(property): Add filtering by status (AA-123)
   ```

### Code Review Process

1. **PR Requirements**:
   - Pass all automated tests and checks
   - Follow coding standards
   - Include appropriate tests
   - Update documentation if necessary

2. **Review Process**:
   - At least one approval is required
   - Address all comments before merging
   - Maintainer will merge approved PRs

## Coding Standards

### Python

We follow PEP 8 with some customizations:

- Line length limit: 100 characters
- Use double quotes for strings
- Format code with Black

Example:

```python
def calculate_rent_increase(base_rent: float, increase_percentage: float) -> float:
    """
    Calculate the new rent after applying an increase percentage.
    
    Args:
        base_rent: Current rent amount
        increase_percentage: Percentage increase as decimal (e.g., 0.05 for 5%)
        
    Returns:
        New rent amount after increase
    """
    if increase_percentage < 0:
        raise ValueError("Increase percentage cannot be negative")
        
    return base_rent * (1 + increase_percentage)
```

### JavaScript/TypeScript

We follow the Airbnb JavaScript Style Guide with some customizations:

- Use TypeScript for type safety
- Use functional components and hooks for React
- Format code with Prettier

Example:

```typescript
interface PropertySearchParams {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
}

/**
 * Search for properties based on the provided criteria
 * @param params - Search parameters
 * @returns Promise containing search results
 */
const searchProperties = async (params: PropertySearchParams): Promise<Property[]> => {
  const queryParams = new URLSearchParams();
  
  if (params.city) {
    queryParams.append('city', params.city);
  }
  
  if (params.minPrice) {
    queryParams.append('min_price', params.minPrice.toString());
  }
  
  if (params.maxPrice) {
    queryParams.append('max_price', params.maxPrice.toString());
  }
  
  if (params.bedrooms) {
    queryParams.append('bedrooms', params.bedrooms.toString());
  }
  
  const response = await apiClient.get(`/properties?${queryParams.toString()}`);
  return response.data;
};
```

## Testing

### Backend Testing

We use pytest for backend testing:

```bash
# Run all tests
cd backend
pytest

# Run specific test file
pytest src/tests/test_auth.py

# Run with coverage report
pytest --cov=src
```

### Frontend Testing

We use Jest and React Testing Library for frontend testing:

```bash
# Run all tests
cd frontend
npm test

# Run specific test file
npm test -- src/components/PropertyList.test.tsx

# Run with coverage report
npm test -- --coverage
```

### End-to-End Testing

We use Cypress for end-to-end testing:

```bash
# Open Cypress test runner
cd frontend
npm run cypress:open

# Run Cypress tests headlessly
npm run cypress:run
```

## Deployment

### Environments

- **Development**: Automatically deployed from the main branch
- **Staging**: Manually triggered deployment from main branch
- **Production**: Manually triggered deployment from release tags

### CI/CD Pipeline

Our GitHub Actions workflows handle:

1. Running tests
2. Building Docker images
3. Deploying to AWS
4. Running post-deployment checks

To view workflow status, check the Actions tab in GitHub.

## Documentation

### Code Documentation

- Document all functions, classes, and modules with docstrings
- Keep README files up to date
- Update API documentation when endpoints change

### System Documentation

We maintain additional documentation in the `docs` folder and in Confluence:

- Architecture diagrams
- API documentation
- Database schema
- Deployment guides
- Operational runbooks

## Resources

### Internal Resources

- [API Documentation](https://confluence.assetanchor.io/display/DEV/API+Documentation)
- [Architecture Overview](https://confluence.assetanchor.io/display/DEV/Architecture+Overview)
- [Database Schema](https://confluence.assetanchor.io/display/DEV/Database+Schema)
- [Development Guidelines](https://confluence.assetanchor.io/display/DEV/Development+Guidelines)

### External Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [AWS Documentation](https://docs.aws.amazon.com/)

## Getting Help

### Communication Channels

- **Slack**: #dev-team channel for day-to-day communication
- **Jira**: For task tracking and bug reports
- **Confluence**: For documentation and knowledge sharing
- **Email**: For formal communication
- **Daily Standup**: 10:00 AM ET on Zoom

### Team Members

- **Engineering Manager**: Jane Smith (jane.smith@assetanchor.io)
- **Backend Lead**: John Doe (john.doe@assetanchor.io)
- **Frontend Lead**: Alice Johnson (alice.johnson@assetanchor.io)
- **DevOps Lead**: Bob Brown (bob.brown@assetanchor.io)
- **QA Lead**: Carol White (carol.white@assetanchor.io)

### Common Issues and Solutions

#### Backend Development

1. **Database migration errors**
   
   Solution: Reset migrations and recreate them
   ```bash
   flask db stamp head
   flask db migrate -m "Reset migrations"
   flask db upgrade
   ```

2. **Environment variable issues**
   
   Solution: Ensure .env file is properly configured and sourced
   ```bash
   source .env
   # or
   export $(grep -v '^#' .env | xargs)
   ```

#### Frontend Development

1. **Node module issues**
   
   Solution: Clean install node modules
   ```bash
   rm -rf node_modules
   npm ci
   ```

2. **API connection issues**
   
   Solution: Check that the backend is running and CORS is properly configured

### First Week Checklist

- [ ] Set up development environment
- [ ] Access all required services
- [ ] Complete introductory ticket
- [ ] Review codebase architecture
- [ ] Meet with team members
- [ ] Attend first sprint planning
- [ ] Complete security training
- [ ] Set up regular 1:1 with manager
