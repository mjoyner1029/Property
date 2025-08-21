#!/usr/bin/env python3
"""
CSP Violation Analyzer

This script analyzes Content Security Policy (CSP) violations by:
1. Checking Sentry for CSP violation reports
2. Monitoring browser console for CSP warnings
3. Providing recommendations for CSP adjustments

Usage:
    python3 analyze_csp.py [frontend_url]

Example:
    python3 analyze_csp.py https://staging.assetanchor.io
"""

import sys
import requests
import json
import webbrowser
import time
from urllib.parse import urlparse
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

def check_csp_headers(url):
    """
    Check if a website is using CSP and what directives are set
    """
    try:
        print(f"{Colors.HEADER}Checking CSP headers for {url}{Colors.ENDC}")
        
        response = requests.get(url, timeout=10)
        headers = response.headers
        
        # Check for CSP header (different possible names)
        csp_header = None
        csp_value = None
        
        for header in ['Content-Security-Policy', 'Content-Security-Policy-Report-Only']:
            if header in headers:
                csp_header = header
                csp_value = headers[header]
                break
        
        if not csp_header:
            print(f"{Colors.RED}No CSP headers found!{Colors.ENDC}")
            return None
        
        # Parse CSP directives
        print(f"{Colors.GREEN}Found {csp_header}{Colors.ENDC}")
        
        directives = {}
        parts = csp_value.split(';')
        
        for part in parts:
            part = part.strip()
            if not part:
                continue
                
            directive_parts = part.split(' ')
            directive_name = directive_parts[0]
            directive_values = directive_parts[1:] if len(directive_parts) > 1 else []
            
            directives[directive_name] = directive_values
        
        # Display directive summary
        print(f"\n{Colors.BOLD}CSP Directive Summary:{Colors.ENDC}")
        for name, values in directives.items():
            print(f"  {Colors.BLUE}{name}{Colors.ENDC}: {' '.join(values)}")
            
        # Check for report-uri directive
        if 'report-uri' in directives or 'report-to' in directives:
            report_uri = directives.get('report-uri', directives.get('report-to', []))
            if report_uri:
                print(f"\n{Colors.GREEN}CSP violations will be reported to: {report_uri[0]}{Colors.ENDC}")
        else:
            print(f"\n{Colors.WARNING}No report-uri or report-to directive found - violations won't be reported!{Colors.ENDC}")
            
        return {
            'header': csp_header,
            'directives': directives,
            'report_only': csp_header == 'Content-Security-Policy-Report-Only'
        }
        
    except requests.exceptions.RequestException as e:
        print(f"{Colors.RED}Error accessing {url}: {str(e)}{Colors.ENDC}")
        return None

def generate_browser_csp_checker(url, output_file):
    """
    Generate an HTML file that helps detect CSP violations in the browser
    """
    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSP Violation Checker</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.5; }
        h1 { color: #333; }
        .instructions { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
        .results { margin-top: 20px; }
        .violation { background-color: #fff3cd; padding: 10px; margin: 10px 0; border-left: 4px solid #ffc107; }
        button { background-color: #0d6efd; color: white; border: none; padding: 10px 15px; cursor: pointer; }
        pre { background-color: #f8f9fa; padding: 10px; overflow: auto; }
    </style>
</head>
<body>
    <h1>CSP Violation Checker</h1>
    
    <div class="instructions">
        <h2>Instructions</h2>
        <p>This tool will help you identify Content Security Policy violations on <strong>""" + url + """</strong>.</p>
        <ol>
            <li>Click the button below to open the target website in a new tab</li>
            <li>Open your browser's developer console (F12 or right-click > Inspect > Console)</li>
            <li>Look for CSP violation warnings (yellow/orange messages)</li>
            <li>Navigate around the site to trigger different features</li>
            <li>Return to this tab and document any violations found</li>
        </ol>
        <button id="openSite">Open """ + url + """ in New Tab</button>
    </div>
    
    <div class="results">
        <h2>Common CSP Violations</h2>
        <p>Document any violations you find below:</p>
        
        <div class="violation">
            <h3>Inline Scripts Blocked</h3>
            <p>If you see warnings about inline scripts being blocked, you need to either:</p>
            <ul>
                <li>Move inline JavaScript to external files</li>
                <li>Add <code>'unsafe-inline'</code> to your <code>script-src</code> directive (less secure)</li>
                <li>Use nonces or hashes for specific inline scripts</li>
            </ul>
            <pre>Example violation: Refused to execute inline script because it violates CSP directive: "script-src 'self'"</pre>
        </div>
        
        <div class="violation">
            <h3>External Resources Blocked</h3>
            <p>If external resources (scripts, styles, images) are blocked, add their domains to the appropriate directive:</p>
            <pre>Example violation: Refused to load script from 'https://example.com/script.js' because it violates CSP directive: "script-src 'self'"</pre>
        </div>
        
        <div class="violation">
            <h3>Inline Styles Blocked</h3>
            <p>For inline styles being blocked:</p>
            <ul>
                <li>Move inline styles to CSS files</li>
                <li>Add <code>'unsafe-inline'</code> to your <code>style-src</code> directive</li>
            </ul>
            <pre>Example violation: Refused to apply inline style because it violates CSP directive: "style-src 'self'"</pre>
        </div>
    </div>
    
    <script>
        document.getElementById('openSite').addEventListener('click', function() {
            window.open('""" + url + """', '_blank');
        });
    </script>
</body>
</html>
"""
    
    with open(output_file, 'w') as f:
        f.write(html)
    
    print(f"{Colors.GREEN}Generated browser CSP checker at: {output_file}{Colors.ENDC}")
    return output_file

def check_sentry_for_csp_violations(frontend_url):
    """
    Provide instructions for checking Sentry for CSP violations
    """
    domain = urlparse(frontend_url).netloc
    
    print(f"\n{Colors.HEADER}Checking for CSP Violations in Sentry{Colors.ENDC}")
    print(f"{Colors.BOLD}Follow these steps to check Sentry for CSP violations:{Colors.ENDC}")
    print(f"1. Log into your Sentry dashboard")
    print(f"2. Navigate to the project associated with {domain}")
    print(f"3. Filter issues by searching for 'csp' or 'security'")
    print(f"4. Look for events with the type 'csp'")
    print(f"\nCommon CSP violation categories in Sentry:")
    print(f"- {Colors.BLUE}script-src{Colors.ENDC}: Unauthorized JavaScript execution")
    print(f"- {Colors.BLUE}style-src{Colors.ENDC}: Unauthorized CSS")
    print(f"- {Colors.BLUE}img-src{Colors.ENDC}: Unauthorized image sources")
    print(f"- {Colors.BLUE}connect-src{Colors.ENDC}: Unauthorized API connections")
    print(f"- {Colors.BLUE}frame-src{Colors.ENDC}: Unauthorized iframes")
    
    print(f"\n{Colors.WARNING}Note: If you find legitimate sources being blocked, update your CSP directives to include them{Colors.ENDC}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 analyze_csp.py [frontend_url]")
        print("Example: python3 analyze_csp.py https://staging.assetanchor.io")
        sys.exit(1)
    
    frontend_url = sys.argv[1]
    
    # Check CSP headers
    csp_info = check_csp_headers(frontend_url)
    
    # Generate report if CSP is found
    if csp_info:
        mode = "Report-Only" if csp_info['report_only'] else "Enforced"
        print(f"\n{Colors.BOLD}CSP Mode: {Colors.GREEN if not csp_info['report_only'] else Colors.WARNING}{mode}{Colors.ENDC}")
        
        # Generate browser checker
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"csp_checker_{timestamp}.html"
        checker_file = generate_browser_csp_checker(frontend_url, output_file)
        
        # Open browser checker
        print(f"\n{Colors.BOLD}Opening browser CSP checker...{Colors.ENDC}")
        webbrowser.open(f"file://{checker_file}", new=2)
        
        # Check Sentry
        time.sleep(1)  # Give browser time to open
        check_sentry_for_csp_violations(frontend_url)
        
        # Provide summary
        print(f"\n{Colors.HEADER}CSP Analysis Summary:{Colors.ENDC}")
        print(f"- CSP is {Colors.GREEN if not csp_info['report_only'] else Colors.WARNING}{mode}{Colors.ENDC}")
        print(f"- {len(csp_info['directives'])} directives configured")
        print(f"- Browser checker opened in new tab")
        print(f"- Check browser console and Sentry for violations")
    else:
        print(f"\n{Colors.RED}Could not analyze CSP - no headers found or could not access site{Colors.ENDC}")

if __name__ == "__main__":
    main()
