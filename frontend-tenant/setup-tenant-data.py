#!/usr/bin/env python3
import sqlite3
import datetime

def create_tenant_data():
    print("Creating tenant test data for Asset Anchor...")
    
    conn = sqlite3.connect('/Users/mjoyner/Property/backend/app.db')
    cursor = conn.cursor()
    
    try:
        # 1. Get tenant ID
        cursor.execute("SELECT id FROM user WHERE email='tenant@example.com'")
        result = cursor.fetchone()
        tenant_id = result[0] if result else None
        
        if not tenant_id:
            print("Tenant user not found!")
            return False
            
        print(f"Found tenant with ID: {tenant_id}")
        
        # 2. Check if we have a property
        cursor.execute("SELECT id FROM properties LIMIT 1")
        result = cursor.fetchone()
        property_id = result[0] if result else None
        
        if not property_id:
            print("Creating a test property...")
            # Create a test property
            cursor.execute("""
            INSERT INTO properties (
                landlord_id, name, address, city, state, zip_code,
                property_type, bedrooms, bathrooms, square_footage,
                year_built, description, status
            ) VALUES (
                1, 'Tenant Test Property', '456 Tenant Ave', 'Anytown', 'CA', '12345',
                'apartment', 2, 1, 1000, 2020,
                'A test property for tenant view testing',
                'available'
            )
            """)
            property_id = cursor.lastrowid
            print(f"Created property with ID: {property_id}")
        else:
            print(f"Using existing property with ID: {property_id}")
        
        # 3. Associate tenant with property
        cursor.execute("SELECT COUNT(*) FROM tenant_properties WHERE tenant_id = ?", (tenant_id,))
        tenant_property_count = cursor.fetchone()[0]
        
        if tenant_property_count == 0:
            print("Creating tenant-property association...")
            cursor.execute("""
            INSERT INTO tenant_properties (
                tenant_id, property_id, rent_amount, status, start_date
            ) VALUES (
                ?, ?, 1200, 'active', ?
            )
            """, (tenant_id, property_id, datetime.datetime.now().isoformat()))
            print("Created tenant-property association")
        else:
            print("Tenant-property association already exists")
            
        # 4. Create some maintenance requests for this tenant
        cursor.execute("SELECT COUNT(*) FROM maintenance_requests WHERE tenant_id = ?", (tenant_id,))
        request_count = cursor.fetchone()[0]
        
        if request_count < 2:
            print("Creating sample maintenance requests for tenant...")
            
            # Plumbing request
            cursor.execute("""
            INSERT INTO maintenance_requests (
                property_id, tenant_id, title, description,
                maintenance_type, priority, status
            ) VALUES (
                ?, ?, 'Leaking Faucet', 'The kitchen faucet is dripping constantly.',
                'plumbing', 'medium', 'open'
            )
            """, (property_id, tenant_id))
            
            # Electrical request
            cursor.execute("""
            INSERT INTO maintenance_requests (
                property_id, tenant_id, title, description,
                maintenance_type, priority, status
            ) VALUES (
                ?, ?, 'Power Outlet Not Working', 'The outlet in the living room does not work.',
                'electrical', 'high', 'open'
            )
            """, (property_id, tenant_id))
            
            print("Created sample maintenance requests")
        else:
            print(f"Tenant already has {request_count} maintenance requests")
        
        conn.commit()
        print("Tenant data setup completed successfully")
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"Error creating tenant data: {str(e)}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    create_tenant_data()
