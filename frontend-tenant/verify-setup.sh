#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Asset Anchor Setup Verification ===${NC}\n"

# 1. Check Backend
echo -e "${BLUE}Step 1: Checking backend server...${NC}"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5050/api/health 2>/dev/null || echo "000")

if [ "$BACKEND_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Backend is running on port 5050${NC}"
else
  echo -e "${RED}✗ Backend is not running${NC}"
  echo -e "${YELLOW}   Running backend now...${NC}"
  echo -e "${YELLOW}   Starting backend in a new terminal window${NC}"
  osascript -e 'tell app "Terminal" to do script "cd /Users/mjoyner/Property/backend && python3 run.py"'
  echo -e "${YELLOW}   Waiting for backend to start (10 seconds)...${NC}"
  sleep 10
  
  # Check again
  BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5050/api/health 2>/dev/null || echo "000")
  if [ "$BACKEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Backend successfully started${NC}"
  else
    echo -e "${RED}✗ Backend could not be started automatically. Please start it manually:${NC}"
    echo -e "     cd /Users/mjoyner/Property/backend && python3 run.py"
  fi
fi

# 2. Check Frontend Requirements
echo -e "\n${BLUE}Step 2: Checking frontend requirements...${NC}"
cd /Users/mjoyner/Property/frontend

# Check if package.json exists
if [ -f "package.json" ]; then
  echo -e "${GREEN}✓ package.json found${NC}"
else
  echo -e "${RED}✗ package.json not found in frontend directory${NC}"
  exit 1
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
  echo -e "${GREEN}✓ node_modules found${NC}"
else
  echo -e "${YELLOW}! node_modules not found, need to run npm install${NC}"
  echo -e "${YELLOW}  This might take a few minutes...${NC}"
  npm install
  if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Dependencies successfully installed${NC}"
  else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
  fi
fi

# 3. Check Tenant Data
echo -e "\n${BLUE}Step 3: Checking tenant data...${NC}"
if [ "$BACKEND_STATUS" = "200" ]; then
  python3 -c "
import sqlite3, json, sys
try:
  conn = sqlite3.connect('/Users/mjoyner/Property/backend/app.db')
  cursor = conn.cursor()
  
  # Check tenant user
  cursor.execute(\"SELECT COUNT(*) FROM user WHERE email='tenant@example.com'\")
  tenant_exists = cursor.fetchone()[0]
  
  # Check maintenance requests
  cursor.execute(\"SELECT COUNT(*) FROM maintenance_requests WHERE tenant_id = (SELECT id FROM user WHERE email='tenant@example.com')\")
  maint_count = cursor.fetchone()[0]
  
  print(json.dumps({'tenant_exists': tenant_exists, 'maintenance_count': maint_count}))
  conn.close()
except Exception as e:
  print(json.dumps({'error': str(e)}))
  sys.exit(1)
" > /tmp/tenant_data_check.json

  TENANT_DATA=$(cat /tmp/tenant_data_check.json)
  TENANT_EXISTS=$(echo $TENANT_DATA | python3 -c "import sys, json; print(json.load(sys.stdin).get('tenant_exists', 0))")
  MAINT_COUNT=$(echo $TENANT_DATA | python3 -c "import sys, json; print(json.load(sys.stdin).get('maintenance_count', 0))")
  
  if [ "$TENANT_EXISTS" -gt "0" ]; then
    echo -e "${GREEN}✓ Tenant user exists${NC}"
  else
    echo -e "${RED}✗ Tenant user does not exist${NC}"
    echo -e "${YELLOW}  Setting up tenant data...${NC}"
    python3 /Users/mjoyner/Property/frontend-tenant/setup-tenant-data.py
  fi
  
  if [ "$MAINT_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✓ $MAINT_COUNT maintenance request(s) found for tenant${NC}"
  else
    echo -e "${RED}✗ No maintenance requests found for tenant${NC}"
    echo -e "${YELLOW}  Setting up tenant data...${NC}"
    python3 /Users/mjoyner/Property/frontend-tenant/setup-tenant-data.py
  fi
else
  echo -e "${YELLOW}! Cannot check tenant data because backend is not running${NC}"
fi

# 4. Summary and next steps
echo -e "\n${YELLOW}=== Setup Verification Complete ===${NC}"
echo -e "\n${BLUE}Next Steps:${NC}"
echo -e "1. Start the tenant view:"
echo -e "   ${GREEN}cd /Users/mjoyner/Property/frontend-tenant && ./start-tenant-view.sh${NC}"
echo -e "2. Access the tenant portal in your browser:"
echo -e "   ${GREEN}http://localhost:3001${NC}"
echo -e "3. Login with:"
echo -e "   ${GREEN}Email: tenant@example.com${NC}"
echo -e "   ${GREEN}Password: admin123${NC}"
echo -e "\n${YELLOW}Note: If the tenant view fails to start, check if another React app${NC}"
echo -e "${YELLOW}      is already running on port 3001 and stop it first.${NC}"
