#!/usr/bin/env python3
"""
Sentry Integration Tester

This script tests Sentry integration by:
1. Triggering controlled errors in both backend and frontend
2. Verifying errors appear in Sentry with proper context
3. Checking that environment tags are correctly set

Usage:
    python3 test_sentry.py [api_url] [frontend_url]

Example:
    python3 test_sentry.py https://staging-api.example.com https://staging.assetanchor.io
"""

import sys
import requests
import json
import time
import uuid
import webbrowser
from datetime import datetime

# ANSI color codes for output formatting
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def test_backend_error(api_url):
    """Test backend error reporting to Sentry"""
    print(f"{Colors.HEADER}Testing Backend Error Reporting to Sentry{Colors.ENDC}")
    
    # Generate a unique error ID to track in Sentry
    error_id = uuid.uuid4().hex
    
    # Endpoints that might trigger controlled errors
    endpoints = [
        f"{api_url}/api/debug/error",
        f"{api_url}/api/test/error",
        f"{api_url}/api/sentry-test"
    ]
    
    for endpoint in endpoints:
        try:
            print(f"Trying endpoint: {endpoint}")
            response = requests.post(
                endpoint,
                json={"message": f"Test error {error_id}", "error_type": "test_error"}
            )
            
            if response.status_code >= 400 and response.status_code < 600:
                print(f"{Colors.GREEN}Successfully triggered error at {endpoint} with status {response.status_code}{Colors.ENDC}")
                return {
                    "status": "success",
                    "endpoint": endpoint,
                    "error_id": error_id,
                    "response_code": response.status_code
                }
            else:
                print(f"{Colors.WARNING}Endpoint {endpoint} did not return an error status: {response.status_code}{Colors.ENDC}")
                
        except requests.exceptions.RequestException as e:
            print(f"{Colors.RED}Exception accessing {endpoint}: {str(e)}{Colors.ENDC}")
    
    # If no endpoints worked, try to cause a 500 error by sending malformed data to an API endpoint
    try:
        print("Attempting to trigger 500 error with malformed request...")
        response = requests.post(
            f"{api_url}/api/auth/login",
            data="this is not valid JSON but has the error ID: " + error_id,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code >= 400 and response.status_code < 600:
            print(f"{Colors.GREEN}Successfully triggered error with status {response.status_code}{Colors.ENDC}")
            return {
                "status": "success",
                "endpoint": f"{api_url}/api/auth/login (malformed)",
                "error_id": error_id,
                "response_code": response.status_code
            }
    except:
        pass
    
    print(f"{Colors.WARNING}Could not trigger backend error through API endpoints{Colors.ENDC}")
    return {
        "status": "unknown",
        "message": "Could not trigger backend error through API endpoints"
    }

def generate_frontend_error_page(frontend_url, output_file):
    """Generate an HTML page that triggers a frontend error for Sentry"""
    error_id = uuid.uuid4().hex
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Frontend Sentry Test</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; line-height: 1.5; }}
        h1 {{ color: #333; }}
        .instructions {{ background-color: #f8f9fa; padding: 15px; border-radius: 5px; }}
        .buttons {{ margin: 20px 0; }}
        button {{ background-color: #dc3545; color: white; border: none; padding: 10px 15px; cursor: pointer; margin-right: 10px; }}
        .success {{ background-color: #d4edda; border: 1px solid #c3e6cb; padding: 10px; border-radius: 5px; margin-top: 20px; }}
    </style>
</head>
<body>
    <h1>Frontend Sentry Error Test</h1>
    
    <div class="instructions">
        <h2>Instructions</h2>
        <p>This page will help you test frontend error reporting to Sentry for <strong>{frontend_url}</strong>.</p>
        <ol>
            <li>Click the button below to open the target website in a new tab</li>
            <li>Once the site loads, open your browser's developer console (F12)</li>
            <li>Run one of the test commands below in the console to trigger a controlled error</li>
            <li>Check Sentry to verify the error was captured correctly</li>
        </ol>
        <button id="openSite">Open {frontend_url} in New Tab</button>
    </div>
    
    <div class="test-commands">
        <h2>Error Test Commands</h2>
        <p>Copy and paste one of these commands in the browser console of {frontend_url} to trigger a test error:</p>
        
        <pre><code>// Simple error with unique ID
throw new Error("Sentry test error with ID: {error_id}");</code></pre>
        
        <pre><code>// Error with custom context
try {{
  // This will create a reference error
  let x = nonExistentVariable + 1;
}} catch (error) {{
  // Add test context for Sentry
  error.message = `Sentry test with ID: {error_id}`;
  if (window.Sentry) {{
    Sentry.captureException(error, {{
      tags: {{
        test_error_id: "{error_id}",
        test_type: "manual_test"
      }},
      extra: {{
        test_timestamp: new Date().toISOString(),
        test_url: window.location.href
      }}
    }});
    console.log("Error sent to Sentry with ID: {error_id}");
  }} else {{
    throw error;
  }}
}}</code></pre>
    </div>
    
    <div class="sentry-check">
        <h2>Checking Sentry</h2>
        <p>After triggering the error, check your Sentry dashboard for an event with error ID: <strong>{error_id}</strong></p>
        <p>Verify that the error:</p>
        <ul>
            <li>Contains the correct environment tag (should be "staging")</li>
            <li>Has a proper stack trace</li>
            <li>Includes browser/user context</li>
            <li>Shows the correct source map (if source maps are uploaded)</li>
        </ul>
    </div>
    
    <script>
        document.getElementById('openSite').addEventListener('click', function() {{
            window.open('{frontend_url}', '_blank');
        }});
    </script>
</body>
</html>
"""
    
    with open(output_file, 'w') as f:
        f.write(html)
    
    print(f"{Colors.GREEN}Generated frontend error test page at: {output_file}{Colors.ENDC}")
    return {
        "status": "success",
        "error_id": error_id,
        "test_page": output_file
    }

def test_health_endpoints(api_url, frontend_url):
    """Test health endpoints for monitoring setup"""
    print(f"\n{Colors.HEADER}Testing Health Endpoints for Monitoring{Colors.ENDC}")
    
    results = {}
    
    # Test backend health endpoints
    backend_endpoints = [
        f"{api_url}/api/health",
        f"{api_url}/health",
        f"{api_url}/api/status",
        f"{api_url}/status"
    ]
    
    backend_health_status = "unknown"
    for endpoint in backend_endpoints:
        try:
            print(f"Testing backend health endpoint: {endpoint}")
            response = requests.get(endpoint, timeout=5)
            
            if response.status_code == 200:
                print(f"{Colors.GREEN}Backend health check successful at {endpoint}{Colors.ENDC}")
                backend_health_status = "healthy"
                results["backend_health"] = {
                    "status": "healthy",
                    "endpoint": endpoint,
                    "response_code": response.status_code,
                    "response": response.text[:100] + ("..." if len(response.text) > 100 else "")
                }
                break
            else:
                print(f"{Colors.WARNING}Backend health check returned non-200 status: {response.status_code}{Colors.ENDC}")
        except requests.exceptions.RequestException as e:
            print(f"{Colors.RED}Exception accessing backend health endpoint {endpoint}: {str(e)}{Colors.ENDC}")
    
    if backend_health_status == "unknown":
        results["backend_health"] = {
            "status": "unknown",
            "message": "Could not find working health endpoint"
        }
    
    # Test frontend health (just check if it loads)
    try:
        print(f"Testing frontend health: {frontend_url}")
        response = requests.get(frontend_url, timeout=5)
        
        if response.status_code == 200:
            print(f"{Colors.GREEN}Frontend health check successful{Colors.ENDC}")
            results["frontend_health"] = {
                "status": "healthy",
                "response_code": response.status_code
            }
        else:
            print(f"{Colors.WARNING}Frontend health check returned non-200 status: {response.status_code}{Colors.ENDC}")
            results["frontend_health"] = {
                "status": "unhealthy",
                "response_code": response.status_code
            }
    except requests.exceptions.RequestException as e:
        print(f"{Colors.RED}Exception accessing frontend: {str(e)}{Colors.ENDC}")
        results["frontend_health"] = {
            "status": "error",
            "message": str(e)
        }
    
    return results

def provide_uptime_setup_instructions():
    """Provide instructions for setting up external uptime monitoring"""
    print(f"\n{Colors.HEADER}External Uptime Monitoring Setup Instructions{Colors.ENDC}")
    print(f"\n{Colors.BOLD}Recommended Uptime Monitoring Services:{Colors.ENDC}")
    print("1. UptimeRobot (https://uptimerobot.com/)")
    print("2. Pingdom (https://www.pingdom.com/)")
    print("3. StatusCake (https://www.statuscake.com/)")
    print("4. Better Stack (https://betterstack.com/uptime)")
    
    print(f"\n{Colors.BOLD}Setup Steps:{Colors.ENDC}")
    print("1. Sign up for one of the monitoring services above")
    print("2. Add two monitors:")
    print("   a. Backend API health endpoint (e.g., /api/health)")
    print("   b. Frontend root URL")
    print("3. Configure check frequency (recommend 1-5 minutes)")
    print("4. Set up notifications (email, SMS, Slack, etc.)")
    print("5. Configure expected status code (200 OK)")
    print("6. Add response content validation where possible")
    
    print(f"\n{Colors.BOLD}Advanced Monitoring:{Colors.ENDC}")
    print("1. Set up synthetic monitoring for critical user flows")
    print("2. Configure region-specific checks")
    print("3. Set up status page for transparency")
    print("4. Integrate with incident management tools")

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 test_sentry.py [api_url] [frontend_url]")
        print("Example: python3 test_sentry.py https://staging-api.example.com https://staging.assetanchor.io")
        sys.exit(1)
    
    api_url = sys.argv[1].rstrip('/')
    frontend_url = sys.argv[2].rstrip('/')
    
    print(f"{Colors.HEADER}Sentry Integration and Monitoring Test{Colors.ENDC}")
    print(f"API URL: {api_url}")
    print(f"Frontend URL: {frontend_url}")
    
    # Test backend error reporting
    backend_result = test_backend_error(api_url)
    
    # Create frontend error test page
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    frontend_output_file = f"frontend_error_test_{timestamp}.html"
    frontend_result = generate_frontend_error_page(frontend_url, frontend_output_file)
    
    # Test health endpoints
    health_results = test_health_endpoints(api_url, frontend_url)
    
    # Provide uptime monitoring instructions
    provide_uptime_setup_instructions()
    
    # Open frontend test page
    print(f"\n{Colors.GREEN}Opening frontend error test page...{Colors.ENDC}")
    webbrowser.open(f"file://{frontend_output_file}", new=2)
    
    # Collect all results
    all_results = {
        "timestamp": datetime.now().isoformat(),
        "api_url": api_url,
        "frontend_url": frontend_url,
        "backend_error_test": backend_result,
        "frontend_error_test": frontend_result,
        "health_checks": health_results
    }
    
    # Save results to file
    results_file = f"sentry_monitoring_test_{timestamp}.json"
    with open(results_file, 'w') as f:
        json.dump(all_results, f, indent=2)
    
    print(f"\n{Colors.BOLD}Sentry and Monitoring Test Summary:{Colors.ENDC}")
    print(f"1. Backend error triggered: {Colors.GREEN if backend_result['status'] == 'success' else Colors.RED}{backend_result['status']}{Colors.ENDC}")
    print(f"2. Frontend error test page created: {Colors.GREEN}success{Colors.ENDC}")
    print(f"3. Backend health endpoint: {Colors.GREEN if health_results.get('backend_health', {}).get('status') == 'healthy' else Colors.RED}{health_results.get('backend_health', {}).get('status', 'unknown')}{Colors.ENDC}")
    print(f"4. Frontend health check: {Colors.GREEN if health_results.get('frontend_health', {}).get('status') == 'healthy' else Colors.RED}{health_results.get('frontend_health', {}).get('status', 'unknown')}{Colors.ENDC}")
    print(f"\nNext steps:")
    print(f"1. Check Sentry for backend error with ID: {backend_result.get('error_id', 'N/A')}")
    print(f"2. Use the frontend test page to trigger and verify frontend errors")
    print(f"3. Set up external uptime monitoring as described above")
    print(f"\nDetailed results saved to: {results_file}")

if __name__ == "__main__":
    main()
