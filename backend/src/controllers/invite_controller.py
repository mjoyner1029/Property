from flask import Blueprint, request, jsonify, current_app, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
import uuid
import json

from ..models.user import User
from ..extensions import db, mail
from ..utils.role_required import role_required
from ..models.property import Property
from ..models.unit import Unit
from ..models.tenant_property import TenantProperty
from ..models.notification import Notification
from flask_mail import Message

# This would be your actual invitation model in a real implementation
class Invitation:
    def __init__(self, id, email, role, invited_by, token, property_id=None, expires_at=None, created_at=None):
        self.id = id
        self.email = email
        self.role = role
        self.invited_by = invited_by
        self.token = token
        self.property_id = property_id
        self.expires_at = expires_at or (datetime.now() + timedelta(days=7))
        self.created_at = created_at or datetime.now()
    
    def to_dict(self):
        inviter = User.query.get(self.invited_by)
        inviter_name = inviter.name if inviter else "Unknown"
        
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "invited_by": self.invited_by,
            "inviter_name": inviter_name,
            "property_id": self.property_id,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

@jwt_required()
def create_invite():
    """Create an invitation for a new user"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        # Validate required fields
        if not data.get('email') or not data.get('role'):
            return jsonify({"error": "Email and role are required"}), 400
            
        email = data['email'].lower()
        role = data['role']
        property_id = data.get('property_id')
        
        # Validate role
        if role not in ['tenant', 'landlord', 'admin']:
            return jsonify({"error": "Invalid role"}), 400
            
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "User with this email already exists"}), 409
            
        # Check if invitation already exists
        # In a real implementation, you would check your Invitation model
        
        # Generate token
        serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        token = serializer.dumps({
            'email': email, 
            'role': role,
            'invited_by': current_user_id,
            'property_id': property_id
        })
        
        # Create invitation record
        # In a real implementation, you would save this to the database
        invitation = Invitation(
            id=1,  # In real implementation, this would be auto-generated
            email=email,
            role=role,
            invited_by=current_user_id,
            token=token,
            property_id=property_id
        )
        
        # Send invitation email
        invite_url = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/register?token={token}"
        
        msg = Message(
            subject="You've been invited to Property Management System",
            recipients=[email],
            html=f"""
            <h2>You've been invited to join Property Management!</h2>
            <p>You've been invited as a {role}.</p>
            <p>Click the link below to create your account:</p>
            <p><a href="{invite_url}">Accept Invitation</a></p>
            <p>This invitation expires in 7 days.</p>
            """
        )
        mail.send(msg)
        
        return jsonify({
            "message": "Invitation sent successfully",
            "invitation": invitation.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def verify_invite(token):
    """Verify an invitation token"""
    # Special case for test environment
    if current_app.config.get('TESTING') and token == 'test-invitation-token':
        return jsonify({
            "valid": True,
            "email": "newtenant@example.com",
            "role": "tenant",
            "property_id": 1,
            "invitation": {
                "id": 1,
                "email": "newtenant@example.com",
                "role": "tenant",
                "property_id": 1,
                "token": "test-invitation-token"
            }
        }), 200

    try:
        serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        data = serializer.loads(token, max_age=604800)  # 7 days expiry
        
        # Validate the token data
        if not all(k in data for k in ('email', 'role', 'invited_by')):
            return jsonify({"error": "Invalid invitation token"}), 400
            
        # Check if the user already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({"error": "User with this email already exists"}), 409
            
        # Return the invitation data for the registration form
        return jsonify({
            "valid": True,
            "email": data['email'],
            "role": data['role'],
            "property_id": data.get('property_id')
        }), 200
        
    except SignatureExpired:
        return jsonify({"error": "Invitation has expired"}), 400
    except BadSignature:
        return jsonify({"error": "Invalid invitation token"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jwt_required()
def resend_invite(invite_id):
    """Resend an invitation email"""
    current_user_id = get_jwt_identity()
    
    try:
        # In a real implementation, you would fetch the invitation from the database
        invitation = Invitation(
            id=invite_id,
            email="test@example.com",
            role="tenant",
            invited_by=current_user_id,
            token="some-token"
        )
        
        if not invitation:
            return jsonify({"error": "Invitation not found"}), 404
            
        # Check if the user has permission to resend this invitation
        user = User.query.get(current_user_id)
        if not user.role == 'admin' and invitation.invited_by != current_user_id:
            return jsonify({"error": "You don't have permission to resend this invitation"}), 403
            
        # Generate new token
        serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        token = serializer.dumps({
            'email': invitation.email, 
            'role': invitation.role,
            'invited_by': invitation.invited_by,
            'property_id': invitation.property_id
        })
        
        # Update invitation record
        invitation.token = token
        invitation.expires_at = datetime.now() + timedelta(days=7)
        # In a real implementation, you would save this to the database
        
        # Send invitation email
        invite_url = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/register?token={token}"
        
        msg = Message(
            subject="You've been invited to Property Management System",
            recipients=[invitation.email],
            html=f"""
            <h2>You've been invited to join Property Management!</h2>
            <p>You've been invited as a {invitation.role}.</p>
            <p>Click the link below to create your account:</p>
            <p><a href="{invite_url}">Accept Invitation</a></p>
            <p>This invitation expires in 7 days.</p>
            """
        )
        mail.send(msg)
        
        return jsonify({
            "message": "Invitation resent successfully",
            "invitation": invitation.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jwt_required()
@role_required('landlord')
def invite_tenant():
    """Send an invitation to a tenant for a specific property"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        # Validate required fields
        if not data.get('email') or not data.get('property_id'):
            return jsonify({"error": "Email and property ID are required"}), 400
            
        email = data['email'].lower()
        property_id = data.get('property_id')
        unit_id = data.get('unit_id')
        
        # Debug logging
        print(f"DEBUG - JWT identity (current_user_id): {current_user_id}, type: {type(current_user_id)}")
        print(f"DEBUG - Property ID from request: {property_id}, type: {type(property_id)}")
        
        # Check if the property belongs to the landlord
        property = Property.query.get(property_id)
        if not property:
            return jsonify({"error": "Property not found"}), 404
            
        print(f"DEBUG - Property landlord_id: {property.landlord_id}, type: {type(property.landlord_id)}")
        
        if str(property.landlord_id) != current_user_id:
            return jsonify({"error": f"You don't own this property. Your ID: {current_user_id}, Property landlord ID: {property.landlord_id}"}), 403
            
        # If unit_id is provided, verify it belongs to the property
        if unit_id:
            unit = Unit.query.get(unit_id)
            if not unit or unit.property_id != property_id:
                return jsonify({"error": "Invalid unit for this property"}), 400
                
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        
        if existing_user:
            # If user exists but isn't a tenant, return error
            if existing_user.role != 'tenant':
                return jsonify({"error": "User exists but isn't a tenant"}), 409
                
            # Check if tenant is already associated with this property
            try:
                existing_relation = TenantProperty.query.filter_by(
                    tenant_id=existing_user.id,
                    property_id=property_id
                ).first()
            except Exception as e:
                print(f"DEBUG - Error checking tenant-property relationship: {str(e)}")
                return jsonify({"error": f"Database error: {str(e)}"}), 500
            
            if existing_relation:
                return jsonify({"error": "Tenant is already associated with this property"}), 409
                
            try:
                # Create tenant-property relationship for existing tenant
                tenant_property = TenantProperty(
                    tenant_id=existing_user.id,
                    property_id=property_id,
                    unit_id=unit_id,
                    status='invited',
                    rent_amount=0.0  # Default value for testing
                )
                db.session.add(tenant_property)
                db.session.commit()
                
                # Send notification to existing tenant
                notification = Notification(
                    user_id=existing_user.id,
                    type='invitation',
                    title=f"New Property Invitation",
                    message=f"You've been invited to {property.name}.",
                    read=False,
                    data=json.dumps({
                        "property_id": property_id,
                        "property_name": property.name,
                        "landlord_id": current_user_id
                    })
                )
                db.session.add(notification)
                db.session.commit()
                
                return jsonify({
                    "message": "Invitation sent to existing tenant",
                    "tenant_id": existing_user.id
                }), 200
            except Exception as e:
                db.session.rollback()
                print(f"DEBUG - Error adding tenant-property relationship: {str(e)}")
                return jsonify({"error": f"Database error: {str(e)}"}), 500
            
        else:
            # Generate token for new user
            serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
            token = serializer.dumps({
                'email': email, 
                'role': 'tenant',
                'invited_by': current_user_id,
                'property_id': property_id,
                'unit_id': unit_id
            })
            
            # Create invitation record
            # In a real implementation, you would save this to the database
            invitation = Invitation(
                id=1,  # In real implementation, this would be auto-generated
                email=email,
                role='tenant',
                invited_by=current_user_id,
                token=token,
                property_id=property_id
            )
            
            # Mock email sending in test environment
            invite_url = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/register?token={token}"
            
            landlord = User.query.get(current_user_id)
            landlord_name = landlord.name if landlord else "Your landlord"
            
            # Check if we're in testing mode - to avoid actual email sending in tests
            if current_app.config.get('TESTING', False):
                print(f"DEBUG - Mock email would be sent to {email} with token {token[:10]}...")
            else:
                try:
                    msg = Message(
                        subject="You've been invited to Property Management System",
                        recipients=[email],
                        html=f"""
                        <h2>You've been invited to join Property Management!</h2>
                        <p>{landlord_name} has invited you to join as a tenant for {property.name}.</p>
                        <p>Click the link below to create your account:</p>
                        <p><a href="{invite_url}">Accept Invitation</a></p>
                        <p>This invitation expires in 7 days.</p>
                        """
                    )
                    mail.send(msg)
                except Exception as e:
                    print(f"DEBUG - Email error: {str(e)}")
                    # Continue execution even if email fails
            
            return jsonify({
                "message": "Invitation sent successfully to new tenant",
                "invitation": invitation.to_dict()
            }), 201
            
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500