import pkg_resources
import importlib
import os
import sys

def check_if_module_exists(module_name):
    try:
        importlib.import_module(module_name)
        return True
    except ImportError:
        return False

def check_installed_packages(requirements_file):
    # Read requirements file
    with open(requirements_file) as f:
        required_packages = []
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            # Handle package with version specifiers
            package_name = line.split('==')[0].split('>=')[0].split('<')[0].split('[')[0].strip()
            if package_name:
                required_packages.append(package_name)
    
    print(f"Found {len(required_packages)} packages in requirements.txt")
    
    # Check if packages are installed
    missing_packages = []
    for package in required_packages:
        try:
            pkg_resources.get_distribution(package)
            print(f"✅ {package}")
        except pkg_resources.DistributionNotFound:
            missing_packages.append(package)
            print(f"❌ {package}")
    
    # Try importing common modules
    common_modules = [
        'flask', 'sqlalchemy', 'alembic', 'werkzeug', 'flask_sqlalchemy', 
        'flask_migrate', 'flask_jwt_extended', 'flask_cors', 'flask_talisman',
        'flask_socketio', 'flask_mail', 'flask_limiter',
        'sentry_sdk', 'prometheus_client', 'psutil', 'redis', 'qrcode', 'pyotp'
    ]
    
    print("\nChecking common module imports:")
    for module in common_modules:
        if check_if_module_exists(module):
            print(f"✅ Can import {module}")
        else:
            print(f"❌ Cannot import {module}")
            if module not in missing_packages:
                missing_packages.append(module)
    
    if missing_packages:
        print("\nMissing packages:")
        for pkg in missing_packages:
            print(f"- {pkg}")
    else:
        print("\nAll required packages are installed!")

if __name__ == "__main__":
    requirements_file = "requirements.txt"
    if not os.path.exists(requirements_file):
        print(f"Error: {requirements_file} not found")
        sys.exit(1)
    
    check_installed_packages(requirements_file)
