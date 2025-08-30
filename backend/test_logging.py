#!/usr/bin/env python
"""
Test script to verify JSON logging and Sentry integration.
"""
import os
import sys
import time
import logging

# Add src to path so we can import from it
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

# Import our app
from src import create_app

def test_json_logging():
    """Test that logs are properly formatted as JSON."""
    print("Testing JSON logging...")
    
    # Set up the app with explicit development config
    os.environ["APP_ENV"] = "development"
    
    # Create the app
    app = create_app()
    
    # Use the app context
    with app.app_context():
        # Log some test messages at different levels
        app.logger.debug("This is a DEBUG message")
        app.logger.info("This is an INFO message")
        app.logger.warning("This is a WARNING message")
        app.logger.error("This is an ERROR message")
        
        # Test logging with extra context
        app.logger.info("Message with extra context", extra={
            'user_id': 12345,
            'action': 'test',
            'component': 'logging_test'
        })
        
        # Test exception logging
        try:
            # Generate an exception
            1 / 0
        except Exception as e:
            app.logger.exception(f"Caught an exception: {e}")
            
    print("JSON logging test completed. Check the output for JSON formatted logs.")

def test_sentry_integration():
    """Test Sentry integration if configured."""
    print("Testing Sentry integration...")
    
    # Check if Sentry DSN is set
    if not os.environ.get('SENTRY_DSN'):
        print("SENTRY_DSN not set. Set it to test Sentry integration.")
        print("Example: export SENTRY_DSN=https://your-dsn@sentry.io/project")
        return
    
    # Set up the app with production config to ensure Sentry is enabled
    os.environ["APP_ENV"] = "production"
    
    # Create the app
    app = create_app()
    
    # Use the app context
    with app.app_context():
        print("Sending a test event to Sentry...")
        
        # Import Sentry SDK
        import sentry_sdk
        
        # Send a test event
        sentry_sdk.capture_message("Test message from logging test script")
        
        # Send a test exception
        try:
            raise ValueError("Test exception for Sentry")
        except Exception as e:
            sentry_sdk.capture_exception(e)
        
        # Give Sentry time to send the events
        print("Waiting for events to be sent...")
        time.sleep(1)
        
    print("Sentry test completed. Check your Sentry dashboard for the test events.")

if __name__ == "__main__":
    test_json_logging()
    print("\n" + "="*50 + "\n")
    test_sentry_integration()
