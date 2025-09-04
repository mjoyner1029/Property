#!/usr/bin/env python3
"""
Debug starter for Flask application to diagnose issues with SQLAlchemy
"""
import os
import sys

def main():
    try:
        from src.app import create_app
        
        # Create and configure the app
        app = create_app()
        app.config['DEBUG'] = True
        
        # Run the app
        port = int(os.getenv("PORT", "5050"))
        host = os.getenv("HOST", "0.0.0.0")
        print(f"Serving on {host}:{port}")
        app.run(host=host, port=port, debug=True)
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
