"""
Manually apply the stripe_events table migration
"""
import os
import sys
from pathlib import Path

# Add the parent directory to the path so we can import from src
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(backend_dir.parent))

# Set development environment
os.environ['APP_ENV'] = 'development'
os.environ['FLASK_APP'] = 'wsgi.py'

# Import required modules
from src import create_app
from src.extensions import db
import sqlalchemy as sa

app = create_app()

with app.app_context():
    print("Checking for stripe_events table...")
    inspector = db.inspect(db.engine)
    tables = inspector.get_table_names()
    
    if 'stripe_events' not in tables:
        print("Creating stripe_events table...")
        # Create the stripe_events table
        stmt = sa.text("""
        CREATE TABLE IF NOT EXISTS stripe_events (
            id INTEGER PRIMARY KEY,
            event_id VARCHAR(255) NOT NULL UNIQUE,
            event_type VARCHAR(255) NOT NULL,
            api_version VARCHAR(50),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            payload TEXT
        )
        """)
        db.session.execute(stmt)
        db.session.commit()
        print("stripe_events table created successfully!")
    else:
        print("stripe_events table already exists.")
    
    # Verify that payments and invoices tables have amount_cents and currency columns
    for table_name in ['payments', 'invoices']:
        if table_name in tables:
            print(f"Checking {table_name} table...")
            columns = [col['name'] for col in inspector.get_columns(table_name)]
            
            if 'amount_cents' not in columns:
                print(f"Adding amount_cents column to {table_name}...")
                stmt = sa.text(f"ALTER TABLE {table_name} ADD COLUMN amount_cents INTEGER")
                db.session.execute(stmt)
                db.session.commit()
            
            if 'currency' not in columns:
                print(f"Adding currency column to {table_name}...")
                stmt = sa.text(f"ALTER TABLE {table_name} ADD COLUMN currency VARCHAR(3)")
                db.session.execute(stmt)
                db.session.commit()
            
            # Create indexes
            if table_name == 'payments':
                print("Adding indexes to payments...")
                try:
                    stmt = sa.text("CREATE INDEX IF NOT EXISTS ix_payments_created_at ON payments (created_at)")
                    db.session.execute(stmt)
                    
                    stmt = sa.text("CREATE INDEX IF NOT EXISTS ix_payments_payment_intent_id ON payments (payment_intent_id)")
                    db.session.execute(stmt)
                    db.session.commit()
                except Exception as e:
                    print(f"Error creating indexes on payments: {e}")
                    
            elif table_name == 'invoices':
                print("Adding indexes to invoices...")
                try:
                    stmt = sa.text("CREATE INDEX IF NOT EXISTS ix_invoices_created_at ON invoices (created_at)")
                    db.session.execute(stmt)
                    
                    stmt = sa.text("CREATE INDEX IF NOT EXISTS ix_invoices_due_status ON invoices (due_date, status)")
                    db.session.execute(stmt)
                    db.session.commit()
                except Exception as e:
                    print(f"Error creating indexes on invoices: {e}")
    
    print("Manual migrations complete!")

    # Final verification
    inspector = db.inspect(db.engine)
    tables = inspector.get_table_names()
    print("\nVerified tables:")
    for table in tables:
        print(f"- {table}")
