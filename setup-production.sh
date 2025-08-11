#!/bin/bash

# Production environment setup script
# Run this script after initial deployment to set up the production environment

set -e  # Exit immediately if a command exits with a non-zero status

# Create necessary directories
echo "Creating directory structure..."
mkdir -p nginx/ssl
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana/provisioning
mkdir -p logs

# Generate self-signed SSL certificate for development/testing
if [ ! -f "nginx/ssl/fullchain.pem" ] || [ ! -f "nginx/ssl/privkey.pem" ]; then
    echo "Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/privkey.pem \
        -out nginx/ssl/fullchain.pem \
        -subj "/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,DNS:property.example.com,IP:127.0.0.1"
    echo "SSL certificate generated successfully"
else
    echo "SSL certificates already exist, skipping generation"
fi

# Create production environment file if it doesn't exist
if [ ! -f "backend/.env.production" ]; then
    echo "Creating production environment file..."
    cp backend/.env backend/.env.production
    
    # Generate a secure secret key for production
    PROD_SECRET_KEY=$(openssl rand -hex 32)
    PROD_JWT_SECRET_KEY=$(openssl rand -hex 32)
    
    # Update the secret keys in .env.production
    sed -i'' -e "s/SECRET_KEY=.*/SECRET_KEY=$PROD_SECRET_KEY/" backend/.env.production
    sed -i'' -e "s/JWT_SECRET_KEY=.*/JWT_SECRET_KEY=$PROD_JWT_SECRET_KEY/" backend/.env.production
    sed -i'' -e "s/FLASK_ENV=.*/FLASK_ENV=production/" backend/.env.production
    
    echo "Production environment file created and updated with secure keys"
else
    echo "Production environment file already exists, skipping creation"
fi

# Check for required tools
echo "Checking required tools..."
MISSING_TOOLS=()

for cmd in docker docker-compose openssl; do
    if ! command -v $cmd &> /dev/null; then
        MISSING_TOOLS+=($cmd)
    fi
done

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo "WARNING: Missing required tools: ${MISSING_TOOLS[*]}"
    echo "Please install these tools before proceeding with deployment"
else
    echo "All required tools are installed"
fi

echo "Setup complete! You can now deploy with:"
echo "docker-compose -f docker-compose.prod.yml up -d"
