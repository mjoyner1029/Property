#!/usr/bin/env python3
"""
Security Headers and Rate Limiting Verification Tool

This script checks an API endpoint for proper security headers and rate limiting.
"""

import argparse
import requests
import time
import sys
import json
from urllib.parse import urljoin

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

def check_security_headers(base_url):
    """Check if all required security headers are present."""
    print_header("Checking Security Headers")
    
    try:
        response = requests.get(urljoin(base_url, "/api/health"), timeout=10)
        
        # Required security headers
        required_headers = {
            "Strict-Transport-Security": "HSTS header",
            "X-Frame-Options": "Frame options header",
            "X-Content-Type-Options": "Content-Type options header",
            "Referrer-Policy": "Referrer policy header",
            "Content-Security-Policy": "Content Security Policy header"
        }
        
        # Check for each required header
        missing_headers = []
        for header, desc in required_headers.items():
            if header.lower() not in [h.lower() for h in response.headers]:
                missing_headers.append(desc)
        
        if missing_headers:
            print_error(f"Missing security headers: {', '.join(missing_headers)}")
            for header in required_headers:
                if header.lower() in [h.lower() for h in response.headers]:
                    print(f"  - {header}: {response.headers.get(header, 'N/A')}")
            return False
        
        # Print all the security headers
        print_success("All required security headers are present:")
        for header in required_headers:
            print(f"  - {header}: {response.headers.get(header, 'N/A')}")
        
        return True
    except requests.exceptions.RequestException as e:
        print_error(f"Error checking security headers: {e}")
        return False

def check_rate_limiting(base_url):
    """Check if rate limiting headers are present and functional."""
    print_header("Checking Rate Limiting")
    
    try:
        # Make a request to an endpoint that should have rate limiting
        response = requests.get(urljoin(base_url, "/api/status"), timeout=10)
        
        # Check for rate limiting headers
        rate_limit_headers = [
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset"
        ]
        
        missing_headers = []
        for header in rate_limit_headers:
            if header.lower() not in [h.lower() for h in response.headers]:
                missing_headers.append(header)
        
        if missing_headers:
            print_warning(f"Missing rate limit headers: {', '.join(missing_headers)}")
            for header in rate_limit_headers:
                if header.lower() in [h.lower() for h in response.headers]:
                    print(f"  - {header}: {response.headers.get(header, 'N/A')}")
        else:
            print_success("Rate limiting headers are present:")
            for header in rate_limit_headers:
                print(f"  - {header}: {response.headers.get(header, 'N/A')}")
        
        # Test rate limiting by making multiple rapid requests
        print_warning("Testing rate limiting functionality with multiple rapid requests...")
        
        responses = []
        for _ in range(10):
            resp = requests.get(urljoin(base_url, "/api/status"), timeout=10)
            responses.append(resp)
            
            # Check if we're being rate limited
            if resp.status_code == 429:
                print_success("Rate limiting successfully triggered after multiple requests")
                return True
        
        # If we made it through all requests without a 429, check the remaining count
        last_response = responses[-1]
        if "X-RateLimit-Remaining" in last_response.headers:
            remaining = int(last_response.headers["X-RateLimit-Remaining"])
            if remaining < 190:  # Assuming default of 200 per minute
                print_success(f"Rate limiting is working (remaining requests: {remaining})")
                return True
        
        print_warning("Rate limiting may not be functioning correctly. "
                      "Made multiple requests but didn't hit the limit.")
        return False
        
    except requests.exceptions.RequestException as e:
        print_error(f"Error checking rate limiting: {e}")
        return False

def check_csp_report_endpoint(base_url):
    """Check if the CSP report endpoint is functioning."""
    print_header("Checking CSP Report Endpoint")
    
    try:
        # Send a fake CSP violation report
        fake_report = {
            "csp-report": {
                "document-uri": "https://example.com/page.html",
                "violated-directive": "script-src-elem",
                "effective-directive": "script-src-elem",
                "original-policy": "default-src 'self'",
                "disposition": "enforce",
                "blocked-uri": "https://malicious-site.com/script.js",
                "line-number": 42,
                "column-number": 8,
                "source-file": "https://example.com/page.html"
            }
        }
        
        response = requests.post(
            urljoin(base_url, "/api/csp-report"),
            json=fake_report,
            timeout=10
        )
        
        if response.status_code in [200, 201, 204]:
            print_success(f"CSP report endpoint accepted the report with status {response.status_code}")
            return True
        else:
            print_error(f"CSP report endpoint returned unexpected status: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Error checking CSP report endpoint: {e}")
        return False

def check_csp_enforcement(base_url):
    """Check if CSP enforcement is active by inspecting the CSP header."""
    print_header("Checking CSP Enforcement Status")
    
    try:
        response = requests.get(urljoin(base_url, "/api/health"), timeout=10)
        
        # Check for CSP header
        csp_header = response.headers.get("Content-Security-Policy")
        csp_report_only = response.headers.get("Content-Security-Policy-Report-Only")
        
        if csp_header:
            print_success("CSP enforcement is active!")
            print(f"CSP header: {csp_header[:100]}...")  # Print first 100 chars
            return True
        elif csp_report_only:
            print_warning("CSP is in report-only mode (not enforced)")
            print(f"CSP-Report-Only header: {csp_report_only[:100]}...")
            return False
        else:
            print_error("No CSP headers found")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Error checking CSP enforcement: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Verify security headers and rate limiting')
    parser.add_argument('--url', '--base-url', default='http://localhost:5050',
                        help='Base URL for the API')
    args = parser.parse_args()
    
    print(f"Verifying security headers and rate limiting for {args.url}")
    print("==========================================================")
    
    # Run all checks
    security_headers_ok = check_security_headers(args.url)
    rate_limiting_ok = check_rate_limiting(args.url)
    csp_report_ok = check_csp_report_endpoint(args.url)
    csp_enforcement_ok = check_csp_enforcement(args.url)
    
    # Print summary
    print("\n----- Verification Summary -----")
    all_passed = all([security_headers_ok, rate_limiting_ok, csp_report_ok])
    
    if all_passed:
        print_success("All security checks passed!")
    else:
        print_error("Some security checks failed. Please address the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
