"""
Create StripeEvent table for webhook idempotency

Revision ID: abc123456789
Revises: (use the appropriate previous migration)
Create Date: 2025-08-30 00:25:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'abc123456789'
down_revision = None  # Update with the appropriate previous revision
branch_labels = None
depends_on = None


def upgrade():
    # Create stripe_events table if it doesn't exist
    op.create_table(
        'stripe_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.String(length=255), nullable=False),
        sa.Column('event_type', sa.String(length=255), nullable=False),
        sa.Column('api_version', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.Column('processed_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.Column('payload', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_stripe_events_event_id', 'stripe_events', ['event_id'], unique=True)
    op.create_index('ix_stripe_events_event_type', 'stripe_events', ['event_type'], unique=False)


def downgrade():
    op.drop_index('ix_stripe_events_event_type', table_name='stripe_events')
    op.drop_index('ix_stripe_events_event_id', table_name='stripe_events')
    op.drop_table('stripe_events')
