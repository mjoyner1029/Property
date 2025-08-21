#!/usr/bin/env python3
"""
Rate Limit Test Script

This script tests the rate limiting functionality of the API by making multiple
rapid requests to a rate-limited endpoint. It reports the HTTP status codes
received and tracks when 429 (Too Many Requests) responses start appearing.

Usage:
    python3 test_rate_limit.py [endpoint] [requests_count]

Example:
    python3 test_rate_limit.py https://staging-api.example.com/api/auth/login 20
"""

import sys
import time
import requests
import json
from datetime import datetime

def test_rate_limit(endpoint, num_requests=15):
    """
    Test the rate limiting on a specific endpoint by making multiple rapid requests
    and tracking the responses.
    
    Args:
        endpoint: The URL endpoint to test
        num_requests: Number of requests to make (default: 15)
    """
    print(f"Testing rate limiting on {endpoint}")
    print(f"Making {num_requests} requests rapidly...\n")
    
    results = []
    headers = {}
    
    for i in range(1, num_requests + 1):
        start_time = datetime.now()
        
        try:
            # Using POST with empty JSON body as most rate-limited endpoints are POST
            response = requests.post(endpoint, json={}, headers=headers, timeout=5)
            
            # Extract rate limit headers if available
            rate_limit = {
                "limit": response.headers.get("X-RateLimit-Limit", "N/A"),
                "remaining": response.headers.get("X-RateLimit-Remaining", "N/A"),
                "reset": response.headers.get("X-RateLimit-Reset", "N/A")
            }
            
            result = {
                "request_num": i,
                "status_code": response.status_code,
                "rate_limit": rate_limit,
                "time": datetime.now().strftime("%H:%M:%S.%f")[:-3],
                "response_time_ms": (datetime.now() - start_time).total_seconds() * 1000
            }
            
            if response.status_code == 429:
                try:
                    error_data = response.json()
                    result["error_message"] = error_data.get("error", "Rate limit exceeded")
                except:
                    result["error_message"] = "Rate limit exceeded"
                    
            results.append(result)
            
            # Print progress
            status = "✅" if response.status_code < 400 else "❌"
            limit_info = f"(Remaining: {rate_limit['remaining']})" if rate_limit['remaining'] != "N/A" else ""
            print(f"Request {i:2d}: {status} Status: {response.status_code} {limit_info}")
            
            # Don't wait between requests to trigger rate limiting
            
        except requests.exceptions.RequestException as e:
            results.append({
                "request_num": i,
                "error": str(e),
                "time": datetime.now().strftime("%H:%M:%S.%f")[:-3]
            })
            print(f"Request {i:2d}: ❌ Error: {str(e)}")
    
    # Calculate summary
    status_counts = {}
    for result in results:
        status = result.get("status_code", "error")
        status_counts[status] = status_counts.get(status, 0) + 1
    
    # Print summary
    print("\n=== SUMMARY ===")
    print(f"Total requests: {num_requests}")
    for status, count in status_counts.items():
        print(f"Status {status}: {count} requests ({count/num_requests*100:.1f}%)")
    
    # Check if rate limiting is working
    if 429 in status_counts:
        print("\n✅ RATE LIMITING IS ACTIVE - 429 responses detected")
    else:
        print("\n❌ RATE LIMITING MAY NOT BE WORKING - No 429 responses detected")
        print("   Try increasing the number of requests or check rate limit configuration")
    
    return results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 test_rate_limit.py [endpoint] [requests_count]")
        print("Example: python3 test_rate_limit.py https://staging-api.example.com/api/auth/login 20")
        sys.exit(1)
    
    endpoint = sys.argv[1]
    num_requests = int(sys.argv[2]) if len(sys.argv) > 2 else 15
    
    results = test_rate_limit(endpoint, num_requests)
    
    # Save results to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"rate_limit_test_{timestamp}.json"
    with open(filename, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\nDetailed results saved to {filename}")
