"""Add alias square_feet to Property and Unit models

Revision ID: a1b2c3d4e5f6_alias
Revises: 9a7c4d21e508
Create Date: 2025-08-29 15:55:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6_alias'
down_revision = '20250831_add_field_aliases'  # Replace with your actual down_revision
branch_labels = None
depends_on = None


def upgrade():
    # This is a no-op migration as the changes are Python-level only
    # We're adding @property methods for square_feet that map to existing columns:
    # - Property.square_footage
    # - Unit.size
    pass


def downgrade():
    # No database changes to revert
    pass
