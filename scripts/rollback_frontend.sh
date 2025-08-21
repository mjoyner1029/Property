#!/bin/bash
# Rollback helper script for frontend (Vercel)
# Usage: ./scripts/rollback_frontend.sh [DEPLOYMENT_ID]

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/rollback_frontend.sh [DEPLOYMENT_ID]"
    echo "Example: ./scripts/rollback_frontend.sh dpl_123456"
    exit 1
fi

DEPLOYMENT_ID=$1

# Check if required env variables are set
if [ -z "$VERCEL_TOKEN" ] || [ -z "$VERCEL_PROJECT_ID" ] || [ -z "$VERCEL_ORG_ID" ]; then
    echo "Error: One or more required environment variables not set"
    echo "Required: VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_ORG_ID"
    exit 1
fi

echo "Rolling back frontend to deployment $DEPLOYMENT_ID..."

# Call Vercel API to promote a specific deployment to production
RESPONSE=$(curl -s -X POST "https://api.vercel.com/v1/deployments/$DEPLOYMENT_ID/promote-to-production" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"teamId\":\"$VERCEL_ORG_ID\"}")

# Check if rollback was successful
if echo "$RESPONSE" | grep -q "\"done\":true"; then
    echo "Successfully rolled back frontend to deployment $DEPLOYMENT_ID"
    exit 0
else
    echo "Failed to rollback frontend. Response:"
    echo "$RESPONSE"
    exit 1
fi
