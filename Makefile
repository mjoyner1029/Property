.PHONY: setup install migrate-init migrate upgrade format lint test test-backend test-backend-verbose test-frontend test-coverage check-env generate-secrets health-check list-routes check-security run dev-server backend-clean monitoring-start monitoring-stop monitoring-restart monitoring-logs monitoring-backup perf-smoke perf-load perf-smoke-baseline perf-load-baseline perf-smoke-api perf-load-api

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
	@echo "  test            : Run all tests"
	@echo "  test-backend    : Run backend tests only"
	@echo "  test-backend-verbose: Run backend tests with verbose output"
	@echo "  test-frontend   : Run frontend tests only"
	@echo "  test-coverage   : Run tests with coverage"
	@echo "  dev             : Start development servers"
	@echo "  run             : Run backend server"
	@echo "  dev-server      : Run backend development server with Flask"
	@echo "  list-routes     : List all backend API routes"
	@echo "  check-env       : Check environment variables"
	@echo "  generate-secrets: Generate secure random secrets"
	@echo "  health-check    : Check API health endpoint"
	@echo "  check-security  : Check for security vulnerabilities in dependencies"
	@echo "  backend-clean   : Clean up Python cache files"
	@echo "  monitoring-start: Start monitoring stack"
	@echo "  monitoring-stop : Stop monitoring stack"
	@echo "  monitoring-restart: Restart monitoring stack"
	@echo "  monitoring-logs : View monitoring stack logs"
	@echo "  monitoring-backup: Backup monitoring data"
	@echo "  perf-smoke      : Run smoke performance test"
	@echo "  perf-load       : Run load performance test"
	@echo "  perf-smoke-baseline: Compare smoke test with baseline"
	@echo "  perf-load-baseline : Compare load test with baseline"
	@echo "  perf-smoke-api  : Run smoke test against specific API URL"
	@echo "  perf-load-api   : Run load test against specific API URL"

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

# Run backend tests only
test-backend:
	@echo "Running backend tests..."
	cd backend && pytest

# Run backend tests verbosely
test-backend-verbose:
	@echo "Running backend tests verbosely..."
	cd backend && pytest -v

# Run frontend tests only
test-frontend:
	@echo "Running frontend tests..."
	cd frontend && npm test

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	cd backend && pytest --cov=src --cov-report=term --cov-report=xml --cov-report=html

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

# List API routes
list-routes:
	@echo "Listing API routes..."
	cd backend && FLASK_APP=src.app flask routes

# Check for security vulnerabilities
check-security:
	@echo "Checking for security vulnerabilities..."
	cd backend && pip install safety && safety check

# Run backend server
run:
	@echo "Running backend server..."
	cd backend && python run.py

# Run backend development server
dev-server:
	@echo "Running backend development server..."
	cd backend && FLASK_APP=src.app FLASK_ENV=development flask run --host=0.0.0.0 --port=5050

# Clean up Python cache files
backend-clean:
	@echo "Cleaning up Python cache files..."
	cd backend && find . -type d -name __pycache__ -exec rm -rf {} +
	cd backend && find . -type f -name "*.pyc" -delete
	cd backend && rm -rf .coverage htmlcov coverage.xml

# Monitoring stack commands
monitoring-start:
	@echo "Starting monitoring stack..."
	docker-compose -f docker-compose.monitoring.yml up -d

monitoring-stop:
	@echo "Stopping monitoring stack..."
	docker-compose -f docker-compose.monitoring.yml down

monitoring-restart:
	@echo "Restarting monitoring stack..."
	docker-compose -f docker-compose.monitoring.yml restart

monitoring-logs:
	@echo "Viewing monitoring stack logs..."
	docker-compose -f docker-compose.monitoring.yml logs -f

monitoring-backup:
	@echo "Backing up monitoring data..."
	mkdir -p backups
	docker-compose -f docker-compose.monitoring.yml exec prometheus sh -c "cd /prometheus && tar czf - ." > backups/prometheus_data_$(shell date +%Y%m%d).tar.gz
	docker-compose -f docker-compose.monitoring.yml exec grafana sh -c "cd /var/lib/grafana && tar czf - ." > backups/grafana_data_$(shell date +%Y%m%d).tar.gz

# Performance testing commands
perf-smoke:
	@echo "Running smoke performance test..."
	node perf/scripts/run-perf.js smoke

perf-load:
	@echo "Running load performance test..."
	node perf/scripts/run-perf.js load

perf-smoke-baseline:
	@echo "Running smoke test and comparing with baseline..."
	node perf/scripts/run-perf.js smoke --baseline

perf-load-baseline:
	@echo "Running load test and comparing with baseline..."
	node perf/scripts/run-perf.js load --baseline

# Run performance tests against specific API URL
perf-smoke-api:
	@echo "Running smoke test against specific API URL..."
	cd perf/k6 && k6 run -e API_URL=$(API_URL) smoke.js

perf-load-api:
	@echo "Running load test against specific API URL..."
	cd perf/k6 && k6 run -e API_URL=$(API_URL) load.js
