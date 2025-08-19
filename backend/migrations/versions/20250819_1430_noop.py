"""
No-op migration to verify Render runs migrations correctly.
Revision ID: 7e57ad2f9a3c
Revises: (use the latest migration revision from your project)
Create Date: 2025-08-19 14:30:24.423829
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = '7e57ad2f9a3c'
down_revision = None  # Change this to your latest migration revision
branch_labels = None
depends_on = None

def upgrade():
    """
    No-op upgrade function.
    This migration performs no database changes and is used to verify
    that the migration process works correctly on deployment.
    """
    pass

def downgrade():
    """
    No-op downgrade function.
    """
    pass
