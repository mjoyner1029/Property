#!/bin/bash

echo "Creating a simple test app to verify React functionality"

# Create a test directory if it doesn't exist
mkdir -p /Users/mjoyner/Property/frontend-tenant/test-react

# Create a simple HTML file
cat > /Users/mjoyner/Property/frontend-tenant/test-react/index.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
  <title>React Test</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .success { color: green; }
    .error { color: red; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
    button { padding: 10px; background: #4CAF50; color: white; border: none; cursor: pointer; }
    input { padding: 10px; width: 100%; box-sizing: border-box; margin-bottom: 10px; }
  </style>
</head>
<body>
  <h1>Asset Anchor Test Page</h1>
  
  <h2>1. Backend Connection Test</h2>
  <button onclick="testBackend()">Test Backend Connection</button>
  <div id="backendResult"></div>
  
  <h2>2. Login Test</h2>
  <form id="loginForm" onsubmit="testLogin(event)">
    <div>
      <label for="email">Email:</label>
      <input type="email" id="email" value="tenant@example.com">
    </div>
    <div>
      <label for="password">Password:</label>
      <input type="password" id="password" value="admin123">
    </div>
    <button type="submit">Login</button>
  </form>
  <div id="loginResult"></div>
  
  <script>
    function testBackend() {
      const resultDiv = document.getElementById('backendResult');
      resultDiv.innerHTML = 'Testing connection to http://localhost:5050/api/health...';
      
      fetch('http://localhost:5050/api/health')
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          resultDiv.innerHTML = `
            <p class="success">✓ Backend connection successful!</p>
            <pre>${JSON.stringify(data, null, 2)}</pre>
          `;
        })
        .catch(error => {
          resultDiv.innerHTML = `
            <p class="error">✗ Backend connection failed!</p>
            <p>${error.message}</p>
            <p>Make sure the backend is running at: http://localhost:5050</p>
            <p>Run: cd /Users/mjoyner/Property/backend && python3 run.py</p>
          `;
        });
    }
    
    function testLogin(event) {
      event.preventDefault();
      const resultDiv = document.getElementById('loginResult');
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      resultDiv.innerHTML = 'Attempting login...';
      
      fetch('http://localhost:5050/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          resultDiv.innerHTML = `
            <p class="success">✓ Login successful!</p>
            <p>You can now access the tenant portal.</p>
            <pre>${JSON.stringify(data, null, 2)}</pre>
            <h3>Next steps:</h3>
            <p>Use the access token above to access protected endpoints.</p>
            <p>Try using this token to access the maintenance requests:</p>
            <button onclick="listMaintenanceRequests('${data.access_token}')">List Maintenance Requests</button>
            <div id="maintenanceResult"></div>
          `;
        })
        .catch(error => {
          resultDiv.innerHTML = `
            <p class="error">✗ Login failed!</p>
            <p>${error.message}</p>
            <p>Check your credentials and make sure the backend is running.</p>
          `;
        });
    }
    
    function listMaintenanceRequests(token) {
      const resultDiv = document.getElementById('maintenanceResult');
      resultDiv.innerHTML = 'Fetching maintenance requests...';
      
      fetch('http://localhost:5050/api/tenant/maintenance/requests', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          resultDiv.innerHTML = `
            <p class="success">✓ Maintenance requests retrieved successfully!</p>
            <pre>${JSON.stringify(data, null, 2)}</pre>
          `;
        })
        .catch(error => {
          resultDiv.innerHTML = `
            <p class="error">✗ Failed to retrieve maintenance requests!</p>
            <p>${error.message}</p>
          `;
        });
    }
    
    // Auto-test backend connection on page load
    window.onload = testBackend;
  </script>
</body>
</html>
EOL

# Create a script to start a simple web server
cat > /Users/mjoyner/Property/frontend-tenant/test-react/start-test.sh << 'EOL'
#!/bin/bash
echo "Starting simple test server on port 3001..."
echo "Access at: http://localhost:3001"
cd "$(dirname "$0")"
python3 -m http.server 3001
EOL

# Make the script executable
chmod +x /Users/mjoyner/Property/frontend-tenant/test-react/start-test.sh

echo "Test app created successfully!"
echo "To run the test app, execute:"
echo "cd /Users/mjoyner/Property/frontend-tenant/test-react && ./start-test.sh"
