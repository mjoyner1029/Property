"""Notification model updates

Revision ID: 20250831_notification_updates
Create Date: 2025-08-31 00:33:37.205075
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250831_notification_updates'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add is_read boolean column with default False if not exists
    op.execute("PRAGMA foreign_keys=off")
    op.execute("""
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;
    """)
    
    # Add property_id column with foreign key if not exists
    op.execute("""
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS property_id INTEGER REFERENCES property(id);
    """)
    
    # Add updated_at column if not exists
    op.execute("""
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
    """)
    
    # Set updated_at to created_at if NULL
    op.execute("""
    UPDATE notifications SET updated_at = created_at WHERE updated_at IS NULL;
    """)
    
    # Update is_read to match read for existing records
    op.execute("""
    UPDATE notifications SET is_read = read WHERE is_read != read;
    """)
    
    op.execute("PRAGMA foreign_keys=on")


def downgrade():
    # Nothing to do as we don't want to remove the columns
    pass
