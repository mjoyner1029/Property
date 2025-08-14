#!/usr/bin/env python3
"""
Stripe webhook verification tool.
Performs several checks to ensure Stripe webhooks are properly configured.
"""

import os
import sys
import requests
import json
import time
from urllib.parse import urljoin
import argparse
import hmac
import hashlib

# ANSI colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def print_success(message):
    print(f"{GREEN}✓ {message}{RESET}")

def print_error(message):
    print(f"{RED}✗ {message}{RESET}")

def print_warning(message):
    print(f"{YELLOW}! {message}{RESET}")

def print_header(message):
    print(f"\n----- {message} -----")

def verify_env_variables():
    """Verify the required Stripe environment variables are set."""
    print_header("Checking Stripe Environment Variables")
    
    required_vars = [
        "STRIPE_SECRET_KEY",
        "STRIPE_PUBLISHABLE_KEY",
        "STRIPE_WEBHOOK_SECRET"
    ]
    
    missing = []
    for var in required_vars:
        if not os.environ.get(var):
            missing.append(var)
            
    if missing:
        print_error(f"Missing required environment variables: {', '.join(missing)}")
        print_warning("These should be set in your .env file and loaded by your application.")
        return False
    
    print_success("All required Stripe environment variables are set")
    return True

def test_webhook_endpoint_security(base_url):
    """Test that the webhook endpoint rejects requests with invalid signatures."""
    print_header("Testing Webhook Signature Verification")
    
    # Simulate a Stripe webhook event
    payload = json.dumps({
        "id": "evt_test_webhook_verification",
        "object": "event",
        "type": "payment_intent.succeeded",
        "created": int(time.time()),
        "data": {"object": {"id": "pi_test"}}
    })
    
    # Invalid signature header
    invalid_sig = "t=123456,v1=invalid_signature"
    
    try:
        response = requests.post(
            urljoin(base_url, "/api/webhooks/stripe"),
            headers={
                "Content-Type": "application/json",
                "Stripe-Signature": invalid_sig
            },
            data=payload,
            timeout=10
        )
        
        if response.status_code == 400:
            print_success("Webhook endpoint properly rejects invalid signatures")
            return True
        else:
            print_error(f"Webhook endpoint returned unexpected status for invalid signature: {response.status_code}")
            print_error(f"Expected 400 (Bad Request), got {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Error connecting to webhook endpoint: {e}")
        return False

def generate_valid_signature(payload, secret):
    """Generate a valid Stripe signature for testing."""
    timestamp = int(time.time())
    signed_payload = f"{timestamp}.{payload}"
    signature = hmac.new(
        secret.encode('utf-8'),
        signed_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return f"t={timestamp},v1={signature}"

def check_webhook_in_documentation():
    """Check if webhooks are properly documented."""
    print_header("Checking Documentation")
    
    docs = [
        "/Users/mjoyner/Property/docs/STRIPE.md",
        "/Users/mjoyner/Property/scripts/stripe_webhook_check.md"
    ]
    
    documentation_complete = True
    
    for doc_path in docs:
        try:
            with open(doc_path, 'r') as f:
                content = f.read().lower()
                
            if "webhook" not in content:
                print_error(f"No webhook information found in {doc_path}")
                documentation_complete = False
                continue
                
            # Check for critical webhook information
            required_topics = [
                "secret", "signature", "verify", "test", "event"
            ]
            
            missing = []
            for topic in required_topics:
                if topic not in content:
                    missing.append(topic)
            
            if missing:
                print_warning(f"{doc_path} may be missing information about: {', '.join(missing)}")
                documentation_complete = False
            else:
                print_success(f"Documentation in {doc_path} appears complete")
                
        except FileNotFoundError:
            print_warning(f"Documentation file not found: {doc_path}")
            documentation_complete = False
    
    return documentation_complete

def main():
    """Run all webhook verification checks."""
    parser = argparse.ArgumentParser(description='Verify Stripe webhook configuration')
    parser.add_argument('--url', '--base-url', default='http://localhost:5050',
                        help='Base URL for the API')
    args = parser.parse_args()
    
    print(f"Verifying Stripe webhook configuration for {args.url}")
    print("====================================================")
    
    checks = [
        # (check_webhook_in_documentation, []),
        (test_webhook_endpoint_security, [args.url]),
    ]
    
    results = []
    for check_fn, check_args in checks:
        try:
            results.append(check_fn(*check_args))
        except Exception as e:
            print_error(f"Error during check: {e}")
            results.append(False)
    
    print("\n----- Verification Summary -----")
    if all(results):
        print_success("All checks passed! Stripe webhooks appear to be properly configured.")
    else:
        print_error(f"{results.count(False)} of {len(results)} checks failed.")
        print_warning("Please address the issues above to ensure proper webhook functionality.")
        sys.exit(1)

if __name__ == "__main__":
    main()
