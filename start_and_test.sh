#!/bin/bash
cd /Users/mjoyner/Property/backend
echo "Starting backend server..."
python wsgi.py &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Test connectivity
echo "Testing backend connectivity..."
python /Users/mjoyner/Property/test_frontend_backend.py

# Keep backend running
echo "Backend is running. Press Ctrl+C to stop."
wait $BACKEND_PID
