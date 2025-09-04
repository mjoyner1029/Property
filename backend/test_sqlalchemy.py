#!/usr/bin/env python3
"""
Test script to diagnose SQLAlchemy extension issues
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

def main():
    try:
        print("Creating Flask app...")
        app = Flask(__name__)
        
        print("Setting up SQLAlchemy config...")
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        
        print("Initializing SQLAlchemy...")
        # Initialize SQLAlchemy directly with app
        db = SQLAlchemy(app)
        
        print("SQLAlchemy initialized successfully!")
        
        with app.app_context():
            print(f"Database URI: {db.engine.url}")
        
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    main()
