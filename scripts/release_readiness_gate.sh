#!/bin/bash
# Release readiness gate script
# Validates that all prerequisites are met before proceeding with a release

set -e

echo "Checking release readiness..."
ERRORS=0

# Check required environment variables
required_envs=("RENDER_API_KEY" "VERCEL_TOKEN" "VERCEL_PROJECT_ID" "VERCEL_ORG_ID")
for env in "${required_envs[@]}"; do
    if [ -z "${!env}" ]; then
        echo "❌ $env is not set"
        ERRORS=$((ERRORS+1))
    else
        echo "✅ $env is set"
    fi
done

# Check if all tests are passing
echo "Running backend tests..."
cd "$(dirname "$0")/../backend"
if python -m pytest -xvs; then
    echo "✅ Backend tests passed"
else
    echo "❌ Backend tests failed"
    ERRORS=$((ERRORS+1))
fi

echo "Running frontend tests..."
cd "$(dirname "$0")/../frontend"
if npm test; then
    echo "✅ Frontend tests passed"
else
    echo "❌ Frontend tests failed"
    ERRORS=$((ERRORS+1))
fi

# Check if database migrations are ready
cd "$(dirname "$0")/../backend"
if python migrate.py check; then
    echo "✅ Database migrations are ready"
else
    echo "❌ Database migrations are not ready"
    ERRORS=$((ERRORS+1))
fi

# Check if release branch follows naming convention
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" =~ ^release/[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "✅ Release branch naming convention is correct: $CURRENT_BRANCH"
else
    echo "❌ Release branch naming convention is incorrect: $CURRENT_BRANCH"
    echo "   Expected format: release/x.y.z"
    ERRORS=$((ERRORS+1))
fi

# Final gate decision
if [ $ERRORS -eq 0 ]; then
    echo "==================================="
    echo "✅ Release readiness check passed! ✅"
    echo "==================================="
    exit 0
else
    echo "======================================="
    echo "❌ Release readiness check failed! ❌"
    echo "Total errors: $ERRORS"
    echo "Please fix the issues before proceeding."
    echo "======================================="
    exit 1
fi
