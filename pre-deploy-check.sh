#!/bin/bash
# pre-deploy-check.sh
# Script to check if the application is ready for deployment

set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "========================================================"
echo "          Asset Anchor Deployment Readiness             "
echo "========================================================"
echo ""

# Check if required tools are installed
echo "Checking required tools..."

REQUIRED_TOOLS=("python3" "pip" "node" "npm" "docker" "docker-compose" "git")
MISSING_TOOLS=()

for tool in "${REQUIRED_TOOLS[@]}"; do
  if ! command -v "$tool" &> /dev/null; then
    MISSING_TOOLS+=("$tool")
  fi
done

if [ ${#MISSING_TOOLS[@]} -eq 0 ]; then
  echo -e "${GREEN}✓ All required tools are installed${NC}"
else
  echo -e "${RED}✗ Missing required tools: ${MISSING_TOOLS[*]}${NC}"
  echo -e "${YELLOW}Please install the missing tools before proceeding${NC}"
fi

# Check Python version
echo ""
echo "Checking Python version..."
PY_VERSION=$(python3 --version | cut -d" " -f2)
PY_VERSION_MAJOR=$(echo "$PY_VERSION" | cut -d. -f1)
PY_VERSION_MINOR=$(echo "$PY_VERSION" | cut -d. -f2)

if [ "$PY_VERSION_MAJOR" -ge 3 ] && [ "$PY_VERSION_MINOR" -ge 10 ]; then
  echo -e "${GREEN}✓ Python version $PY_VERSION is compatible${NC}"
else
  echo -e "${RED}✗ Python version $PY_VERSION may not be compatible${NC}"
  echo -e "${YELLOW}Recommended: Python 3.10 or higher${NC}"
fi

# Check Node.js version
echo ""
echo "Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d"v" -f2)
NODE_VERSION_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)

if [ "$NODE_VERSION_MAJOR" -ge 18 ]; then
  echo -e "${GREEN}✓ Node.js version $NODE_VERSION is compatible${NC}"
else
  echo -e "${RED}✗ Node.js version $NODE_VERSION may not be compatible${NC}"
  echo -e "${YELLOW}Recommended: Node.js 18 or higher${NC}"
fi

# Check if .env files exist
echo ""
echo "Checking environment files..."

if [ -f "./backend/.env" ]; then
  echo -e "${GREEN}✓ Backend .env file exists${NC}"
else
  echo -e "${RED}✗ Backend .env file is missing${NC}"
  echo -e "${YELLOW}Create a .env file in the backend directory${NC}"
fi

if [ -f "./backend/.env.production" ]; then
  echo -e "${GREEN}✓ Backend production environment file exists${NC}"
else
  echo -e "${YELLOW}! Backend .env.production file is missing (optional but recommended)${NC}"
fi

# Check for sensitive information in committed files
echo ""
echo "Checking for sensitive information in committed files..."

# Create a temporary file for grep results
TEMP_FILE=$(mktemp)

# Look for potentially sensitive information
grep -r -E "SECRET_KEY|PASSWORD|API_KEY|TOKEN" --include="*.py" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --exclude-dir="node_modules" --exclude-dir="venv" . > "$TEMP_FILE"

# Count the results
COUNT=$(wc -l < "$TEMP_FILE")

if [ "$COUNT" -eq 0 ]; then
  echo -e "${GREEN}✓ No hardcoded credentials detected${NC}"
else
  echo -e "${RED}✗ Potentially hardcoded credentials detected in $COUNT places${NC}"
  echo -e "${YELLOW}First few occurrences:${NC}"
  head -n 5 "$TEMP_FILE"
  echo -e "${YELLOW}(showing 5 of $COUNT)${NC}"
  echo -e "${YELLOW}Please review and remove hardcoded credentials${NC}"
fi

# Clean up temp file
rm "$TEMP_FILE"

# Run backend tests
echo ""
echo "Running backend tests..."

cd backend || exit 1
if python -m pytest -xvs; then
  echo -e "${GREEN}✓ Backend tests passed${NC}"
else
  echo -e "${RED}✗ Backend tests failed${NC}"
  echo -e "${YELLOW}Fix failing tests before deployment${NC}"
fi
cd ..

# Check for uncommitted changes
echo ""
echo "Checking for uncommitted changes..."

if git diff --quiet; then
  echo -e "${GREEN}✓ No uncommitted changes${NC}"
else
  echo -e "${YELLOW}! Uncommitted changes detected${NC}"
  echo -e "${YELLOW}Consider committing or stashing changes before deployment${NC}"
fi

# Check for linting issues in backend
echo ""
echo "Checking backend code quality..."

cd backend || exit 1
if command -v flake8 &> /dev/null; then
  FLAKE_ISSUES=$(flake8 src --count --select=E9,F63,F7,F82 --show-source --statistics | wc -l)
  if [ "$FLAKE_ISSUES" -eq 0 ]; then
    echo -e "${GREEN}✓ No critical Python issues detected${NC}"
  else
    echo -e "${YELLOW}! $FLAKE_ISSUES critical Python issues detected${NC}"
    echo -e "${YELLOW}Run 'flake8 src' for details${NC}"
  fi
else
  echo -e "${YELLOW}! flake8 not installed, skipping backend linting${NC}"
  echo -e "${YELLOW}Install with: pip install flake8${NC}"
fi
cd ..

# Check docker configuration
echo ""
echo "Checking Docker configuration..."

if [ -f "./docker-compose.yml" ]; then
  echo -e "${GREEN}✓ docker-compose.yml exists${NC}"
else
  echo -e "${RED}✗ docker-compose.yml is missing${NC}"
fi

if [ -f "./backend/Dockerfile" ]; then
  echo -e "${GREEN}✓ Backend Dockerfile exists${NC}"
else
  echo -e "${RED}✗ Backend Dockerfile is missing${NC}"
fi

if [ -f "./frontend/Dockerfile" ]; then
  echo -e "${GREEN}✓ Frontend Dockerfile exists${NC}"
else
  echo -e "${RED}✗ Frontend Dockerfile is missing${NC}"
fi

# Final summary
echo ""
echo "========================================================"
echo "                  Deployment Readiness                 "
echo "========================================================"

# Calculate readiness score based on the checks above
SCORE=0
MAX_SCORE=10

# Add your scoring logic here based on the checks above
# For example:
if command -v python3 &> /dev/null; then SCORE=$((SCORE+1)); fi
if [ -f "./backend/.env" ]; then SCORE=$((SCORE+1)); fi
if [ -f "./docker-compose.yml" ] && [ -f "./backend/Dockerfile" ] && [ -f "./frontend/Dockerfile" ]; then SCORE=$((SCORE+1)); fi
if [ -f "./DEPLOYMENT.md" ]; then SCORE=$((SCORE+1)); fi
if [ -f "./DEPLOYMENT_CHECKLIST.md" ]; then SCORE=$((SCORE+1)); fi
if [ "$COUNT" -eq 0 ]; then SCORE=$((SCORE+1)); fi
if [ "$PY_VERSION_MAJOR" -ge 3 ] && [ "$PY_VERSION_MINOR" -ge 10 ]; then SCORE=$((SCORE+1)); fi
if [ "$NODE_VERSION_MAJOR" -ge 18 ]; then SCORE=$((SCORE+1)); fi
if [ ${#MISSING_TOOLS[@]} -eq 0 ]; then SCORE=$((SCORE+1)); fi
if [ -f "./render.yaml" ]; then SCORE=$((SCORE+1)); fi

PERCENTAGE=$((SCORE * 100 / MAX_SCORE))

echo "Deployment readiness score: $PERCENTAGE% ($SCORE/$MAX_SCORE)"
echo ""

if [ "$PERCENTAGE" -ge 80 ]; then
  echo -e "${GREEN}✓ Application appears ready for deployment${NC}"
elif [ "$PERCENTAGE" -ge 50 ]; then
  echo -e "${YELLOW}! Application may be ready for deployment, but review warnings${NC}"
else
  echo -e "${RED}✗ Application is not ready for deployment${NC}"
  echo -e "${YELLOW}Address the issues above before proceeding${NC}"
fi

echo ""
echo "For detailed deployment instructions, see:"
echo "- DEPLOYMENT.md"
echo "- DEPLOYMENT_CHECKLIST.md"
echo "- QUICK_DEPLOY.md"
echo ""
echo "========================================================"
