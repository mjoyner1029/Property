from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.user import User
from ..models.payment import Payment
from ..models.tenant_property import TenantProperty
from ..models.property import Property
from ..services.stripe_service import StripeService
from ..extensions import db
import logging
import stripe
import os
from datetime import datetime
from sqlalchemy import desc
from ..utils.role_required import role_required

logger = logging.getLogger(__name__)

# Initialize Stripe service
stripe_service = StripeService()

@jwt_required()
def create_checkout_session():
    """
    Create a Stripe Checkout Session for payment
    
    Returns:
        Checkout session ID and URL
    """
    data = request.json
    user_id = get_jwt_identity()
    
    # Get current user
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Validate required fields
    if not data.get("amount") or not data.get("property_id"):
        return jsonify({"error": "Amount and property_id are required"}), 400
    
    try:
        amount = int(float(data["amount"]) * 100)  # Convert to cents
        property_id = data["property_id"]
        
        # For tenants, verify they are associated with this property
        if user.role == "tenant":
            tenant_property = TenantProperty.query.filter_by(
                tenant_id=user_id,
                property_id=property_id
            ).first()
            
            if not tenant_property:
                return jsonify({"error": "You are not associated with this property"}), 403
        
        # Get the property to include details in payment
        property_obj = Property.query.get(property_id)
        if not property_obj:
            return jsonify({"error": "Property not found"}), 404
        
        # Get landlord info for this property
        landlord_id = property_obj.landlord_id
        
        # Create a description for the payment
        description = f"Rent payment for {property_obj.name}"
        if data.get("description"):
            description = data["description"]
            
        # Create checkout session
        checkout_session = stripe_service.create_checkout_session(
            customer_email=user.email,
            amount=amount,
            currency="usd",
            description=description,
            metadata={
                "user_id": user_id,
                "property_id": property_id,
                "landlord_id": landlord_id,
                "payment_type": data.get("payment_type", "rent")
            }
        )
        
        # Store the session ID in a pending payment record
        payment = Payment(
            tenant_id=user_id,
            property_id=property_id,
            landlord_id=landlord_id,
            amount=amount / 100,  # Store in dollars
            status="pending",
            session_id=checkout_session.id,
            description=description,
            payment_type=data.get("payment_type", "rent"),
            due_date=data.get("due_date")
        )
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({
            "sessionId": checkout_session.id,
            "url": checkout_session.url,
            "payment_id": payment.id
        }), 200
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to create checkout session"}), 500

@jwt_required()
def get_payment_history():
    """
    Get payment history for the current user
    
    Returns:
        List of payments filtered by role (tenant or landlord)
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    try:
        query = Payment.query
        
        # Filter based on role
        if user.role == "tenant":
            query = query.filter_by(tenant_id=user_id)
        elif user.role == "landlord":
            query = query.filter_by(landlord_id=user_id)
        elif user.role != "admin":
            return jsonify({"error": "Invalid role"}), 403
        
        # Order by created_at (newest first)
        query = query.order_by(desc(Payment.created_at))
        
        # Get optional filters from query params
        status = request.args.get("status")
        property_id = request.args.get("property_id")
        payment_type = request.args.get("payment_type")
        
        if status:
            query = query.filter_by(status=status)
        if property_id:
            query = query.filter_by(property_id=property_id)
        if payment_type:
            query = query.filter_by(payment_type=payment_type)
        
        payments = query.all()
        
        # Format payments for response
        result = []
        for payment in payments:
            property_obj = Property.query.get(payment.property_id) if payment.property_id else None
            property_name = property_obj.name if property_obj else "Unknown property"
            
            tenant = User.query.get(payment.tenant_id) if payment.tenant_id else None
            tenant_name = tenant.full_name if tenant else "Unknown tenant"
            
            result.append({
                "id": payment.id,
                "amount": payment.amount,
                "status": payment.status,
                "description": payment.description,
                "payment_type": payment.payment_type,
                "property_id": payment.property_id,
                "property_name": property_name,
                "tenant_id": payment.tenant_id,
                "tenant_name": tenant_name,
                "created_at": payment.created_at.isoformat() if payment.created_at else None,
                "updated_at": payment.updated_at.isoformat() if payment.updated_at else None,
                "due_date": payment.due_date.isoformat() if payment.due_date else None,
                "paid_date": payment.paid_date.isoformat() if payment.paid_date else None
            })
            
        return jsonify({"payments": result}), 200
    
    except Exception as e:
        logger.error(f"Error getting payment history: {str(e)}")
        return jsonify({"error": "Failed to get payment history"}), 500
