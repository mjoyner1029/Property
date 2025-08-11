#!/bin/bash
set -e

echo "Running database migrations..."
cd "$(dirname "$0")/../backend"

# Set up Python environment
export PYTHONPATH="$PWD:$PYTHONPATH"
export FLASK_APP="wsgi.py"

# Check if the database URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable not set"
    exit 1
fi

echo "Running Flask database migrations..."
flask db upgrade

echo "Migrations completed successfully!"
