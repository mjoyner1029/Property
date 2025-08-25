"""No-op migration to align Alembic revision history.

This migration does not introduce any schema changes.
It exists only as a placeholder to maintain continuity
in the revision chain between `42fd63a85b12` and later revisions.
"""

from alembic import op
import sqlalchemy as sa  # noqa: F401  # needed for Alembic autogenerate to run

# Revision identifiers, used by Alembic.
revision = "20250820_noop"
down_revision = "42fd63a85b12"
branch_labels = None
depends_on = None


def upgrade():
    """No changes required for this migration."""
    # Explicitly no-op
    return


def downgrade():
    """No changes to revert in this migration."""
    # Explicitly no-op
    return
