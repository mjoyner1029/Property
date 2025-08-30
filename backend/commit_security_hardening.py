"""
Script to commit the security hardening changes.
"""
import os
import sys
import subprocess

def commit_changes():
    """Commit security hardening changes."""
    # Add modified files to git
    subprocess.run(["git", "add", 
                    "/Users/mjoyner/Property/backend/src/extensions.py", 
                    "/Users/mjoyner/Property/backend/src/app.py", 
                    "/Users/mjoyner/Property/backend/test_cors_security.py"], check=True)
    
    # Commit the changes
    commit_message = """
Harden security defaults for production while keeping DX in dev

- Configure CORS with explicit allowlist for origins (http://localhost:3000, 
  https://app.assetanchor.com) while maintaining good developer experience
- Support credentials=True for CORS to allow authenticated requests
- Expose auth and rate limit headers in CORS responses
- Initialize Talisman only in production mode with HSTS and secure headers
- Disable strict security headers in development for better DX
"""
    
    subprocess.run(["git", "commit", "-m", commit_message], check=True)
    print("Changes committed successfully!")

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    commit_changes()
