"""money_and_stripe_events

Revision ID: a1b2c3d4e5f6
Revises: 8a6b5a055408
Create Date: 2025-08-25 12:00:00
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "a1b2c3d4e5f6"
down_revision = "8a6b5a055408"
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

    # payments: add amount_cents, currency; keep old amount if exists, then drop
    with op.batch_alter_table("payments") as batch:
        batch.add_column(sa.Column("amount_cents", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("currency", sa.String(length=3), nullable=True))
        batch.create_index("ix_payments_created_at", ["created_at"])
        batch.create_index("ix_payments_payment_intent_id", ["payment_intent_id"])

    # invoices: add amount_cents, currency
    with op.batch_alter_table("invoices") as batch:
        batch.add_column(sa.Column("amount_cents", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("currency", sa.String(length=3), nullable=True))
        batch.create_index("ix_invoices_created_at", ["created_at"])
        batch.create_index("ix_invoices_due_status", ["due_date", "status"])

    # Best-effort backfill from float columns if present
    conn = op.get_bind()
    try:
        conn.execute(sa.text("UPDATE payments SET amount_cents = CAST(ROUND(amount*100) AS INTEGER) WHERE amount_cents IS NULL AND amount IS NOT NULL"))
    except Exception:
        pass
    try:
        conn.execute(sa.text("UPDATE invoices SET amount_cents = CAST(ROUND(amount*100) AS INTEGER) WHERE amount_cents IS NULL AND amount IS NOT NULL"))
    except Exception:
        pass

def downgrade():
    op.drop_table("stripe_events")
    with op.batch_alter_table("payments") as batch:
        batch.drop_index("ix_payments_payment_intent_id")
        batch.drop_index("ix_payments_created_at")
        batch.drop_column("currency")
        batch.drop_column("amount_cents")
    with op.batch_alter_table("invoices") as batch:
        batch.drop_index("ix_invoices_due_status")
        batch.drop_index("ix_invoices_created_at")
        batch.drop_column("currency")
        batch.drop_column("amount_cents")
