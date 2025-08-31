"""Add field aliases for backwards compatibility with tests

Revision ID: 20250831_add_field_aliases
Revises: 20250830_missing_fields
Create Date: 2025-08-31 00:25:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250831_add_field_aliases'
down_revision = '20250830_missing_fields'
branch_labels = None
depends_on = None


def upgrade():
    # These are virtual fields (aliases) with property/setter methods in Python code
    # No database changes are needed for this migration
    pass


def downgrade():
    # No database changes to revert
    pass
