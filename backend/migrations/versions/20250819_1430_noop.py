"""No-op migration to maintain revision continuity.

This migration does not apply any schema changes. It exists only to
synchronize Alembic's revision history between `9a7c4d21e508` and
subsequent revisions.

Keeping this file ensures that migration history remains linear and
verifiable, even though no changes are introduced here.
"""

from alembic import op
import sqlalchemy as sa  # noqa: F401  (kept for Alembic autogenerate compatibility)

# Revision identifiers, used by Alembic.
revision = "20250819_1430_noop"
down_revision = '7d4e5f6g7h8i'
branch_labels = None
depends_on = None


def upgrade():
    """Explicitly mark as no-op upgrade."""
    bind = op.get_bind()
    bind.execute(sa.text("SELECT 1"))  # harmless statement for verification


def downgrade():
    """Explicitly mark as no-op downgrade."""
    bind = op.get_bind()
    bind.execute(sa.text("SELECT 1"))  # harmless statement for verification
