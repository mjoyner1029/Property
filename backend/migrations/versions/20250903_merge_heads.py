"""merge heads

Revision ID: 20250903_merge_heads
Revises: 20250831_notification_updates, 7d4e5f6g7h8i
Create Date: 2025-09-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250903_merge_heads'
# Use tuple for merge migration - fixed to use correct heads
down_revision = ('20250831_notification_updates', '7d4e5f6g7h8i')
branch_labels = None
depends_on = None


def upgrade():
    """This is a merge migration to consolidate all heads."""
    # This is intentionally empty as it's only needed to merge migration heads
    pass


def downgrade():
    """Empty downgrade - this is a merge migration."""
    pass
