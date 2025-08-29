#!/usr/bin/env python3
"""
Security validation script for backend production readiness.
Run this before deploying to production to ensure security best practices are followed.
"""
import os
import sys
import json
import subprocess
from pathlib import Path

# Security checks to perform
CHECKS = [
    {
        "name": "Debug Mode",
        "description": "Ensure Flask debug mode is disabled in production",
        "check_function": "check_debug_mode",
        "severity": "HIGH"
    },
    {
        "name": "Secret Key",
        "description": "Ensure secret key is not hardcoded and is properly set in environment",
        "check_function": "check_secret_key",
        "severity": "HIGH" 
    },
    {
        "name": "HTTPS",
        "description": "Ensure HTTPS is enforced",
        "check_function": "check_https",
        "severity": "HIGH"
    },
    {
        "name": "Content Security Policy",
        "description": "Ensure Content Security Policy headers are set",
        "check_function": "check_csp",
        "severity": "MEDIUM"
    },
    {
        "name": "Database Connection",
        "description": "Check if database connection URL is properly secured",
        "check_function": "check_db_connection",
        "severity": "HIGH"
    },
    {
        "name": "JWT Configuration",
        "description": "Check JWT configuration for secure settings",
        "check_function": "check_jwt_config",
        "severity": "HIGH"
    }
]

def check_debug_mode():
    """Check if debug mode is disabled in production."""
    config_path = Path(__file__).parent / "src" / "config.py"
    with open(config_path, 'r') as f:
        content = f.read()
    
    if "class ProductionConfig" in content and "DEBUG = False" in content:
        return True, "Debug mode properly disabled in production config"
    return False, "Debug mode not explicitly disabled in production config"

def check_secret_key():
    """Check if secret key is properly managed."""
    config_path = Path(__file__).parent / "src" / "config.py"
    with open(config_path, 'r') as f:
        content = f.read()
    
    if "SECRET_KEY = os.environ.get(\"SECRET_KEY\")" in content or "SECRET_KEY = os.environ.get('SECRET_KEY'" in content or "required_vars" in content and "SECRET_KEY" in content:
        return True, "Secret key properly loaded from environment"
    return False, "Secret key management issue - should be loaded from environment"

def check_https():
    """Check if HTTPS is enforced."""
    app_path = Path(__file__).parent / "src" / "app.py"
    with open(app_path, 'r') as f:
        content = f.read()
    
    extensions_path = Path(__file__).parent / "src" / "extensions.py"
    with open(extensions_path, 'r') as f:
        extensions_content = f.read()
    
    if "PREFERRED_URL_SCHEME = 'https'" in content or "app.config['PREFERRED_URL_SCHEME'] = 'https'" in content or "force_https\": True" in extensions_content:
        return True, "HTTPS preferred URL scheme set"
    return False, "HTTPS enforcement not detected in app configuration"

def check_csp():
    """Check if Content Security Policy headers are configured."""
    extensions_path = Path(__file__).parent / "src" / "extensions.py"
    with open(extensions_path, 'r') as f:
        content = f.read()
    
    if "content_security_policy" in content and "csp_directives" in content:
        return True, "CSP headers found in app configuration"
    return False, "CSP headers not detected"

def check_db_connection():
    """Check database connection configuration."""
    config_path = Path(__file__).parent / "src" / "config.py"
    with open(config_path, 'r') as f:
        content = f.read()
    
    if "SQLALCHEMY_DATABASE_URI = os.environ.get(\"DATABASE_URL\")" in content or "SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL'" in content or "required_vars" in content and "DATABASE_URL" in content:
        return True, "Database URL properly loaded from environment"
    return False, "Database URL configuration issue - should be loaded from environment"

def check_jwt_config():
    """Check JWT security configuration."""
    config_path = Path(__file__).parent / "src" / "config.py"
    with open(config_path, 'r') as f:
        content = f.read()
    
    issues = []
    if "JWT_SECRET_KEY" in content and "os.environ.get" not in content and "required_vars" not in content:
        issues.append("JWT_SECRET_KEY should be loaded from environment")
    
    if not "JWT_ACCESS_TOKEN_EXPIRES" in content:
        issues.append("JWT_ACCESS_TOKEN_EXPIRES should be explicitly set")
    
    if not issues:
        return True, "JWT configuration appears secure"
    return False, f"JWT configuration issues: {', '.join(issues)}"

def run_checks():
    """Run all security checks."""
    results = []
    all_passed = True
    
    print("=" * 80)
    print("PRODUCTION SECURITY CHECK")
    print("=" * 80)
    
    for check in CHECKS:
        name = check["name"]
        desc = check["description"]
        severity = check["severity"]
        func_name = check["check_function"]
        
        try:
            func = globals()[func_name]
            passed, message = func()
            
            status = "✅ PASS" if passed else f"❌ FAIL ({severity})"
            results.append({
                "name": name,
                "passed": passed,
                "message": message,
                "severity": severity
            })
            
            print(f"{status}: {name} - {message}")
            
            if not passed:
                all_passed = False
                
        except Exception as e:
            print(f"❗ ERROR: {name} - {str(e)}")
            results.append({
                "name": name,
                "passed": False,
                "message": f"Error: {str(e)}",
                "severity": severity
            })
            all_passed = False
    
    print("=" * 80)
    if all_passed:
        print("✅ All security checks PASSED")
    else:
        print("❌ Some security checks FAILED")
    print("=" * 80)
    
    return results, all_passed

if __name__ == "__main__":
    results, all_passed = run_checks()
    sys.exit(0 if all_passed else 1)
