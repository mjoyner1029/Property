.PHONY: test test-verbose test-coverage lint format migrate init-db list-routes check-security run dev-server clean perf-smoke perf-load perf-smoke-api perf-load-api

test:
	pytest

test-verbose:
	pytest -v

test-coverage:
	pytest --cov=src --cov-report=term --cov-report=xml --cov-report=html

lint:
	flake8 .

format:
	black .

migrate:
	flask db upgrade

init-db:
	python init_db.py

list-routes:
	FLASK_APP=src.app flask routes

check-security:
	pip install safety
	safety check

run:
	python run.py

dev-server:
	FLASK_APP=src.app FLASK_ENV=development flask run --host=0.0.0.0 --port=5050

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .coverage htmlcov coverage.xml

perf-smoke:
	k6 run perf/k6/smoke.js

perf-load:
	k6 run perf/k6/load.js

# Run perf test against a specific API URL
# Usage: make perf-smoke-api API_URL=https://api.assetanchor.io
perf-smoke-api:
	k6 run -e API_URL=$(API_URL) perf/k6/smoke.js

perf-load-api:
	k6 run -e API_URL=$(API_URL) perf/k6/load.js
