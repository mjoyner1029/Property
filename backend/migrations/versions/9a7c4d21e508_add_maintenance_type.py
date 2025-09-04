"""add_maintenance_type

Revision ID: 9a7c4d21e508
Revises: 8a6b5a055408
Create Date: 2025-08-07 16:35:45.123456

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9a7c4d21e508'
down_revision = '8a6b5a055408'
branch_labels = None
depends_on = None


def upgrade():
    # Safe implementation that checks if table exists before adding column
    bind = op.get_bind()
    insp = sa.inspect(bind)
    
    # Check both possible table names (singular and plural)
    if "maintenance_requests" in insp.get_table_names():
        with op.batch_alter_table("maintenance_requests") as batch_op:
            batch_op.add_column(sa.Column("maintenance_type", sa.String(100)))
    elif "maintenance_request" in insp.get_table_names():
        with op.batch_alter_table("maintenance_request") as batch_op:
            batch_op.add_column(sa.Column("maintenance_type", sa.String(100)))
    else:
        op.get_context().impl.warn("maintenance_requests table missing; skipping maintenance_type")


def downgrade():
    # Safe implementation that checks if table exists before dropping column
    bind = op.get_bind()
    insp = sa.inspect(bind)
    
    # Check both possible table names (singular and plural)
    if "maintenance_requests" in insp.get_table_names():
        with op.batch_alter_table("maintenance_requests") as batch_op:
            batch_op.drop_column("maintenance_type")
    elif "maintenance_request" in insp.get_table_names():
        with op.batch_alter_table("maintenance_request") as batch_op:
            batch_op.drop_column("maintenance_type")
    else:
        op.get_context().impl.warn("maintenance_requests table missing; skipping maintenance_type removal")
