#!/usr/bin/env python3
"""
Fix database configuration and connectivity issues
"""
import os
import sys
import sqlite3
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

def fix_database_path():
    """Fix database path and permissions"""
    backend_path = Path(__file__).parent / "backend"
    instance_path = backend_path / "instance"
    db_path = instance_path / "dev.db"
    
    print(f"Backend path: {backend_path}")
    print(f"Instance path: {instance_path}")
    print(f"Database path: {db_path}")
    
    # Ensure instance directory exists
    instance_path.mkdir(exist_ok=True)
    print(f"✅ Instance directory created: {instance_path}")
    
    # Check if database exists
    if db_path.exists():
        print(f"✅ Database file exists: {db_path}")
        # Test database connectivity
        try:
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1;")
            result = cursor.fetchone()
            conn.close()
            print(f"✅ Database is accessible, found table: {result}")
        except Exception as e:
            print(f"❌ Database access error: {e}")
            return False
    else:
        print(f"❌ Database file does not exist: {db_path}")
        return False
    
    # Set environment variable for absolute path
    abs_db_path = str(db_path.absolute())
    database_url = f"sqlite:///{abs_db_path}"
    
    print(f"Setting DATABASE_URL to: {database_url}")
    
    # Create/update .env file
    env_path = backend_path / ".env"
    env_lines = []
    
    if env_path.exists():
        with open(env_path, 'r') as f:
            env_lines = f.readlines()
    
    # Remove existing DATABASE_URL line
    env_lines = [line for line in env_lines if not line.startswith('DATABASE_URL=')]
    
    # Add new DATABASE_URL
    env_lines.append(f'DATABASE_URL={database_url}\n')
    
    with open(env_path, 'w') as f:
        f.writelines(env_lines)
    
    print(f"✅ Updated .env file: {env_path}")
    return True

def test_flask_app():
    """Test if Flask app can start with correct database"""
    try:
        os.chdir(str(Path(__file__).parent / "backend"))
        
        # Set environment
        os.environ['FLASK_APP'] = 'src.app'
        os.environ['FLASK_ENV'] = 'development'
        
        from src.app import create_app
        from src.extensions import db
        
        app = create_app('development')
        
        with app.app_context():
            print(f"✅ Flask app created successfully")
            print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
            print(f"Instance path: {app.instance_path}")
            
            # Test database connection
            try:
                db.engine.execute("SELECT 1")
                print("✅ Database connection successful")
                return True
            except Exception as e:
                print(f"❌ Database connection failed: {e}")
                return False
                
    except Exception as e:
        print(f"❌ Flask app creation failed: {e}")
        return False

def main():
    print("🔧 Fixing database connectivity issues...\n")
    
    # Fix database path
    if not fix_database_path():
        print("❌ Failed to fix database path")
        return False
    
    print("\n🧪 Testing Flask app...")
    if not test_flask_app():
        print("❌ Flask app test failed")
        return False
    
    print("\n✅ Database connectivity fixed!")
    print("\n🚀 Next steps:")
    print("1. Restart the backend server: cd backend && python wsgi.py")
    print("2. Test connectivity: python /Users/mjoyner/Property/test_frontend_backend.py")
    
    return True

if __name__ == "__main__":
    main()
