import pytest
import json
from src.extensions import db


def test_create_unit(client, test_users, auth_headers, app, db):
    """Test creating a unit for a property"""
    from src.models.property import Property
    
    with app.app_context():
        # Create a test property directly
        landlord = test_users['landlord']
        
        # Create a fresh property for this test
        import uuid
        unique_name = f"Test Property {uuid.uuid4()}"
        
        test_property = Property(
            name=unique_name,
            address="123 Test St",
            city="Testville",
            state="TS",
            zip_code="12345",
            landlord_id=landlord.id,
            status="active"
        )
        db.session.add(test_property)
        db.session.commit()
        
        property_id = test_property.id
        
def test_get_units_by_property(client, test_users, app, db):
    """Test getting all units in a property"""
    from src.models.property import Property
    from src.models.unit import Unit
    from flask_jwt_extended import create_access_token
    import json

    with app.app_context():
        # Create a test property and units directly
        landlord = test_users['landlord']
        
        # Create a fresh property for this test
        import uuid
        unique_name = f"Test Property {uuid.uuid4()}"

        test_property = Property(
            name=unique_name,
            address="123 Test St",
            city="Testville",
            state="TS",
            zip_code="12345",
            landlord_id=landlord.id,  # Ensure we use the landlord from test_users
            status="active"
        )
        db.session.add(test_property)
        db.session.flush()
        
        # Create multiple test units
        units = []
        for i in range(3):
            test_unit = Unit(
                property_id=test_property.id,
                unit_number=f"{101+i}",
                bedrooms=2,
                bathrooms=1,
                size=1000,
                status="available"
            )
            db.session.add(test_unit)
            units.append(test_unit)

        db.session.commit()
        property_id = test_property.id
        
        # Make sure we're using the landlord's ID as a string
        landlord_id_str = str(landlord.id)
        
        # Create token with explicit role
        token = create_access_token(
            identity=landlord_id_str,
            additional_claims={"role": "landlord", "portal": "landlord"}
        )
        headers = {"Authorization": f"Bearer {token}"}

        # Use the landlord token to access the property
        response = client.get(f'/api/units/property/{property_id}', headers=headers)

        # The test should pass now since we're using the correct landlord token for a property 
        # created by the same landlord user
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'units' in data
        # We should have 3 available units that we created in this test
        assert len([u for u in data['units'] if u['status'] == 'available']) == 3
        
        # Verify unit numbers match what we created
        unit_numbers = sorted([unit['unit_number'] for unit in data['units']])
        expected_unit_numbers = ['101', '102', '103']
        assert unit_numbers == expected_unit_numbers
        
        # Verify property_id for each unit
        for unit in data['units']:
            assert unit['property_id'] == property_id


def test_get_units_for_property(client, test_users, app, db):
    """Test getting all units for a property"""
    from src.models.property import Property
    from src.models.unit import Unit
    from flask_jwt_extended import create_access_token
    
    with app.app_context():
        # Create a test property and units directly
        landlord = test_users['landlord']
        
        # Create a fresh property for this test
        import uuid
        unique_name = f"Test Property {uuid.uuid4()}"
        
        test_property = Property(
            name=unique_name,
            address="123 Test St",
            city="Testville",
            state="TS",
            zip_code="12345",
            landlord_id=landlord.id,
            status="active"
        )
        db.session.add(test_property)
        db.session.flush()
        
        # Create multiple test units
        for i in range(3):
            test_unit = Unit(
                property_id=test_property.id,
                unit_number=f"{101+i}",
                bedrooms=2,
                bathrooms=1,
                size=1000,
                status="available"
            )
            db.session.add(test_unit)
        
        db.session.commit()
        property_id = test_property.id

        # Create token with explicit role
        token = create_access_token(
            identity=str(landlord.id),
            additional_claims={"role": "landlord", "portal": "landlord"}
        )
        headers = {"Authorization": f"Bearer {token}"}
        
        # Use the landlord token to access the property
        response = client.get(f'/api/units/property/{property_id}', headers=headers)
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'units' in data
    assert len(data['units']) >= 3  # We created 3 units in the fixture
    
    # Verify each unit has property_id matching the test property
    for unit in data['units']:
        assert unit['property_id'] == property_id


def test_update_unit(client, test_users, auth_headers, app, db):
    """Test updating a unit"""
    from src.models.property import Property
    from src.models.unit import Unit
    
    with app.app_context():
        # Create a test property and unit directly
        landlord = test_users['landlord']
        
        # Create a fresh property for this test
        import uuid
        unique_name = f"Test Property {uuid.uuid4()}"
        
        test_property = Property(
            name=unique_name,
            address="123 Test St",
            city="Testville",
            state="TS",
            zip_code="12345",
            landlord_id=landlord.id,
            status="active"
        )
        db.session.add(test_property)
        db.session.flush()
        
        # Create a test unit
        test_unit = Unit(
            property_id=test_property.id,
            unit_number="101",
            bedrooms=2,
            bathrooms=1,
            size=1000,
            status="available"
        )
        db.session.add(test_unit)
        db.session.commit()
        
        unit_id = test_unit.id
    response = client.put(f'/api/units/{unit_id}',
                         headers=auth_headers['landlord'],
                         json={
                             'rent_amount': 1300,
                             'status': 'maintenance'
                         })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['unit']['rent_amount'] == 1300
    assert data['unit']['status'] == 'maintenance'


def test_get_available_units(client, test_users, auth_headers, app, db):
    """Test filtering units by availability"""
    from src.models.property import Property
    from src.models.unit import Unit
    
    with app.app_context():
        # Create a test property and units directly
        landlord = test_users['landlord']
        
        # Create a fresh property for this test
        import uuid
        unique_name = f"Test Property {uuid.uuid4()}"
        
        test_property = Property(
            name=unique_name,
            address="123 Test St",
            city="Testville",
            state="TS",
            zip_code="12345",
            landlord_id=landlord.id,
            status="active"
        )
        db.session.add(test_property)
        db.session.flush()
        
        # Create multiple test units with different statuses
        for i in range(3):
            test_unit = Unit(
                property_id=test_property.id,
                unit_number=f"{101+i}",
                bedrooms=2,
                bathrooms=1,
                size=1000,
                status="available"
            )
            db.session.add(test_unit)
        
        # Add one non-available unit
        test_unit = Unit(
            property_id=test_property.id,
            unit_number="104",
            bedrooms=2,
            bathrooms=1,
            size=1000,
            status="occupied"
        )
        db.session.add(test_unit)
        db.session.commit()
        
        property_id = test_property.id
        
    response = client.get(f'/api/units/available?property_id={property_id}',
                         headers=auth_headers['landlord'])
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'units' in data
    # We should have 3 available units from this test
    assert len([u for u in data['units'] if u['status'] == 'available']) == 3