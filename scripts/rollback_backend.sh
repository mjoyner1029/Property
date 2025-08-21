#!/bin/bash
# Rollback helper script for backend
# Usage: ./scripts/rollback_backend.sh [RENDER_SERVICE_ID] [DEPLOY_ID]

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./scripts/rollback_backend.sh [RENDER_SERVICE_ID] [DEPLOY_ID]"
    echo "Example: ./scripts/rollback_backend.sh srv-123456 dep-abcdef"
    exit 1
fi

SERVICE_ID=$1
DEPLOY_ID=$2

# Check if RENDER_API_KEY is set
if [ -z "$RENDER_API_KEY" ]; then
    echo "Error: RENDER_API_KEY environment variable not set"
    exit 1
fi

echo "Rolling back backend service $SERVICE_ID to deploy $DEPLOY_ID..."

# Call Render API to rollback to specific deploy
RESPONSE=$(curl -s -X POST "https://api.render.com/v1/services/$SERVICE_ID/deploys/$DEPLOY_ID/rollback" \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json")

# Check if rollback was successful
if echo "$RESPONSE" | grep -q "id"; then
    echo "Successfully initiated rollback to deploy $DEPLOY_ID"
    echo "Rollback details:"
    echo "$RESPONSE" | grep -E 'id|status|createdAt'
    exit 0
else
    echo "Failed to rollback backend service. Response:"
    echo "$RESPONSE"
    exit 1
fi
