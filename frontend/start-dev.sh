#!/bin/bash
# Custom start script for Asset Anchor frontend

# Change to the frontend directory
cd "$(dirname "$0")"

# Check if node_modules exists, install if not
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Set the environment variables
export NODE_ENV=development
export REACT_APP_API_URL=http://localhost:5050/api
export REACT_APP_SOCKET_URL=http://localhost:5050
export REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_IN_PRODUCTION
export REACT_APP_FRONTEND_URL=http://localhost:3000

# Start the development server
echo "Starting development server..."
node ./node_modules/react-scripts/scripts/start.js
