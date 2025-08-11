#!/bin/env bash
set -euo pipefail

# Generate strong random secrets suitable for production
echo "Generating secure random tokens for Asset Anchor..."

python - <<'PY'
import secrets
print("\nSECRET_KEY=" + secrets.token_urlsafe(64))
print("JWT_SECRET_KEY=" + secrets.token_urlsafe(64))
print("\nAdd these to your environment variables in Render or your .env file.")
print("DO NOT commit these values to version control!\n")
PY
