"""
Test script to verify CORS and security headers configuration.
"""
import os
import json
from src.app import create_app

def test_dev_environment():
    """Test headers in development environment."""
    os.environ["APP_ENV"] = "development"
    os.environ["CORS_ORIGINS"] = "http://localhost:3000,https://app.assetanchor.com"
    
    app = create_app()
    with app.test_client() as client:
        # Test CORS preflight
        response = client.options('/api/health', headers={
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type,Authorization'
        })
        print("\n=== Development Environment ===")
        print(f"CORS Preflight Status: {response.status_code}")
        print("CORS Headers:")
        for key, value in response.headers.items():
            if key.startswith('Access-Control-'):
                print(f"  {key}: {value}")
        
        # Test actual request
        response = client.get('/api/health', headers={
            'Origin': 'http://localhost:3000',
        })
        print(f"\nRegular Request Status: {response.status_code}")
        print("Security Headers:")
        for key in ['Content-Security-Policy', 'Strict-Transport-Security', 
                   'X-Frame-Options', 'Access-Control-Allow-Origin']:
            if key in response.headers:
                print(f"  {key}: {response.headers[key]}")
            else:
                print(f"  {key}: Not present")

def test_prod_environment():
    """Test headers in production environment."""
    # First, ensure we're in a clean environment
    os.environ.pop("SENTRY_DSN", None)
    os.environ.pop("SENTRY_ENVIRONMENT", None)
    
    os.environ["APP_ENV"] = "production"
    os.environ["CORS_ORIGINS"] = "https://app.assetanchor.com,https://www.assetanchor.com"
    
    # Set required environment variables for production
    os.environ["SECRET_KEY"] = "test_secret_key_with_at_least_32_characters_length"
    os.environ["JWT_SECRET_KEY"] = "test_jwt_secret_key_with_at_least_32_characters_length"
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"
    os.environ["STRIPE_SECRET_KEY"] = "sk_test_example"
    os.environ["STRIPE_WEBHOOK_SECRET"] = "whsec_example"
    # Set a mock Sentry DSN
    os.environ["SENTRY_DSN"] = "https://00000000000000000000000000000000@o000000.ingest.sentry.io/0000000"
    os.environ["DISABLE_SENTRY"] = "True"
    
    app = create_app()
    with app.test_client() as client:
        # Test CORS preflight
        response = client.options('/api/health', headers={
            'Origin': 'https://app.assetanchor.com',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type,Authorization'
        })
        print("\n=== Production Environment ===")
        print(f"CORS Preflight Status: {response.status_code}")
        print("CORS Headers:")
        for key, value in response.headers.items():
            if key.startswith('Access-Control-'):
                print(f"  {key}: {value}")
        
        # Test actual request
        response = client.get('/api/health', headers={
            'Origin': 'https://app.assetanchor.com',
        })
        print(f"\nRegular Request Status: {response.status_code}")
        print("Security Headers:")
        for key in ['Content-Security-Policy', 'Strict-Transport-Security', 
                   'X-Frame-Options', 'Access-Control-Allow-Origin']:
            if key in response.headers:
                print(f"  {key}: {response.headers[key]}")
            else:
                print(f"  {key}: Not present")

if __name__ == "__main__":
    test_dev_environment()
    test_prod_environment()
