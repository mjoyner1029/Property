# 🚀 Property App - Development Runbook

## Current Status: ✅ READY FOR TESTING

### Backend Status
- ✅ Flask API running on `http://localhost:5050`
- ✅ Health endpoint available at `/api/health`
- ✅ CORS configured for frontend (`http://localhost:3000`)
- ✅ Authentication endpoints configured
- ✅ Database connectivity working

### Frontend Status
- ✅ React app running on `http://localhost:3000`
- ✅ Unified API client with enhanced error handling
- ✅ CORS properly configured
- ✅ API test page available at `/api-test`

## 🔧 How to Start the Application

### 1. Start Backend (Terminal 1)
```bash
cd /Users/mjoyner/Property/backend
PYTHONPATH=/Users/mjoyner/Property/backend python wsgi.py
```

**Expected Output:**
```
Initializing app with development configuration
* Serving Flask app 'src.app'
* Running on http://127.0.0.1:5050
* Running on http://192.168.1.148:5050
```

### 2. Start Frontend (Terminal 2)
```bash
cd /Users/mjoyner/Property/frontend
npm start
```

**Expected Output:**
```
Starting the development server...
Compiled successfully!
You can now view asset-anchor-frontend in the browser.
Local: http://localhost:3000
```

## 🧪 Testing the Connection

### 1. Manual Backend Health Check
```bash
curl http://localhost:5050/api/health
```

**Expected Response:**
```json
{
  "environment": "development",
  "ok": true,
  "timestamp": "2025-09-05T13:39:36.998912",
  "version": "1.0.0"
}
```

### 2. Frontend API Test Page
1. Open browser to: http://localhost:3000/api-test
2. Should show green success message with backend connection details
3. Check browser console for API logs

### 3. Automated Test Script
```bash
./test_connectivity.sh
```

## 📋 Key Configuration Changes Made

### Backend Changes
1. **Enhanced Config** (`/backend/src/config.py`)
   - JWT cookie support for better security
   - Proper CORS origins for frontend
   - Portable database path for development

2. **Auth Routes** (`/backend/src/routes/auth_routes.py`)
   - Login/refresh endpoints set JWT cookies
   - Secure httpOnly cookies for production

3. **Health Check** (`/backend/src/app.py`)
   - Added `/api/health` endpoint
   - Returns environment, status, and version info

4. **Environment** (`/backend/.env`)
   - DATABASE_URL set to portable path
   - CORS_ORIGINS configured for frontend

### Frontend Changes
1. **Unified API Client** (`/frontend/src/utils/api.js`)
   - Enhanced error handling and logging
   - Automatic token refresh on 401
   - Retry logic for transient errors
   - Better CORS and credential handling

2. **API Test Page** (`/frontend/src/components/ApiTestPage.jsx`)
   - Visual confirmation of backend connectivity
   - Real-time API testing in browser
   - Helpful debugging information

3. **Routing** (`/frontend/src/App.jsx`)
   - Added `/api-test` route for testing

## 🔍 Debugging

### Backend Not Responding
1. Check if backend is running: `lsof -i :5050`
2. Restart backend with debug: `FLASK_DEBUG=1 python wsgi.py`
3. Check backend logs for errors

### Frontend Can't Connect
1. Verify CORS settings in backend config
2. Check browser console for network errors
3. Verify API URL in frontend console logs
4. Test direct curl to backend health endpoint

### CORS Issues
1. Backend CORS should allow `http://localhost:3000`
2. Frontend should send `withCredentials: true`
3. Check preflight OPTIONS requests in browser dev tools

## 🎯 Next Steps for Development

1. **Test Authentication Flow**
   - Try login from frontend
   - Verify JWT cookies are set
   - Test protected routes

2. **Test Core Features**
   - Property creation/listing
   - Tenant management
   - Payment processing

3. **Monitor API Logs**
   - Check browser console for API call logs
   - Monitor backend logs for errors
   - Use API test page for quick debugging

## 📱 Browser Testing URLs

- **Frontend Home:** http://localhost:3000
- **API Test Page:** http://localhost:3000/api-test
- **Backend Health:** http://localhost:5050/api/health
- **Backend API Docs:** http://localhost:5050/api (if available)

## 🔐 Environment Variables

### Backend (.env)
```
DATABASE_URL=sqlite:///instance/property_dev.db
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
JWT_SECRET_KEY=development-secret-key
FLASK_ENV=development
```

### Frontend
```
REACT_APP_API_URL=http://localhost:5050/api
NODE_ENV=development
```

---

**Status:** All systems operational ✅  
**Last Updated:** September 5, 2025  
**Ready for:** Full application testing and development
