#!/bin/bash
# check_migrations.sh - Verifies migration chain integrity and tests DB upgrade
# Usage: ./check_migrations.sh [database_url]
# If database_url is not provided, uses SQLite in-memory database

# Ensure errors are caught, but handle unbound variables properly
set -eo pipefail

cd "$(dirname "$0")/../backend"

# Set up environment
echo "===== MIGRATION CHAIN VERIFICATION ====="
echo "Setting up environment..."
export PYTHONPATH="${PYTHONPATH:-}:$PWD"
export FLASK_APP="wsgi.py"

# Use provided database URL or default to SQLite in-memory
if [ $# -gt 0 ]; then
  export DATABASE_URL="$1"
  echo "Using provided database URL: $(echo $DATABASE_URL | sed 's/\(.*:\/\/[^:]*\):.*/\1:***/g')"
else
  export DATABASE_URL="sqlite:///:memory:"
  echo "Using in-memory SQLite database"
fi

# Verify migration files for potential issues
echo -e "\n===== SCANNING MIGRATION FILES FOR ISSUES ====="

# Check for duplicate revision IDs
echo "Checking for duplicate revision IDs..."
DUPLICATE_REVISIONS=$(grep -r "revision = " --include="*.py" migrations/versions/ | grep -v "#" | awk -F"['\"]" '{print $2}' | sort | uniq -d)
if [ -n "$DUPLICATE_REVISIONS" ]; then
  echo "ERROR: Found duplicate revision IDs:"
  echo "$DUPLICATE_REVISIONS"
  
  # Show which files have the duplicate revisions
  for rev in $DUPLICATE_REVISIONS; do
    echo "Files with revision '$rev':"
    grep -r --include="*.py" "revision = ['\"]$rev['\"]" migrations/versions/
  done
  
  exit 1
fi
echo "✅ No duplicate revision IDs found"

# Check for duplicate down_revisions
echo "Checking for duplicate down_revisions..."
PROBLEMATIC_DOWN_REVISIONS=$(grep -r "down_revision = " --include="*.py" migrations/versions/ | grep -v "down_revision = None" | grep -v "#" | awk -F"['\"]" '{print $2}' | sort | uniq -c | awk '$1 > 1 {print $2}')
if [ -n "$PROBLEMATIC_DOWN_REVISIONS" ]; then
  echo "ERROR: Found multiple migrations pointing to the same parent:"
  for rev in $PROBLEMATIC_DOWN_REVISIONS; do
    echo "Migrations with down_revision '$rev':"
    grep -r --include="*.py" "down_revision = ['\"]$rev['\"]" migrations/versions/
  done
  exit 1
fi
echo "✅ No duplicate down_revisions found"

# Verify only one migration head exists
echo -e "\n===== CHECKING ALEMBIC HEADS ====="
TEMP_FILE=$(mktemp)
python -m flask db heads | tee "$TEMP_FILE"
HEAD_COUNT=$(grep -v "^$" "$TEMP_FILE" | wc -l | tr -d ' ')

if [ "$HEAD_COUNT" -ne 1 ]; then
  echo "ERROR: Found $HEAD_COUNT migration heads, expected exactly 1"
  rm "$TEMP_FILE"
  exit 1
fi

echo "✅ Verified single migration head"
rm "$TEMP_FILE"

# Check for potential Python syntax errors in migration files
echo -e "\n===== CHECKING PYTHON SYNTAX IN MIGRATION FILES ====="
for file in migrations/versions/*.py; do
  echo "Checking syntax: $file"
  python -m py_compile "$file" || {
    echo "ERROR: Python syntax error in $file"
    exit 1
  }
done
echo "✅ All migration files have valid Python syntax"

# Try running migrations from scratch against the database
echo -e "\n===== TESTING FULL MIGRATION UPGRADE ====="
python -m flask db upgrade

# Try running downgrade and upgrade for each migration (optional)
if [ "${CHECK_DOWNGRADE:-false}" = "true" ]; then
  echo -e "\n===== TESTING DOWNGRADES AND RE-UPGRADES ====="
  
  # Get all migration versions
  ALL_VERSIONS=$(python -m flask db history | grep ":" | awk '{print $1}' | tr -d ',')
  
  for VERSION in $ALL_VERSIONS; do
    echo "Testing downgrade to $VERSION..."
    python -m flask db downgrade "$VERSION"
    
    echo "Testing upgrade from $VERSION..."
    python -m flask db upgrade
  done
  
  echo "✅ All downgrade/upgrade cycles successful"
fi

echo -e "\n===== VERIFICATION COMPLETE ====="
echo "✅ Migrations verified successfully"
exit 0
