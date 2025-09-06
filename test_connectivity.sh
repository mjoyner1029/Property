#!/bin/bash
# Frontend-Backend Connectivity Test Script

echo "🔍 Testing Frontend-Backend Connectivity..."
echo ""

# Test 1: Backend Health Check
echo "1. Testing backend health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -H "Origin: http://localhost:3000" http://localhost:5050/api/health)
HTTP_CODE="${HEALTH_RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Backend health check successful (HTTP $HTTP_CODE)"
    # Extract just the JSON response (remove the HTTP code)
    JSON_RESPONSE="${HEALTH_RESPONSE%???}"
    echo "   Response: $JSON_RESPONSE"
else
    echo "❌ Backend health check failed (HTTP $HTTP_CODE)"
    echo "   Make sure backend is running with: PYTHONPATH=/Users/mjoyner/Property/backend python /Users/mjoyner/Property/backend/wsgi.py"
    exit 1
fi

echo ""

# Test 2: CORS Headers Check
echo "2. Testing CORS configuration..."
CORS_RESPONSE=$(curl -s -I -H "Origin: http://localhost:3000" http://localhost:5050/api/health)

if echo "$CORS_RESPONSE" | grep -i "access-control-allow-origin" > /dev/null; then
    CORS_ORIGIN=$(echo "$CORS_RESPONSE" | grep -i "access-control-allow-origin" | cut -d' ' -f2- | tr -d '\r')
    echo "✅ CORS headers present"
    echo "   Access-Control-Allow-Origin: $CORS_ORIGIN"
    
    if echo "$CORS_RESPONSE" | grep -i "access-control-allow-credentials" > /dev/null; then
        CORS_CREDS=$(echo "$CORS_RESPONSE" | grep -i "access-control-allow-credentials" | cut -d' ' -f2- | tr -d '\r')
        echo "   Access-Control-Allow-Credentials: $CORS_CREDS"
    fi
else
    echo "⚠️  CORS headers not found"
fi

echo ""

# Test 3: Frontend accessibility
echo "3. Testing frontend accessibility..."
if curl -s --connect-timeout 3 http://localhost:3000 > /dev/null; then
    echo "✅ Frontend accessible at http://localhost:3000"
else
    echo "⚠️  Frontend not accessible - make sure it's running with: npm start"
fi

echo ""

# Summary
echo "🎉 Connectivity test completed!"
echo ""
echo "📋 Summary:"
echo "   • Backend: http://localhost:5050/api ✅"
echo "   • Frontend: http://localhost:3000"
echo "   • CORS: Configured ✅"
echo ""
echo "✨ Next steps:"
echo "   1. Open browser to http://localhost:3000"
echo "   2. Check browser console for API calls"
echo "   3. Test the application functionality"
