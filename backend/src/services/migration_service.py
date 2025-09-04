"""
Migration utilities for checking migration status
"""
from flask import current_app
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import text
from ..extensions import db

def get_current_revision():
    """Get the current database migration revision"""
    try:
        # Get the current migration version
        connection = db.engine.connect()
        context = MigrationContext.configure(connection)
        current_rev = context.get_current_revision()
        connection.close()
        return current_rev
    except Exception as e:
        current_app.logger.error(f"Failed to get current migration revision: {str(e)}")
        return None

def get_latest_migration_head():
    """Get the latest migration head from alembic scripts"""
    try:
        # Get the migration script directory
        from flask_migrate import _get_config
        config = _get_config()
        script = ScriptDirectory.from_config(config)
        
        # Get the head revision
        heads = script.get_heads()
        if heads:
            return heads[0]  # Return the first head if there are multiple
        return None
    except Exception as e:
        current_app.logger.error(f"Failed to get migration heads: {str(e)}")
        return None

def is_database_migrated():
    """Check if the database is at the latest migration head"""
    current_rev = get_current_revision()
    latest_head = get_latest_migration_head()
    
    # If we can't get either revision, consider it not migrated for safety
    if current_rev is None or latest_head is None:
        return False
    
    return current_rev == latest_head

def check_database_connection():
    """Check if the database connection works"""
    try:
        db.session.execute(text("SELECT 1"))
        return True
    except Exception as e:
        current_app.logger.warning(f"Database connection check failed: {str(e)}")
        return False
