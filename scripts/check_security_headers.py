#!/usr/bin/env python3
# Security header check script for RC builds
# Verifies the presence and configuration of critical security headers

import sys
import requests
import argparse
import json
from urllib.parse import urlparse

# Define expected security headers and their minimum requirements
REQUIRED_HEADERS = {
    "Content-Security-Policy": {
        "required": True,
        "check": lambda val: "default-src" in val and "script-src" in val
    },
    "Strict-Transport-Security": {
        "required": True,
        "check": lambda val: "max-age=" in val and int(val.split("max-age=")[1].split(";")[0]) >= 31536000
    },
    "X-Frame-Options": {
        "required": True,
        "check": lambda val: val.upper() in ["DENY", "SAMEORIGIN"]
    },
    "X-Content-Type-Options": {
        "required": True,
        "check": lambda val: val.lower() == "nosniff"
    },
    "Referrer-Policy": {
        "required": True,
        "check": lambda val: val in ["no-referrer", "strict-origin", "strict-origin-when-cross-origin", "same-origin"]
    },
    "Permissions-Policy": {
        "required": False,  # Recommended but not required
        "check": lambda val: True
    }
}

def check_url(url):
    """Check security headers for a given URL"""
    
    try:
        # Add protocol if missing
        if not url.startswith(('http://', 'https://')):
            url = f"https://{url}"
            
        print(f"Checking security headers for: {url}")
        
        # Verify the URL is valid
        parsed = urlparse(url)
        if not parsed.netloc:
            print(f"Error: Invalid URL format: {url}")
            return False
            
        # Send request with proper user agent
        headers = {
            "User-Agent": "Security-Header-Check/1.0"
        }
        
        response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        
        # Print status code
        print(f"Status Code: {response.status_code}")
        if response.status_code >= 400:
            print(f"Error: HTTP status code {response.status_code}")
            return False
            
        # Check each required header
        issues = 0
        for header, config in REQUIRED_HEADERS.items():
            if header.lower() in [h.lower() for h in response.headers]:
                # Header exists, get its value
                header_value = next((response.headers[h] for h in response.headers if h.lower() == header.lower()), "")
                
                # Check if header meets requirements
                if config["check"](header_value):
                    print(f"✅ {header}: {header_value}")
                else:
                    print(f"❌ {header}: {header_value} (Misconfigured)")
                    issues += 1
            elif config["required"]:
                print(f"❌ {header}: Missing (Required)")
                issues += 1
            else:
                print(f"⚠️ {header}: Missing (Recommended)")
        
        # Summary
        if issues == 0:
            print(f"All required security headers are properly configured for {url}")
            return True
        else:
            print(f"{issues} security header issues found for {url}")
            return False
            
    except Exception as e:
        print(f"Error checking {url}: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Check security headers for websites")
    parser.add_argument("urls", nargs="+", help="URLs to check")
    parser.add_argument("--json", action="store_true", help="Output in JSON format")
    
    args = parser.parse_args()
    
    results = {}
    all_passed = True
    
    for url in args.urls:
        result = check_url(url)
        results[url] = result
        all_passed = all_passed and result
        print("")  # Add a blank line between URL checks
    
    if args.json:
        print(json.dumps(results))
    
    # Exit with appropriate status code
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
