"""
Create StripeEvent table for webhook idempotency

Revision ID: abc123456789
Revises: a1b2c3d4e5f6_alias
Create Date: 2025-08-30 00:25:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'abc123456789'
down_revision = 'a1b2c3d4e5f6_alias'
down_revision = '20250825_money_and_stripe_events'  # Update with the appropriate previous revision
branch_labels = None
depends_on = None



def upgrade():
    # Skip creating stripe_events table as it was already created in previous migration
    # Just create the indexes
    op.create_index('ix_stripe_events_event_id', 'stripe_events', ['event_id'], unique=True)
    op.create_index('ix_stripe_events_event_type', 'stripe_events', ['event_type'], unique=False)

def downgrade():
    op.drop_index('ix_stripe_events_event_type', table_name='stripe_events')
    op.drop_index('ix_stripe_events_event_id', table_name='stripe_events')
    op.drop_table('stripe_events')
