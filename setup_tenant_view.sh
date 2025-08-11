#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

TENANT_PORT=3001
echo -e "${YELLOW}=== Asset Anchor Tenant View Deployment ===${NC}\n"

# Step 1: Ensure we have a tenant user in the database
echo -e "${YELLOW}Step 1: Ensuring tenant user exists in database${NC}"

sqlite3 /Users/mjoyner/Property/backend/app.db << EOF
INSERT OR IGNORE INTO user (
    email, 
    password, 
    name, 
    full_name,
    role, 
    is_verified, 
    is_active
) VALUES (
    'tenant@example.com', 
    'pbkdf2:sha256:600000$1PQMyyekstcIBhku$90496abc08a8e991150d611fe0f3df7f047def854663dbc1f7c286c2c5692547', -- admin123
    'Tenant', 
    'Test Tenant',
    'tenant', 
    1, 
    1
);
EOF

echo -e "${GREEN}✓ Tenant user created or already exists${NC}"

# Step 2: Create a tenant-specific frontend configuration
echo -e "\n${YELLOW}Step 2: Creating tenant-specific configuration${NC}"

# Create tenant-specific .env file
mkdir -p /Users/mjoyner/Property/frontend-tenant
cat > /Users/mjoyner/Property/frontend-tenant/.env << EOF
PORT=$TENANT_PORT
REACT_APP_API_URL=http://localhost:5050/api
REACT_APP_DEFAULT_PORTAL=tenant
EOF

echo -e "${GREEN}✓ Created tenant-specific environment configuration${NC}"

# Create a script to start the tenant frontend
cat > /Users/mjoyner/Property/frontend-tenant/start-tenant-view.sh << EOF
#!/bin/bash
cd /Users/mjoyner/Property/frontend
export PORT=$TENANT_PORT
export REACT_APP_API_URL=http://localhost:5050/api
export REACT_APP_DEFAULT_PORTAL=tenant
npm start
EOF

chmod +x /Users/mjoyner/Property/frontend-tenant/start-tenant-view.sh
echo -e "${GREEN}✓ Created tenant startup script${NC}"

# Create a tenant login helper page
cat > /Users/mjoyner/Property/frontend-tenant/tenant-login.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asset Anchor - Tenant Login</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 50px auto;
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 15px rgba(0,0,0,0.1);
            text-align: center;
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 20px;
        }
        .btn {
            display: inline-block;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 5px;
            margin-top: 20px;
            font-weight: bold;
        }
        .btn:hover {
            background-color: #2980b9;
        }
        .credentials {
            background-color: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
        }
        .logo {
            max-width: 150px;
            margin-bottom: 20px;
        }
        .steps {
            text-align: left;
            margin: 20px 0;
        }
        .steps ol {
            padding-left: 20px;
        }
        .steps li {
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Asset Anchor Tenant Portal</h1>
        <p>This page will help you log into the tenant view of Asset Anchor.</p>
        
        <div class="steps">
            <h2>Instructions:</h2>
            <ol>
                <li>Make sure the backend server is running <code>(python3 run.py)</code></li>
                <li>Run the tenant-specific frontend: <code>./start-tenant-view.sh</code></li>
                <li>Navigate to <a href="http://localhost:$TENANT_PORT" target="_blank">http://localhost:$TENANT_PORT</a></li>
                <li>Use the credentials below to log in</li>
            </ol>
        </div>
        
        <div class="credentials">
            <h3>Tenant Login Credentials:</h3>
            <p><strong>Email:</strong> tenant@example.com</p>
            <p><strong>Password:</strong> admin123</p>
            <p><strong>Portal:</strong> tenant</p>
        </div>
        
        <a href="http://localhost:$TENANT_PORT" class="btn" target="_blank">Go to Tenant Portal</a>
    </div>
</body>
</html>
EOF

echo -e "${GREEN}✓ Created tenant login helper page${NC}"

# Step 3: Create tenant test data if needed
echo -e "\n${YELLOW}Step 3: Creating tenant test data if needed${NC}"

cat > /Users/mjoyner/Property/frontend-tenant/setup-tenant-data.py << EOF
#!/usr/bin/env python3
import sqlite3
import datetime

def create_tenant_data():
    print("Creating tenant test data for Asset Anchor...")
    
    conn = sqlite3.connect('/Users/mjoyner/Property/backend/app.db')
    cursor = conn.cursor()
    
    try:
        # 1. Get tenant ID
        cursor.execute("SELECT id FROM user WHERE email='tenant@example.com'")
        result = cursor.fetchone()
        tenant_id = result[0] if result else None
        
        if not tenant_id:
            print("Tenant user not found!")
            return False
            
        print(f"Found tenant with ID: {tenant_id}")
        
        # 2. Check if we have a property
        cursor.execute("SELECT id FROM properties LIMIT 1")
        result = cursor.fetchone()
        property_id = result[0] if result else None
        
        if not property_id:
            print("Creating a test property...")
            # Create a test property
            cursor.execute("""
            INSERT INTO properties (
                landlord_id, name, address, city, state, zip_code,
                property_type, bedrooms, bathrooms, square_footage,
                year_built, description, status
            ) VALUES (
                1, 'Tenant Test Property', '456 Tenant Ave', 'Anytown', 'CA', '12345',
                'apartment', 2, 1, 1000, 2020,
                'A test property for tenant view testing',
                'available'
            )
            """)
            property_id = cursor.lastrowid
            print(f"Created property with ID: {property_id}")
        else:
            print(f"Using existing property with ID: {property_id}")
        
        # 3. Associate tenant with property
        cursor.execute("SELECT COUNT(*) FROM tenant_properties WHERE tenant_id = ?", (tenant_id,))
        tenant_property_count = cursor.fetchone()[0]
        
        if tenant_property_count == 0:
            print("Creating tenant-property association...")
            cursor.execute("""
            INSERT INTO tenant_properties (
                tenant_id, property_id, rent_amount, status, start_date
            ) VALUES (
                ?, ?, 1200, 'active', ?
            )
            """, (tenant_id, property_id, datetime.datetime.now().isoformat()))
            print("Created tenant-property association")
        else:
            print("Tenant-property association already exists")
            
        # 4. Create some maintenance requests for this tenant
        cursor.execute("SELECT COUNT(*) FROM maintenance_requests WHERE tenant_id = ?", (tenant_id,))
        request_count = cursor.fetchone()[0]
        
        if request_count < 2:
            print("Creating sample maintenance requests for tenant...")
            
            # Plumbing request
            cursor.execute("""
            INSERT INTO maintenance_requests (
                property_id, tenant_id, title, description,
                maintenance_type, priority, status
            ) VALUES (
                ?, ?, 'Leaking Faucet', 'The kitchen faucet is dripping constantly.',
                'plumbing', 'medium', 'open'
            )
            """, (property_id, tenant_id))
            
            # Electrical request
            cursor.execute("""
            INSERT INTO maintenance_requests (
                property_id, tenant_id, title, description,
                maintenance_type, priority, status
            ) VALUES (
                ?, ?, 'Power Outlet Not Working', 'The outlet in the living room doesn\\'t work.',
                'electrical', 'high', 'open'
            )
            """, (property_id, tenant_id))
            
            print("Created sample maintenance requests")
        else:
            print(f"Tenant already has {request_count} maintenance requests")
        
        conn.commit()
        print("Tenant data setup completed successfully")
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"Error creating tenant data: {str(e)}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    create_tenant_data()
EOF

chmod +x /Users/mjoyner/Property/frontend-tenant/setup-tenant-data.py
echo -e "${GREEN}✓ Created tenant data setup script${NC}"

# Run the tenant data setup script
echo -e "\n${YELLOW}Running tenant data setup script...${NC}"
python3 /Users/mjoyner/Property/frontend-tenant/setup-tenant-data.py
echo -e "${GREEN}✓ Tenant data setup complete${NC}"

# Create a master deploy script
cat > /Users/mjoyner/Property/frontend-tenant/deploy-tenant-view.sh << EOF
#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Deploying Asset Anchor Tenant View ===${NC}"

# Step 1: Open the helper page
echo -e "\n${YELLOW}Step 1: Opening tenant login helper page in Chrome...${NC}"
open -a "Google Chrome" /Users/mjoyner/Property/frontend-tenant/tenant-login.html
echo -e "${GREEN}✓ Opened tenant login helper page${NC}"

# Step 2: Start backend if needed
echo -e "\n${YELLOW}Step 2: Do you need to start the backend server? (y/n)${NC}"
read -p "Response: " start_backend

if [[ \$start_backend == "y" || \$start_backend == "Y" ]]; then
    echo -e "\n${YELLOW}Starting backend server in a new terminal window...${NC}"
    osascript -e 'tell app "Terminal" to do script "cd /Users/mjoyner/Property/backend && python3 run.py"'
    echo -e "${GREEN}✓ Backend server starting in a new terminal window${NC}"
    echo -e "${YELLOW}Waiting for backend to initialize (5 seconds)...${NC}"
    sleep 5
fi

# Step 3: Start tenant frontend
echo -e "\n${YELLOW}Step 3: Starting tenant frontend on port $TENANT_PORT...${NC}"
echo -e "${YELLOW}Starting tenant frontend in a new terminal window...${NC}"
osascript -e 'tell app "Terminal" to do script "cd /Users/mjoyner/Property/frontend-tenant && ./start-tenant-view.sh"'
echo -e "${GREEN}✓ Tenant frontend starting in a new terminal window${NC}"

echo -e "\n${GREEN}✓ Deployment initiated! ${NC}"
echo -e "${GREEN}• The tenant portal will be available at: http://localhost:$TENANT_PORT${NC}"
echo -e "${GREEN}• Login with: tenant@example.com / admin123${NC}"
echo -e "\n${YELLOW}NOTE: It may take a minute for the React development server to start${NC}"
EOF

chmod +x /Users/mjoyner/Property/frontend-tenant/deploy-tenant-view.sh
echo -e "${GREEN}✓ Created main deployment script${NC}"

# Step 4: Show final instructions
echo -e "\n${BLUE}=== TENANT VIEW DEPLOYMENT INSTRUCTIONS ===${NC}"
echo -e "${YELLOW}1. To deploy the tenant view:${NC}"
echo -e "   Run the following command:"
echo -e "   ${GREEN}cd /Users/mjoyner/Property/frontend-tenant && ./deploy-tenant-view.sh${NC}"
echo -e "\n${YELLOW}2. The deployment script will:${NC}"
echo -e "   • Open the tenant login helper page in Chrome"
echo -e "   • Ask if you want to start the backend server"
echo -e "   • Start the tenant frontend on port $TENANT_PORT"
echo -e "\n${YELLOW}3. Once deployed:${NC}"
echo -e "   • Access the tenant view at: ${GREEN}http://localhost:$TENANT_PORT${NC}"
echo -e "   • Login with: ${GREEN}tenant@example.com / admin123${NC}"
echo -e "   • Use the tenant portal to create maintenance requests"

echo -e "\n${GREEN}Setup complete! Follow the instructions above to deploy the tenant view.${NC}"

# Open the helper page in Chrome
echo -e "\n${YELLOW}Opening tenant login helper page in Chrome...${NC}"
open -a "Google Chrome" /Users/mjoyner/Property/frontend-tenant/tenant-login.html 2>/dev/null || echo -e "${RED}Couldn't open Chrome automatically${NC}"
