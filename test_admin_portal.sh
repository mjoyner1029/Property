#!/bin/bash

# Test script for admin portal functionality

echo "🔧 Testing Admin Portal Functionality"
echo "=================================="
echo

# Test backend health
echo "1. Testing backend health..."
HEALTH_RESPONSE=$(curl -s http://localhost:5050/api/health)
if [[ $HEALTH_RESPONSE == *"ok\":true"* ]]; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding correctly"
    exit 1
fi

# Test admin login
echo "2. Testing admin login..."
ADMIN_LOGIN=$(curl -s -X POST http://localhost:5050/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com", "password":"Password123!"}')

if [[ $ADMIN_LOGIN == *"access_token"* ]]; then
    echo "✅ Admin login successful"
    
    # Extract token
    TOKEN=$(echo $ADMIN_LOGIN | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    
    # Test admin can access properties
    echo "3. Testing admin properties access..."
    PROPERTIES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5050/api/properties)
    
    if [[ $PROPERTIES_RESPONSE == *"properties"* ]]; then
        echo "✅ Admin can access properties endpoint"
    else
        echo "❌ Admin cannot access properties endpoint"
        echo "Response: $PROPERTIES_RESPONSE"
    fi
    
else
    echo "❌ Admin login failed"
    echo "Response: $ADMIN_LOGIN"
fi

# Test tenant login for comparison
echo "4. Testing tenant login..."
TENANT_LOGIN=$(curl -s -X POST http://localhost:5050/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"tenant@example.com", "password":"Password123!"}')

if [[ $TENANT_LOGIN == *"access_token"* ]]; then
    echo "✅ Tenant login successful"
else
    echo "❌ Tenant login failed"
fi

# Test landlord login for comparison
echo "5. Testing landlord login..."
LANDLORD_LOGIN=$(curl -s -X POST http://localhost:5050/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"landlord@example.com", "password":"Password123!"}')

if [[ $LANDLORD_LOGIN == *"access_token"* ]]; then
    echo "✅ Landlord login successful"
else
    echo "❌ Landlord login failed"
fi

echo
echo "🎉 All tests completed!"
echo
echo "📝 Admin Portal Features:"
echo "  - System Overview (/admin/overview)"
echo "  - User Management (/admin/users)"
echo "  - All Properties (/admin/properties)"
echo "  - Platform Analytics (/admin/analytics)"
echo "  - Support Center (/admin/support)"
echo "  - System Settings (/admin/settings)"
echo "  - Audit Logs (/admin/logs)"
echo
echo "🔐 Test Credentials:"
echo "  Admin:    admin@example.com / Password123!"
echo "  Landlord: landlord@example.com / Password123!"
echo "  Tenant:   tenant@example.com / Password123!"
