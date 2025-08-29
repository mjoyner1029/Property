#!/usr/bin/env python3
"""
Deployment checklist script for backend production readiness.
Run this before deploying to production to ensure all production requirements are met.
"""
import os
import sys
import json
import subprocess
from pathlib import Path

# Checklist items
CHECKLIST = [
    {
        "name": "Security Check",
        "description": "Run security validation script",
        "check_function": "check_security",
        "severity": "HIGH"
    },
    {
        "name": "Test Coverage",
        "description": "Check test coverage thresholds",
        "check_function": "check_test_coverage",
        "severity": "MEDIUM",
        "threshold": 60  # Minimum test coverage percentage
    },
    {
        "name": "Environment Variables",
        "description": "Check if required environment variables are documented",
        "check_function": "check_env_vars",
        "severity": "HIGH"
    },
    {
        "name": "Database Migrations",
        "description": "Check if migrations are up to date",
        "check_function": "check_migrations",
        "severity": "HIGH"
    },
    {
        "name": "Dependencies",
        "description": "Check for outdated or vulnerable dependencies",
        "check_function": "check_dependencies",
        "severity": "MEDIUM"
    }
]

def check_security():
    """Run security validation script."""
    security_script = Path(__file__).parent / "security_check.py"
    
    if not security_script.exists():
        return False, "Security check script not found"
    
    try:
        # Instead of running as executable, use python interpreter
        result = subprocess.run(["python", str(security_script)], 
                                capture_output=True, 
                                text=True, 
                                check=False)
        
        if result.returncode == 0:
            return True, "Security checks passed"
        else:
            return False, f"Security checks failed: {result.stdout}"
    except Exception as e:
        return False, f"Error running security checks: {str(e)}"

def check_test_coverage():
    """Check test coverage thresholds."""
    try:
        # Run pytest with coverage
        result = subprocess.run(["python", "-m", "pytest", "--cov=src", "--cov-report=term"], 
                                capture_output=True, 
                                text=True, 
                                check=False)
        
        # Parse coverage percentage
        for line in result.stdout.split("\n"):
            if "TOTAL" in line:
                parts = line.split()
                if len(parts) >= 4:
                    try:
                        coverage = float(parts[3].strip("%"))
                        threshold = CHECKLIST[1].get("threshold", 60)
                        
                        if coverage >= threshold:
                            return True, f"Test coverage {coverage}% meets threshold of {threshold}%"
                        else:
                            return False, f"Test coverage {coverage}% below threshold of {threshold}%"
                    except ValueError:
                        pass
        
        return False, "Could not determine test coverage"
    except Exception as e:
        return False, f"Error checking test coverage: {str(e)}"

def check_env_vars():
    """Check if required environment variables are documented."""
    config_path = Path(__file__).parent / "src" / "config.py"
    readme_path = Path(__file__).parent / "README.md"
    
    if not config_path.exists():
        return False, "Config file not found"
    
    env_vars = []
    with open(config_path, 'r') as f:
        content = f.read()
        
        # Find all os.environ.get calls
        import re
        pattern = r"os\.environ\.get\(['\"]([A-Za-z0-9_]+)['\"]"
        matches = re.findall(pattern, content)
        env_vars.extend(matches)
    
    # Check if README exists and has environment variables section
    if readme_path.exists():
        with open(readme_path, 'r') as f:
            readme_content = f.read()
            
            has_env_section = "ENVIRONMENT" in readme_content.upper() or "ENV" in readme_content.upper()
            
            if has_env_section:
                # Check if most important env vars are mentioned
                critical_vars = ["SECRET_KEY", "DATABASE_URL", "JWT_SECRET_KEY"]
                missing_critical = [var for var in critical_vars if var not in readme_content]
                
                if not missing_critical:
                    return True, f"Environment variables documented ({len(env_vars)} vars found in code)"
                else:
                    return False, f"Missing documentation for critical env vars: {', '.join(missing_critical)}"
    
    return False, "Environment variables not properly documented in README"

def check_migrations():
    """Check if migrations are up to date."""
    try:
        # Check if migrations directory exists and has files
        migrations_dir = Path(__file__).parent / "migrations"
        if not migrations_dir.exists() or not any(migrations_dir.glob("versions/*.py")):
            return False, "No migrations found or migrations directory missing"
            
        # Check if migration scripts are present
        run_migrations = Path(__file__).parent / "run_migrations.py"
        if not run_migrations.exists():
            return False, "Migration execution script missing"
            
        return True, "Migration files found and appear to be properly organized"
    except Exception as e:
        return False, f"Error checking migrations: {str(e)}"

def check_dependencies():
    """Check for outdated dependencies."""
    try:
        # Check if pip is available
        subprocess.run(["pip", "--version"], capture_output=True, check=True)
        
        # Run pip list --outdated
        result = subprocess.run(["pip", "list", "--outdated"], 
                                capture_output=True, 
                                text=True, 
                                check=False)
        
        lines = result.stdout.strip().split("\n")
        outdated_packages = [line for line in lines if not line.startswith("Package") and not line.startswith("-")]
        
        if len(outdated_packages) > 5:
            return False, f"Found {len(outdated_packages)} outdated packages"
        elif len(outdated_packages) > 0:
            return True, f"Found {len(outdated_packages)} outdated packages (warning only)"
        else:
            return True, "All dependencies are up to date"
    except Exception as e:
        return False, f"Error checking dependencies: {str(e)}"

def run_checklist():
    """Run all checklist items."""
    results = []
    all_passed = True
    
    print("=" * 80)
    print("PRODUCTION DEPLOYMENT CHECKLIST")
    print("=" * 80)
    
    for check in CHECKLIST:
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
        print("✅ All checklist items PASSED")
    else:
        print("❌ Some checklist items FAILED")
    print("=" * 80)
    
    return results, all_passed

if __name__ == "__main__":
    results, all_passed = run_checklist()
    sys.exit(0 if all_passed else 1)
