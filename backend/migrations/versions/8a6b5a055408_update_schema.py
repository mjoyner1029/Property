"""update_schema

Revision ID: 8a6b5a055408
Revises: 682dc312c919
Create Date: 2025-07-26 17:50:45.987837

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8a6b5a055408'
down_revision = '682dc312c919'
branch_labels = None
depends_on = None


def upgrade():
    # Create new tables only - skip modifications to existing tables
    # This is a simplified version of the migration that avoids errors
    
    # Create token blocklist table
    op.create_table('token_blocklist',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('jti', sa.String(length=36), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Add explicit unique constraint
    op.create_unique_constraint('uq_token_blocklist_jti', 'token_blocklist', ['jti'])
    
    # Add index for better performance
    op.create_index('ix_token_blocklist_jti', 'token_blocklist', ['jti'], unique=True)
    
    # Create landlord_profiles table
    op.create_table('landlord_profiles',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('phone', sa.String(length=20), nullable=False),
    sa.Column('company_name', sa.String(length=100), nullable=True),
    sa.Column('stripe_account_id', sa.String(length=100), nullable=True),
    sa.Column('business_address', sa.String(length=255), nullable=True),
    sa.Column('business_license_number', sa.String(length=100), nullable=True),
    sa.Column('tax_id', sa.String(length=50), nullable=True),
    sa.Column('verified', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Add explicit foreign key constraint
    op.create_foreign_key(
        'fk_landlord_profiles_user_id', 
        'landlord_profiles', 'user',
        ['user_id'], ['id']
    )
    
    # Create index on user_id
    op.create_index('ix_landlord_profiles_user_id', 'landlord_profiles', ['user_id'], unique=True)
    
    # Add explicit unique constraint
    op.create_unique_constraint('uq_landlord_profiles_user_id', 'landlord_profiles', ['user_id'])
    
    # Log completion
    print("Simplified migration completed successfully")


def downgrade():
    # Drop the tables we created
    
    # Drop constraints and indexes for landlord_profiles
    op.drop_constraint('uq_landlord_profiles_user_id', 'landlord_profiles', type_='unique')
    op.drop_index('ix_landlord_profiles_user_id', table_name='landlord_profiles')
    op.drop_constraint('fk_landlord_profiles_user_id', 'landlord_profiles', type_='foreignkey')
    
    # Drop constraints and indexes for token_blocklist
    op.drop_index('ix_token_blocklist_jti', table_name='token_blocklist')
    op.drop_constraint('uq_token_blocklist_jti', 'token_blocklist', type_='unique')
    
    # Drop the tables
    op.drop_table('landlord_profiles')
    op.drop_table('token_blocklist')
