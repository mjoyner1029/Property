#!/usr/bin/env python
"""
Script to check if the database is at the latest migration head.
This can be used by CI/CD pipelines or health check processes.
Returns exit code 0 if ready, 1 if not ready.
"""
import sys
from src.app import create_app
from src.services.migration_service import check_database_connection, is_database_migrated

def check_readiness():
    """Check if the application is ready to serve traffic"""
    app = create_app()
    with app.app_context():
        # Check database connection
        if not check_database_connection():
            print("Database connection failed")
            return 1
        
        # Check if migrations are up-to-date
        if not is_database_migrated():
            print("Database migrations are not up-to-date")
            return 1
        
        print("System is ready - database connected and migrations up-to-date")
        return 0

if __name__ == "__main__":
    sys.exit(check_readiness())
