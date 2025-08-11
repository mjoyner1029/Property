#!/usr/bin/env python3
"""
Validates required environment variables for Asset Anchor.
Run this script to check if all necessary environment variables are set
before starting the application.
"""

import os
import sys
import re
from typing import Dict, List, Set, Optional

# Environment-specific required variables
REQUIRED_VARS: Dict[str, List[str]] = {
    "base": [
        "FLASK_APP",
        "SECRET_KEY",
        "JWT_SECRET_KEY",
    ],
    "production": [
        "DATABASE_URL",
        "CORS_ORIGINS",
        "EMAIL_PROVIDER",
        "EMAIL_API_KEY",
        "EMAIL_FROM",
        "STRIPE_PUBLIC_KEY",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
    ],
}

OPTIONAL_VARS: List[str] = [
    "REDIS_URL",
    "SENTRY_DSN",
    "S3_BUCKET",
    "S3_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "CSP_ENFORCE",
]

def load_env_file(env_file: str) -> Dict[str, str]:
    """Load environment variables from a .env file."""
    env_vars = {}
    if not os.path.exists(env_file):
        return env_vars
    
    with open(env_file, "r") as file:
        for line in file:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            key, value = line.split("=", 1)
            env_vars[key.strip()] = value.strip()
    
    return env_vars

def check_env_vars(env_vars: Dict[str, str], required_vars: Set[str]) -> List[str]:
    """Check if all required environment variables are set."""
    missing = []
    for var in required_vars:
        if var not in env_vars or not env_vars[var]:
            missing.append(var)
    return missing

def main() -> int:
    """Main function."""
    # Determine environment
    env = os.environ.get("APP_ENV", os.environ.get("FLASK_ENV", "development")).lower()
    print(f"Checking environment variables for: {env}")
    
    # Load environment variables from .env file if it exists
    env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    env_vars = load_env_file(env_file)
    
    # Add environment variables from the system
    env_vars.update(os.environ)
    
    # Determine required variables
    required = set(REQUIRED_VARS["base"])
    if env == "production":
        required.update(REQUIRED_VARS["production"])
    
    # Check required variables
    missing = check_env_vars(env_vars, required)
    
    # Output results
    if missing:
        print("❌ Missing required environment variables:")
        for var in missing:
            print(f"  - {var}")
        return 1
    else:
        print("✅ All required environment variables are set.")
    
    # Check optional variables
    optional_missing = [var for var in OPTIONAL_VARS if var not in env_vars or not env_vars[var]]
    if optional_missing:
        print("\n⚠️  Missing optional environment variables:")
        for var in optional_missing:
            print(f"  - {var}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
