#!/bin/bash
# Enhanced tenant view startup script

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Starting Asset Anchor Tenant View ===${NC}"

# 1. Navigate to frontend directory
echo -e "${BLUE}Step 1: Navigating to frontend directory...${NC}"
cd /Users/mjoyner/Property/frontend
echo -e "${GREEN}✓ Changed directory to $(pwd)${NC}"

# 2. Set environment variables for tenant view
echo -e "${BLUE}Step 2: Setting environment variables...${NC}"
export PORT=3001
export REACT_APP_API_URL=http://localhost:5050/api
export REACT_APP_DEFAULT_PORTAL=tenant
echo -e "${GREEN}✓ Environment variables set:${NC}"
echo -e "  - PORT=${PORT}"
echo -e "  - REACT_APP_API_URL=${REACT_APP_API_URL}"
echo -e "  - REACT_APP_DEFAULT_PORTAL=${REACT_APP_DEFAULT_PORTAL}"

# 3. Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo -e "${BLUE}Step 3: Installing dependencies (this might take a few minutes)...${NC}"
  npm install
  echo -e "${GREEN}✓ Dependencies installed${NC}"
else
  echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# 4. Start the React development server
echo -e "${BLUE}Step 4: Starting React development server on port ${PORT}...${NC}"
echo -e "${YELLOW}NOTE: The server might take a minute to start. Please be patient.${NC}"
echo -e "${YELLOW}You can access the tenant view at: http://localhost:${PORT}${NC}"
echo -e "${YELLOW}Login with: tenant@example.com / admin123${NC}\n"

npm start
