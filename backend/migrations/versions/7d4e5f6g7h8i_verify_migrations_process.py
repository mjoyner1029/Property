"""Verification checkpoint migration.

Purpose:
- Ensures the Alembic migration pipeline is functioning end-to-end.
- Acts as a documented no-op between `20250819_1430_noop` and later revisions.
- Avoids bare stubs (`pass`) that create confusion in history.

No schema changes are introduced by this migration.
"""

from alembic import op
import sqlalchemy as sa  # noqa: F401  (kept so autogenerate/env don't strip imports)

# Revision identifiers, used by Alembic.
revision = "7d4e5f6g7h8i"
down_revision = '20250820_noop'
branch_labels = None
depends_on = None


def upgrade():
    """Explicit no-op: run a harmless statement to verify the pipeline."""
    # This SELECT is portable and ensures the migration is not an empty stub.
    bind = op.get_bind()
    bind.execute(sa.text("SELECT 1"))


def downgrade():
    """Nothing to undo; this migration made no schema changes."""
    # Keep symmetry with upgrade; no changes to revert.
    bind = op.get_bind()
    bind.execute(sa.text("SELECT 1"))
