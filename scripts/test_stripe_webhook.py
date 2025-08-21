#!/usr/bin/env python3
"""
Stripe Webhook Test Script

This script tests the Stripe webhook endpoint by simulating webhook events
with various scenarios including idempotency checks and signature verification.

Requirements:
- stripe CLI installed (https://stripe.com/docs/stripe-cli)
- requests
- stripe python library

Usage:
    python3 test_stripe_webhook.py [webhook_url] [webhook_secret]

Example:
    python3 test_stripe_webhook.py https://staging-api.example.com/api/webhooks/stripe sk_test_webhook_secret
"""

import sys
import subprocess
import json
import time
import uuid
import hmac
import hashlib
import requests
import stripe

def run_stripe_cli(event_type, webhook_url):
    """Run stripe CLI to trigger a webhook event"""
    cmd = [
        "stripe", "trigger", event_type, 
        "--webhook-url", webhook_url
    ]
    
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"Error running stripe CLI: {result.stderr}")
        return None
    
    print(f"Stripe CLI output: {result.stdout}")
    return result.stdout

def manual_webhook(event_data, webhook_url, webhook_secret, idempotency_key=None):
    """Manually send a webhook event with proper signature"""
    timestamp = int(time.time())
    payload = json.dumps(event_data)
    
    # Create signature
    signed_payload = f"{timestamp}.{payload}"
    signature = hmac.new(
        webhook_secret.encode('utf-8'),
        signed_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Set up headers
    headers = {
        'Content-Type': 'application/json',
        'Stripe-Signature': f"t={timestamp},v1={signature}"
    }
    
    if idempotency_key:
        headers['Idempotency-Key'] = idempotency_key
    
    # Send request
    response = requests.post(webhook_url, headers=headers, data=payload)
    
    return {
        "status_code": response.status_code,
        "headers": dict(response.headers),
        "body": response.text,
    }

def test_idempotency(webhook_url, webhook_secret):
    """Test idempotency by sending the same webhook event multiple times"""
    print("\n=== TESTING IDEMPOTENCY ===")
    
    # Create a test payment intent event
    idempotency_key = str(uuid.uuid4())
    event_data = {
        "id": f"evt_{uuid.uuid4().hex}",
        "object": "event",
        "api_version": "2023-10-16",
        "created": int(time.time()),
        "data": {
            "object": {
                "id": f"pi_{uuid.uuid4().hex}",
                "object": "payment_intent",
                "amount": 2000,
                "currency": "usd",
                "status": "succeeded",
                "metadata": {
                    "test_idempotency": "true"
                }
            }
        },
        "type": "payment_intent.succeeded",
        "livemode": False
    }
    
    print(f"Using idempotency key: {idempotency_key}")
    
    # Send first request
    print("\nSending first request...")
    first_response = manual_webhook(event_data, webhook_url, webhook_secret, idempotency_key)
    print(f"Status: {first_response['status_code']}")
    
    # Send second request with same idempotency key
    print("\nSending duplicate request with same idempotency key...")
    second_response = manual_webhook(event_data, webhook_url, webhook_secret, idempotency_key)
    print(f"Status: {second_response['status_code']}")
    
    # Check if responses are different
    if first_response['status_code'] == second_response['status_code']:
        print("\nIdempotency check - Both requests returned same status code")
        # Check response body for idempotency detection
        if "already processed" in second_response.get('body', '').lower():
            print("✅ IDEMPOTENCY WORKING - System detected duplicate event")
        else:
            print("⚠️ IDEMPOTENCY UNCLEAR - Same status code but unable to confirm idempotency handling in response")
    else:
        print(f"❌ IDEMPOTENCY ISSUE - Different status codes: {first_response['status_code']} vs {second_response['status_code']}")

def test_invalid_signature(webhook_url, webhook_secret):
    """Test signature verification by sending an event with invalid signature"""
    print("\n=== TESTING SIGNATURE VERIFICATION ===")
    
    # Create a test payment intent event
    event_data = {
        "id": f"evt_{uuid.uuid4().hex}",
        "object": "event",
        "api_version": "2023-10-16",
        "created": int(time.time()),
        "data": {
            "object": {
                "id": f"pi_{uuid.uuid4().hex}",
                "object": "payment_intent",
                "amount": 2000,
                "currency": "usd",
                "status": "succeeded",
            }
        },
        "type": "payment_intent.succeeded",
        "livemode": False
    }
    
    # Send with correct signature
    print("\nSending event with valid signature...")
    valid_response = manual_webhook(event_data, webhook_url, webhook_secret)
    print(f"Status: {valid_response['status_code']}")
    
    # Send with incorrect signature (use wrong secret)
    print("\nSending event with invalid signature...")
    fake_secret = webhook_secret[:-4] + "fake"
    invalid_response = manual_webhook(event_data, webhook_url, fake_secret)
    print(f"Status: {invalid_response['status_code']}")
    
    # Check results
    if valid_response['status_code'] < 300 and (invalid_response['status_code'] == 400 or invalid_response['status_code'] == 401):
        print("✅ SIGNATURE VERIFICATION WORKING - Valid signature accepted, invalid rejected")
    else:
        print(f"❌ SIGNATURE VERIFICATION ISSUE - Valid: {valid_response['status_code']}, Invalid: {invalid_response['status_code']}")

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 test_stripe_webhook.py [webhook_url] [webhook_secret]")
        print("Example: python3 test_stripe_webhook.py https://staging-api.example.com/api/webhooks/stripe sk_test_webhook_secret")
        sys.exit(1)
    
    webhook_url = sys.argv[1]
    webhook_secret = sys.argv[2]
    
    print(f"Testing Stripe webhook at: {webhook_url}")
    
    # Test with Stripe CLI
    print("\n=== TESTING WITH STRIPE CLI ===")
    print("Testing payment_intent.succeeded event")
    run_stripe_cli("payment_intent.succeeded", webhook_url)
    
    # Wait a bit for the event to be processed
    time.sleep(2)
    
    # Test idempotency
    test_idempotency(webhook_url, webhook_secret)
    
    # Test signature verification
    test_invalid_signature(webhook_url, webhook_secret)
    
    print("\nWebhook testing completed. Please check your application logs for details.")

if __name__ == "__main__":
    main()
