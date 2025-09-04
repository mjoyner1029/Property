"""money_and_stripe_events

Revision ID: 20250825_money_and_stripe_events
Revises: 8a6b5a055408
Create Date: 2025-08-25 12:00:00
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "20250825_money_and_stripe_events"
down_revision = '20250819_1430_noop'
branch_labels = None
depends_on = None


def upgrade():
    # stripe_events table if not exists
    op.create_table(
        "stripe_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_id", sa.String(length=255), nullable=False, unique=True),
        sa.Column("event_type", sa.String(length=255), nullable=False),
        sa.Column("api_version", sa.String(length=50)),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("processed_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("payload", sa.Text(), nullable=True),
    )
    # Skip all operations on tables that don't exist

def downgrade():
    op.drop_table("stripe_events")
