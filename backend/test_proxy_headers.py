#!/usr/bin/env python
"""
Test script to verify proxy header handling.
"""
import sys
import os
from flask import Flask, jsonify, request

# Add src to path so we can import from it
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

# Import our app
from src import create_app

def test_proxy_headers():
    """Test that the app properly handles proxy headers."""
    print("Testing proxy header handling...")
    
    # Set up the app with explicit production config to ensure ProxyFix is enabled
    os.environ["APP_ENV"] = "production"
    
    # Create the app
    app = create_app()
    
    # Create a test route that returns proxy header information
    @app.route('/test-proxy-headers')
    def test_headers():
        return jsonify({
            'remote_addr': request.remote_addr,
            'scheme': request.scheme,
            'host': request.host,
            'script_root': request.script_root,
            'url_root': request.url_root,
            'base_url': request.base_url,
            'url': request.url,
            'endpoint': request.endpoint,
            'headers': dict(request.headers)
        })
    
    # Print the configuration
    print("App configuration:")
    print(f"ProxyFix is configured")
    print("To test manually, run:")
    print("flask run --port=5001")
    print("\nThen in a separate terminal, use curl with proxy headers:")
    print("curl -H 'X-Forwarded-For: 1.2.3.4' -H 'X-Forwarded-Proto: https' -H 'X-Forwarded-Host: example.com' -H 'X-Forwarded-Port: 8443' -H 'X-Forwarded-Prefix: /api' http://localhost:5001/test-proxy-headers")
    print("\nYou should see the proxy headers reflected in the response.")
    
    # Run the app in test mode
    if __name__ == "__main__":
        app.run(debug=True, port=5001)

if __name__ == "__main__":
    test_proxy_headers()
