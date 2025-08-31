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
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # Add phone field to tenant_profiles table
    op.add_column('tenant_profiles', sa.Column('phone', sa.String(length=32), nullable=True))

    # Add name, file_name, and original_name fields to documents table
    op.add_column('documents', sa.Column('name', sa.String(length=255), nullable=False, server_default=''))
    op.add_column('documents', sa.Column('file_name', sa.String(length=255), nullable=True))
    op.add_column('documents', sa.Column('original_name', sa.String(length=255), nullable=True))

    # Add subject, created_by, and participants fields to message_threads table
    op.add_column('message_threads', sa.Column('subject', sa.String(length=255), nullable=False, server_default=''))
    op.add_column('message_threads', sa.Column('created_by', sa.Integer(), nullable=True))
    op.add_column('message_threads', sa.Column('participants', postgresql.JSON(astext_type=sa.Text()), nullable=True))


def downgrade():
    # Remove fields from message_threads table
    op.drop_column('message_threads', 'participants')
    op.drop_column('message_threads', 'created_by')
    op.drop_column('message_threads', 'subject')

    # Remove fields from documents table
    op.drop_column('documents', 'original_name')
    op.drop_column('documents', 'file_name')
    op.drop_column('documents', 'name')

    # Remove field from tenant_profiles table
    op.drop_column('tenant_profiles', 'phone')
