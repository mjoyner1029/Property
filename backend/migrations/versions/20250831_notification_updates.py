"""Notification model updates

Revision ID: 20250831_notification_updates
Create Date: 2025-08-31 00:33:37.205075
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250831_notification_updates'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None



def upgrade():
    # Skip operations on tables that don't exist
    pass
def downgrade():
    # Nothing to do as we don't want to remove the columns
    pass
