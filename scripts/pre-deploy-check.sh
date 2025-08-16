#!/bin/bash
# pre-deploy-check.sh
# Comprehensive pre-deployment validation script for Asset Anchor

set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================================"
echo "          Asset Anchor Pre-Deployment Check             "
echo "========================================================"
echo ""

# Initialize counters for summary
TOTAL_CHECKS=0
PASSED_CHECKS=0
WARNING_CHECKS=0
FAILED_CHECKS=0

function check_pass {
    echo -e "${GREEN}✓ $1${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS+1))
    TOTAL_CHECKS=$((TOTAL_CHECKS+1))
}

function check_warn {
    echo -e "${YELLOW}! $1${NC}"
    WARNING_CHECKS=$((WARNING_CHECKS+1))
    TOTAL_CHECKS=$((TOTAL_CHECKS+1))
}

function check_fail {
    echo -e "${RED}✗ $1${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS+1))
    TOTAL_CHECKS=$((TOTAL_CHECKS+1))
}

function section_title {
    echo ""
    echo -e "${BLUE}== $1 ==${NC}"
}

# Check required tools
section_title "Required Tools"

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1)
    check_pass "Python installed: ${PYTHON_VERSION}"
else
    check_fail "Python not installed"
fi

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version 2>&1)
    check_pass "Node.js installed: ${NODE_VERSION}"
else
    check_fail "Node.js not installed"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version 2>&1)
    check_pass "npm installed: ${NPM_VERSION}"
else
    check_fail "npm not installed"
fi

# Check Git
if command -v git &> /dev/null; then
    check_pass "Git installed"
    # Check if on main branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [[ "$CURRENT_BRANCH" == "main" ]]; then
        check_pass "On main branch"
    else
        check_warn "Not on main branch (current: ${CURRENT_BRANCH})"
    fi
    
    # Check for uncommitted changes
    if [[ -z $(git status -s) ]]; then
        check_pass "No uncommitted changes"
    else
        check_warn "Uncommitted changes detected"
        echo "Run git status to see changes"
    fi
else
    check_fail "Git not installed"
fi

# Check environment files
section_title "Environment Configuration"

if [[ -f "./backend/.env" ]]; then
    check_pass "Backend .env file exists"
else
    check_warn "Backend .env file missing"
fi

if [[ -f "./frontend/.env" ]]; then
    check_pass "Frontend .env file exists"
else
    check_warn "Frontend .env file missing"
fi

# Check backend
section_title "Backend Checks"

cd backend

# Check Python dependencies
if [[ -f "requirements.txt" ]]; then
    check_pass "Backend requirements.txt exists"
    
    # Check for installed packages
    if command -v pip &> /dev/null; then
        MISSING_PACKAGES=0
        echo "Checking critical packages..."
        CRITICAL_PACKAGES=("flask" "flask-sqlalchemy" "flask-migrate" "psycopg2-binary" "gunicorn")
        
        for package in "${CRITICAL_PACKAGES[@]}"; do
            if pip list | grep -i "$package" &> /dev/null; then
                echo -e "  ${GREEN}✓${NC} $package"
            else
                echo -e "  ${RED}✗${NC} $package"
                MISSING_PACKAGES=$((MISSING_PACKAGES+1))
            fi
        done
        
        if [[ $MISSING_PACKAGES -eq 0 ]]; then
            check_pass "All critical packages installed"
        else
            check_warn "$MISSING_PACKAGES critical packages missing"
            echo "Run: pip install -r requirements.txt"
        fi
    fi
else
    check_fail "Backend requirements.txt missing"
fi

# Check database migrations
if [[ -d "migrations" ]]; then
    check_pass "Migrations directory exists"
    
    # Check for pending migrations
    if command -v flask &> /dev/null && [[ -f ".env" ]]; then
        source .env
        export FLASK_APP=wsgi.py
        
        if flask db current &> /dev/null; then
            if [[ -n $(flask db check) ]]; then
                check_warn "Pending migrations detected"
                echo "Run: flask db upgrade"
            else
                check_pass "No pending migrations"
            fi
        else
            check_warn "Could not check migrations status"
        fi
    else
        check_warn "Flask command not available, could not check migrations"
    fi
else
    check_warn "Migrations directory missing"
fi

# Check database connection
if command -v python3 &> /dev/null && [[ -f ".env" ]]; then
    echo "Checking database connection..."
    if python3 -c "from src.app import create_app; app = create_app(); from src.extensions import db; with app.app_context(): db.engine.connect()" &> /dev/null; then
        check_pass "Database connection successful"
    else
        check_fail "Database connection failed"
    fi
fi

cd ..

# Check frontend
section_title "Frontend Checks"

cd frontend

# Check Node dependencies
if [[ -f "package.json" ]]; then
    check_pass "Frontend package.json exists"
    
    if [[ -d "node_modules" ]]; then
        check_pass "node_modules directory exists"
    else
        check_warn "node_modules missing, run: npm install"
    fi
    
    # Check for build script
    if grep -q "\"build\"" package.json; then
        check_pass "Build script found in package.json"
    else
        check_fail "Build script not found in package.json"
    fi
    
    # Check for test script
    if grep -q "\"test\"" package.json; then
        check_pass "Test script found in package.json"
    else
        check_warn "Test script not found in package.json"
    fi
else
    check_fail "Frontend package.json missing"
fi

# Run npm audit
if command -v npm &> /dev/null; then
    echo "Running npm audit..."
    if npm audit --audit-level=high &> /dev/null; then
        check_pass "No high/critical vulnerabilities found"
    else
        check_warn "High/critical vulnerabilities found"
        echo "Run: npm audit fix"
    fi
fi

cd ..

# Check deployment files
section_title "Deployment Configuration"

if [[ -f "render.yaml" ]]; then
    check_pass "render.yaml exists"
else
    check_warn "render.yaml missing"
fi

if [[ -f "backend/Dockerfile" ]]; then
    check_pass "Backend Dockerfile exists"
else
    check_warn "Backend Dockerfile missing"
fi

if [[ -f "frontend/Dockerfile" ]]; then
    check_pass "Frontend Dockerfile exists"
else
    check_warn "Frontend Dockerfile missing"
fi

# Check GitHub Actions workflows
if [[ -d ".github/workflows" ]]; then
    check_pass "GitHub Actions workflows directory exists"
    
    WORKFLOWS_COUNT=$(find .github/workflows -name "*.yml" | wc -l)
    if [[ $WORKFLOWS_COUNT -gt 0 ]]; then
        check_pass "Found $WORKFLOWS_COUNT workflow files"
    else
        check_warn "No workflow files found"
    fi
else
    check_warn "GitHub Actions workflows directory missing"
fi

# Summary
section_title "Pre-Deployment Summary"

echo "Total checks: ${TOTAL_CHECKS}"
echo -e "Passed: ${GREEN}${PASSED_CHECKS}${NC}"
echo -e "Warnings: ${YELLOW}${WARNING_CHECKS}${NC}"
echo -e "Failed: ${RED}${FAILED_CHECKS}${NC}"

PASS_PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo ""
echo "Overall readiness: ${PASS_PERCENTAGE}%"

if [[ $FAILED_CHECKS -gt 0 ]]; then
    echo -e "${RED}✗ Critical issues found. Fix before deploying.${NC}"
    exit 1
elif [[ $WARNING_CHECKS -gt 0 ]]; then
    echo -e "${YELLOW}! Warnings found. Review before deploying.${NC}"
    exit 0
else
    echo -e "${GREEN}✓ All checks passed. Ready to deploy!${NC}"
    exit 0
fi
