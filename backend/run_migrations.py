#!/usr/bin/env python
import os
import sys
from src.app import create_app
from src.extensions import db
from flask_migrate import upgrade

def run_migrations():
    """Run database migrations directly"""
    try:
        app = create_app()
        with app.app_context():
            # Print the database URI for debugging
            print(f"Using database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
            
            # Run migrations with 'heads' to apply all migrations
            upgrade(revision='heads')
            
            print("Migrations complete!")
    except Exception as e:
        print(f"Error running migrations: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migrations()
