"""add_missing_model_fields

Revision ID: 20250830_missing_fields
Revises: a1b2c3d4e5f6
Create Date: 2025-08-30 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250830_missing_fields'
down_revision = 'abc123456789'
branch_labels = None
depends_on = None



def upgrade():
    # Skip operations on tables that don't exist
    pass

def downgrade():
    # Skip operations on tables that don't exist
    pass
