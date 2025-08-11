#!/bin/bash
# Script to generate self-signed SSL certificates for local development

# Set variables
DOMAIN="assetanchor.io"
CERT_DIR="./nginx/certs"

# Ensure certificate directory exists
mkdir -p $CERT_DIR

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout $CERT_DIR/$DOMAIN.key \
  -out $CERT_DIR/$DOMAIN.crt \
  -subj "/C=US/ST=State/L=City/O=AssetAnchor/CN=$DOMAIN"

echo "Self-signed certificates generated for $DOMAIN"
echo "NOTE: These certificates are for development only. Use proper SSL certificates in production."
