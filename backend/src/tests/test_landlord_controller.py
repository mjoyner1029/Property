"""
Test file for landlord controller endpoints
"""
import pytest
import json
from flask_jwt_extended import create_access_token

from src.models.user import User
from src.models.landlord_profile import LandlordProfile
from src.models.property import Property
from src.models.tenant_property import TenantProperty
from src.models.stripe_account import StripeAccount
from src.extensions import db


class TestLandlordController:
    """Test suite for landlord controller endpoints"""
    
    @pytest.fixture
    def landlord_user(self, app):
        """Create a test landlord user"""
        with app.app_context():
            user = User(
                email="landlord@test.com",
                password="SecureP@ssw0rd123",
                first_name="Test",
                last_name="Landlord",
                role="landlord",
                is_verified=True,
                created_at="2023-01-01"
            )
            db.session.add(user)
            db.session.commit()
            
            profile = LandlordProfile(
                user_id=user.id,
                company_name="Test Properties LLC",
                phone="555-123-4567",
                address="123 Landlord St",
                city="Propertyville",
                state="CA",
                zip_code="90210"
            )
            db.session.add(profile)
            db.session.commit()
            
            return user
    
    @pytest.fixture
    def auth_headers(self, landlord_user):
        """Create authentication headers for the test landlord user"""
        token = create_access_token(identity=landlord_user.id)
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def test_property(self, landlord_user, app):
        """Create a test property owned by the landlord"""
        with app.app_context():
            property = Property(
                name="Test Property",
                address="123 Test St",
                city="Testville",
                state="CA",
                zip_code="90210",
                description="Test property description",
                landlord_id=landlord_user.id
            )
            db.session.add(property)
            db.session.commit()
            return property
    
    def test_get_landlord_profile(self, client, auth_headers):
        """Test retrieving the landlord's profile"""
        response = client.get("/api/landlords/profile", headers=auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "profile" in data
        assert data["profile"]["company_name"] == "Test Properties LLC"
        assert data["profile"]["phone"] == "555-123-4567"
    
    def test_update_landlord_profile(self, client, auth_headers):
        """Test updating the landlord's profile"""
        payload = {
            "company_name": "Updated Properties LLC",
            "phone": "555-987-6543",
            "address": "456 Landlord Ave",
            "city": "Newcity",
            "state": "NY",
            "zip_code": "10001"
        }
        response = client.put("/api/landlords/profile", 
                             headers=auth_headers,
                             json=payload)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["profile"]["company_name"] == "Updated Properties LLC"
        assert data["profile"]["phone"] == "555-987-6543"
        assert data["profile"]["city"] == "Newcity"
    
    def test_get_landlord_properties(self, client, auth_headers, test_property):
        """Test retrieving the landlord's properties"""
        response = client.get("/api/landlords/properties", headers=auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "properties" in data
        assert len(data["properties"]) >= 1
        assert data["properties"][0]["name"] == "Test Property"
    
    def test_get_landlord_tenants(self, client, auth_headers, test_property, app):
        """Test retrieving the landlord's tenants"""
        with app.app_context():
            # Create a tenant association
            tenant_property = TenantProperty(
                tenant_id=999,  # This is just a placeholder ID
                property_id=test_property.id,
                rent_amount=1500,
                rent_due_day=1,
                status="active"
            )
            db.session.add(tenant_property)
            db.session.commit()
            
            response = client.get("/api/landlords/tenants", headers=auth_headers)
            assert response.status_code == 200
            data = json.loads(response.data)
            assert "tenants" in data
    
    def test_get_landlord_dashboard(self, client, auth_headers):
        """Test retrieving the landlord's dashboard data"""
        response = client.get("/api/landlords/dashboard", headers=auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "dashboard" in data
        assert "stats" in data["dashboard"]
    
    def test_unauthorized_access(self, client):
        """Test accessing landlord endpoints without authentication"""
        response = client.get("/api/landlords/profile")
        assert response.status_code == 401
    
    def test_wrong_role_access(self, client, app):
        """Test accessing landlord endpoints with wrong role"""
        with app.app_context():
            # Create a tenant user
            tenant = User(
                email="tenant@test.com",
                password="SecureP@ssw0rd123",
                first_name="Test",
                last_name="Tenant",
                role="tenant",
                is_verified=True
            )
            db.session.add(tenant)
            db.session.commit()
            
            # Create token with tenant role
            token = create_access_token(identity=tenant.id)
            headers = {"Authorization": f"Bearer {token}"}
            
            response = client.get("/api/landlords/profile", headers=headers)
            assert response.status_code == 403
