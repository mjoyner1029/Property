.PHONY: setup install migrate-init migrate upgrade format lint test test-coverage check-env generate-secrets health-check

# Default target
all: setup

# Help target
help:
	@echo "Asset Anchor Makefile Commands:"
	@echo "  setup           : Set up development environment"
	@echo "  install         : Install dependencies"
	@echo "  migrate-init    : Initialize database migrations"
	@echo "  migrate         : Create migration (use with message='your message')"
	@echo "  upgrade         : Apply migrations"
	@echo "  format          : Format code"
	@echo "  lint            : Lint code"
	@echo "  test            : Run tests"
	@echo "  test-coverage   : Run tests with coverage"
	@echo "  dev             : Start development servers"
	@echo "  check-env       : Check environment variables"
	@echo "  generate-secrets: Generate secure random secrets"
	@echo "  health-check    : Check API health endpoint"

# Setup development environment
setup:
	@echo "Setting up development environment..."
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

# Install dependencies
install:
	@echo "Installing dependencies..."
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

# Initialize migrations
migrate-init:
	@echo "Initializing database migrations..."
	cd backend && flask db init

# Create migration
migrate:
	@echo "Creating migration..."
	cd backend && flask db migrate -m "$(message)"

# Apply migrations
upgrade:
	@echo "Applying migrations..."
	cd backend && flask db upgrade

# Format code
format:
	@echo "Formatting code..."
	cd backend && black .
	cd frontend && npm run format

# Lint code
lint:
	@echo "Linting code..."
	cd backend && flake8 .
	cd frontend && npm run lint

# Run tests
test:
	@echo "Running tests..."
	cd backend && pytest
	cd frontend && npm test

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	cd backend && pytest --cov=src

# Start development servers
dev:
	@echo "Starting development servers..."
	cd backend && python run.py &
	cd frontend && npm start

# Check environment variables
check-env:
	@echo "Checking environment variables..."
	python scripts/check_env.py

# Generate secure random secrets
generate-secrets:
	@echo "Generating secure random secrets..."
	bash scripts/generate_secrets.sh

# Check API health
health-check:
	@echo "Checking API health..."
	curl -s http://localhost:5050/api/health | python -m json.tool
