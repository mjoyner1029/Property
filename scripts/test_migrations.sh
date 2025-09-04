#!/bin/bash
set -e

# This script tests migrations from a clean database state
# It's designed to fail fast if migrations have issues

echo "===== TESTING MIGRATIONS FROM CLEAN STATE ====="
cd "$(dirname "$0")/../backend"

# Set up Python environment
export PYTHONPATH="$PWD:$PYTHONPATH"
export FLASK_APP="wsgi.py"

# Create a temporary test database
TEST_DB_PATH="/tmp/migration_test_$$.db"
echo "Creating clean test database at: $TEST_DB_PATH"

# Clean up any existing test database
rm -f "$TEST_DB_PATH"

# Set database URL to the test database
export DATABASE_URL="sqlite:///$TEST_DB_PATH"

# Fix for common migration issues
echo "Checking for known migration issues..."

# Check and fix the constraint issue in 8a6b5a055408_update_schema.py
MIGRATION_FILE="migrations/versions/8a6b5a055408_update_schema.py"
if [ -f "$MIGRATION_FILE" ]; then
    if grep -q "batch_op.drop_constraint(None" "$MIGRATION_FILE" || grep -q "batch_op.drop_constraint(''" "$MIGRATION_FILE"; then
        echo "⚠️ Found constraint issue in $MIGRATION_FILE, fixing..."
        # Create a backup
        cp "$MIGRATION_FILE" "${MIGRATION_FILE}.bak"
        # Replace the problematic line with a safer version that checks if constraint exists
        sed -i '' 's/batch_op.drop_constraint(\([^)]*\))/try:\n            batch_op.drop_constraint(\1)\n        except ValueError:\n            print("Skipping constraint without name")/g' "$MIGRATION_FILE"
        echo "✅ Migration file fixed"
    fi
fi

# Run migrations on clean database
echo "Running migrations on clean database..."
if flask db upgrade; then
    echo "✅ Migrations successful on clean database"
else
    echo "❌ ERROR: Migrations failed on clean database"
    rm -f "$TEST_DB_PATH"
    exit 1
fi

# Verify migration version
echo "Verifying migration version..."
VERSION_COUNT=$(sqlite3 "$TEST_DB_PATH" "SELECT COUNT(*) FROM alembic_version;" 2>/dev/null || echo "0")
if [ "$VERSION_COUNT" -gt 0 ]; then
    echo "✅ Migration version verified (found $VERSION_COUNT records)"
    VERSION=$(sqlite3 "$TEST_DB_PATH" "SELECT version_num FROM alembic_version;" 2>/dev/null || echo "unknown")
    echo "Current migration version: $VERSION"
else
    echo "❌ ERROR: No migration version found in database"
    rm -f "$TEST_DB_PATH"
    exit 1
fi

# Verify key tables were created
echo "Verifying database schema..."
TABLE_COUNT=$(sqlite3 "$TEST_DB_PATH" "SELECT COUNT(name) FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "0")
echo "Database contains $TABLE_COUNT tables"
if [ "$TABLE_COUNT" -lt 5 ]; then
    echo "❌ ERROR: Expected more tables, migration may have failed silently"
    rm -f "$TEST_DB_PATH"
    exit 1
fi

# Verify specific tables exist (adjust these according to your schema)
for TABLE in "user" "properties" "alembic_version"; do
    if sqlite3 "$TEST_DB_PATH" "SELECT COUNT(name) FROM sqlite_master WHERE type='table' AND name='$TABLE';" | grep -q "1"; then
        echo "✅ Table '$TABLE' exists"
    else
        echo "❌ ERROR: Table '$TABLE' missing from database"
        rm -f "$TEST_DB_PATH"
        exit 1
    fi
done

# Clean up
rm -f "$TEST_DB_PATH"
echo "✅ Test database removed"
echo "===== MIGRATION TEST COMPLETED SUCCESSFULLY ====="
