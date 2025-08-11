#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\033[1;33m=== Deploying Asset Anchor Tenant View ===\033[0m"

# Step 1: Open the helper page
echo -e "\n\033[1;33mStep 1: Opening tenant login helper page in Chrome...\033[0m"
open -a "Google Chrome" /Users/mjoyner/Property/frontend-tenant/tenant-login.html
echo -e "\033[0;32m✓ Opened tenant login helper page\033[0m"

# Step 2: Start backend if needed
echo -e "\n\033[1;33mStep 2: Do you need to start the backend server? (y/n)\033[0m"
read -p "Response: " start_backend

if [[ $start_backend == "y" || $start_backend == "Y" ]]; then
    echo -e "\n\033[1;33mStarting backend server in a new terminal window...\033[0m"
    osascript -e 'tell app "Terminal" to do script "cd /Users/mjoyner/Property/backend && python3 run.py"'
    echo -e "\033[0;32m✓ Backend server starting in a new terminal window\033[0m"
    echo -e "\033[1;33mWaiting for backend to initialize (5 seconds)...\033[0m"
    sleep 5
fi

# Step 3: Start tenant frontend
echo -e "\n\033[1;33mStep 3: Starting tenant frontend on port 3001...\033[0m"
echo -e "\033[1;33mStarting tenant frontend in a new terminal window...\033[0m"
osascript -e 'tell app "Terminal" to do script "cd /Users/mjoyner/Property/frontend-tenant && ./start-tenant-view.sh"'
echo -e "\033[0;32m✓ Tenant frontend starting in a new terminal window\033[0m"

echo -e "\n\033[0;32m✓ Deployment initiated! \033[0m"
echo -e "\033[0;32m• The tenant portal will be available at: http://localhost:3001\033[0m"
echo -e "\033[0;32m• Login with: tenant@example.com / admin123\033[0m"
echo -e "\n\033[1;33mNOTE: It may take a minute for the React development server to start\033[0m"
