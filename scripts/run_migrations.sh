#!/bin/bash
set -e

echo "===== STARTING DATABASE MIGRATIONS ====="
cd "$(dirname "$0")/../backend"

# Set up Python environment
export PYTHONPATH="$PWD:$PYTHONPATH"
export FLASK_APP="wsgi.py"

# Check if the database URL is set, use SQLite fallback if not
if [ -z "$DATABASE_URL" ]; then
    echo "WARNING: DATABASE_URL environment variable not set"
    echo "Using SQLite fallback database for local development"
    
    # Create instance directory if it doesn't exist
    mkdir -p instance
    
    # Set SQLite database path with absolute path
    DB_PATH="$(pwd)/instance/app.db"
    echo "Using SQLite database at: $DB_PATH"
    export DATABASE_URL="sqlite:///$DB_PATH"
fi

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

echo "Running Flask database migrations..."
# Run migrations with failure detection
if flask db upgrade; then
    echo "✅ Migrations completed successfully!"
else
    echo "❌ ERROR: Database migrations failed"
    exit 1
fi

# Verify alembic version table has an entry
echo "Verifying migration version..."
if [ "${DATABASE_URL#*sqlite}" != "$DATABASE_URL" ]; then
    # SQLite database
    if [ -f "${DATABASE_URL#sqlite:///}" ]; then
        VERSION_COUNT=$(sqlite3 "${DATABASE_URL#sqlite:///}" "SELECT COUNT(*) FROM alembic_version;" 2>/dev/null || echo "0")
        if [ "$VERSION_COUNT" -gt 0 ]; then
            echo "✅ Migration version verified (found $VERSION_COUNT records)"
            VERSION=$(sqlite3 "${DATABASE_URL#sqlite:///}" "SELECT version_num FROM alembic_version;" 2>/dev/null || echo "unknown")
            echo "Current migration version: $VERSION"
        else
            echo "❌ ERROR: No migration version found in database"
            exit 1
        fi
    else
        echo "⚠️ WARNING: Could not verify migration version - database file not found"
    fi
else
    echo "⚠️ Migration version check skipped for non-SQLite database"
fi

echo "===== DATABASE MIGRATIONS COMPLETE ====="
