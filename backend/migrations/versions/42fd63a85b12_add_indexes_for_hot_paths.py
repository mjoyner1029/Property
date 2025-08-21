"""Add indexes for performance hot paths

Revision ID: 42fd63a85b12
Revises: (use the most recent revision ID here)
Create Date: 2025-08-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '42fd63a85b12'
down_revision = None  # Replace with your actual previous migration
branch_labels = None
depends_on = None


def upgrade():
    # Add index to properties.org_id for faster multi-tenant lookups
    op.create_index('ix_properties_org_id', 'properties', ['org_id'], unique=False)
    
    # Add index to payments.tenant_id for faster payment history lookups
    op.create_index('ix_payments_tenant_id', 'payments', ['tenant_id'], unique=False)
    
    # Add composite index for payments.created_at + tenant_id for date-range payment lookups
    op.create_index('ix_payments_tenant_date', 'payments', ['tenant_id', 'created_at'], unique=False)
    
    # Add index to tenants table for faster lookups by property
    op.create_index('ix_tenants_property_id', 'tenants', ['property_id'], unique=False)


def downgrade():
    # Remove all indexes in reverse order
    op.drop_index('ix_tenants_property_id', table_name='tenants')
    op.drop_index('ix_payments_tenant_date', table_name='payments')
    op.drop_index('ix_payments_tenant_id', table_name='payments')
    op.drop_index('ix_properties_org_id', table_name='properties')
