#!/usr/bin/env python3
"""Quick script to check users in the database"""

import sys
import os

# Add backend to path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_dir)

from src import create_app
from src.extensions import db
from src.models.user import User

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        users = User.query.all()
        print('Users in database:')
        for user in users:
            print(f'  Email: {user.email}, Role: {user.role}, Active: {user.is_active}')
        
        if not users:
            print("  No users found in database")
