"""maintenance_requests table creation

Revision ID: 8a6b5a055408_maintenance
Revises: 8a6b5a055408
Create Date: 2025-09-04 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8a6b5a055408_maintenance'
down_revision = '8a6b5a055408'
branch_labels = None
depends_on = None


def upgrade():
    # Add maintenance_requests table that was missing from the simplified schema update
    # SQLite-safe implementation
    op.create_table('maintenance_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('property_id', sa.Integer(), nullable=False),
        sa.Column('unit_id', sa.Integer(), nullable=True),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('priority', sa.String(length=20), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('assigned_to', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['assigned_to'], ['user.id'], ),
        sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['unit_id'], ['units.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    # Drop the maintenance_requests table
    op.drop_table('maintenance_requests')
