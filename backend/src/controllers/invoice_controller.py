from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from dateutil.relativedelta import relativedelta

from ..models.invoice import Invoice
from ..models.user import User
from ..models.property import Property
from ..models.tenant_property import TenantProperty
from ..models.payment import Payment
from ..services.stripe_service import create_payment_intent
from ..extensions import db
from ..utils.role_required import role_required

invoice_bp = Blueprint('invoices', __name__)

@invoice_bp.route('/', methods=['POST'])
@jwt_required()
@role_required('landlord')
def create_invoice():
    """Create a new invoice"""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    try:
        # Validate required fields
        required_fields = ['tenant_id', 'property_id', 'amount', 'due_date', 'description']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Verify property belongs to landlord
        property = Property.query.filter_by(id=data['property_id'], landlord_id=current_user_id).first()
        if not property:
            return jsonify({"error": "Property not found or you don't have permission"}), 404
        
        # Verify tenant is assigned to property
        tenant_property = TenantProperty.query.filter_by(
            tenant_id=data['tenant_id'], 
            property_id=data['property_id']
        ).first()
        
        if not tenant_property:
            return jsonify({"error": "Tenant is not associated with this property"}), 400
        
        # Create invoice
        new_invoice = Invoice(
            tenant_id=data['tenant_id'],
            property_id=data['property_id'],
            landlord_id=current_user_id,
            amount=data['amount'],
            due_date=datetime.fromisoformat(data['due_date'].replace('Z', '+00:00')),
            description=data['description'],
            status='pending'
        )
        
        db.session.add(new_invoice)
        db.session.commit()
        
        return jsonify({"message": "Invoice created successfully", "invoice_id": new_invoice.id}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@invoice_bp.route('/', methods=['GET'])
@jwt_required()
def get_invoices():
    """Get invoices based on user role"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status_filter = request.args.get('status')
        
        query = Invoice.query
        
        # Filter based on role
        if user.role == 'tenant':
            query = query.filter(Invoice.tenant_id == current_user_id)
        elif user.role == 'landlord':
            query = query.filter(Invoice.landlord_id == current_user_id)
        elif user.role != 'admin':
            return jsonify({"error": "Unauthorized access"}), 403
            
        # Apply status filter if provided
        if status_filter:
            query = query.filter(Invoice.status == status_filter)
            
        # Apply sorting (newest first)
        query = query.order_by(Invoice.created_at.desc())
        
        # Paginate results
        paginated_invoices = query.paginate(page=page, per_page=per_page)
        
        result = {
            "invoices": [invoice.to_dict() for invoice in paginated_invoices.items],
            "total": paginated_invoices.total,
            "pages": paginated_invoices.pages,
            "current_page": page
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@invoice_bp.route('/<int:invoice_id>', methods=['GET'])
@jwt_required()
def get_invoice(invoice_id):
    """Get a specific invoice"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    try:
        invoice = Invoice.query.get(invoice_id)
        
        if not invoice:
            return jsonify({"error": "Invoice not found"}), 404
            
        # Check permissions
        if user.role == 'tenant' and invoice.tenant_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403
        elif user.role == 'landlord' and invoice.landlord_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403
            
        return jsonify(invoice.to_dict()), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@invoice_bp.route('/<int:invoice_id>', methods=['PUT'])
@jwt_required()
@role_required('landlord')
def update_invoice(invoice_id):
    """Update an invoice"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        invoice = Invoice.query.get(invoice_id)
        
        if not invoice:
            return jsonify({"error": "Invoice not found"}), 404
            
        # Verify ownership
        if invoice.landlord_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403
            
        # Only allow updates if invoice is pending
        if invoice.status != 'pending':
            return jsonify({"error": "Cannot update a paid or cancelled invoice"}), 400
            
        # Update fields
        if 'amount' in data:
            invoice.amount = data['amount']
        if 'due_date' in data:
            invoice.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
        if 'description' in data:
            invoice.description = data['description']
            
        db.session.commit()
        return jsonify({"message": "Invoice updated successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@invoice_bp.route('/<int:invoice_id>', methods=['DELETE'])
@jwt_required()
@role_required('landlord')
def delete_invoice(invoice_id):
    """Delete an invoice"""
    current_user_id = get_jwt_identity()
    
    try:
        invoice = Invoice.query.get(invoice_id)
        
        if not invoice:
            return jsonify({"error": "Invoice not found"}), 404
            
        # Verify ownership
        if invoice.landlord_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403
            
        # Only allow deletion if invoice is pending
        if invoice.status != 'pending':
            return jsonify({"error": "Cannot delete a paid invoice"}), 400
            
        db.session.delete(invoice)
        db.session.commit()
        return jsonify({"message": "Invoice deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@invoice_bp.route('/<int:invoice_id>/pay', methods=['POST'])
@jwt_required()
@role_required('tenant')
def pay_invoice(invoice_id):
    """Initialize payment for an invoice"""
    current_user_id = get_jwt_identity()
    
    try:
        invoice = Invoice.query.get(invoice_id)
        
        if not invoice:
            return jsonify({"error": "Invoice not found"}), 404
            
        # Verify the invoice belongs to the tenant
        if invoice.tenant_id != current_user_id:
            return jsonify({"error": "Unauthorized access"}), 403
            
        # Check if invoice is already paid
        if invoice.status == 'paid':
            return jsonify({"error": "Invoice is already paid"}), 400
            
        # Create payment intent via Stripe
        amount_in_cents = int(invoice.amount * 100)  # Convert to cents for Stripe
        
        payment_intent = create_payment_intent(
            amount=amount_in_cents,
            currency="usd",
            customer_email=User.query.get(current_user_id).email,
            metadata={
                "invoice_id": invoice.id,
                "property_id": invoice.property_id,
                "tenant_id": invoice.tenant_id,
                "landlord_id": invoice.landlord_id
            }
        )
        
        # Create payment record
        payment = Payment(
            invoice_id=invoice.id,
            tenant_id=current_user_id,
            landlord_id=invoice.landlord_id,
            amount=invoice.amount,
            payment_intent_id=payment_intent.id,
            status='pending'
        )
        
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({
            "client_secret": payment_intent.client_secret,
            "payment_id": payment.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@invoice_bp.route('/generate-recurring', methods=['POST'])
@jwt_required()
@role_required('landlord')
def generate_recurring_invoices():
    """Generate recurring invoices for all active tenant-property relationships"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        # Get all properties owned by landlord with active tenants
        tenant_properties = TenantProperty.query.join(Property).filter(
            Property.landlord_id == current_user_id,
            TenantProperty.status == 'active'
        ).all()
        
        created_invoices = []
        
        for tp in tenant_properties:
            # Create invoice with due date as first of next month
            today = datetime.today()
            next_month = today + relativedelta(months=1)
            due_date = datetime(next_month.year, next_month.month, 1)
            
            new_invoice = Invoice(
                tenant_id=tp.tenant_id,
                property_id=tp.property_id,
                landlord_id=current_user_id,
                amount=tp.rent_amount,
                due_date=due_date,
                description=f"Monthly rent for {tp.property.address} - {due_date.strftime('%B %Y')}",
                status='pending'
            )
            
            db.session.add(new_invoice)
            created_invoices.append(new_invoice)
        
        db.session.commit()
        
        return jsonify({
            "message": f"Successfully created {len(created_invoices)} recurring invoices",
            "invoice_count": len(created_invoices)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@invoice_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_invoice_statistics():
    """Get invoice statistics based on user role"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    try:
        # Define base query based on role
        if user.role == 'tenant':
            base_query = Invoice.query.filter(Invoice.tenant_id == current_user_id)
        elif user.role == 'landlord':
            base_query = Invoice.query.filter(Invoice.landlord_id == current_user_id)
        else:
            return jsonify({"error": "Unauthorized access"}), 403
        
        # Total invoices
        total_invoices = base_query.count()
        
        # Invoices by status
        pending_count = base_query.filter(Invoice.status == 'pending').count()
        paid_count = base_query.filter(Invoice.status == 'paid').count()
        overdue_count = base_query.filter(
            Invoice.status == 'pending',
            Invoice.due_date < datetime.now()
        ).count()
        
        # Total amount metrics
        total_amount = sum(invoice.amount for invoice in base_query.all())
        paid_amount = sum(invoice.amount for invoice in base_query.filter(Invoice.status == 'paid').all())
        pending_amount = sum(invoice.amount for invoice in base_query.filter(Invoice.status == 'pending').all())
        
        # Get recent invoices
        recent_invoices = [
            invoice.to_dict() for invoice in 
            base_query.order_by(Invoice.created_at.desc()).limit(5).all()
        ]
        
        stats = {
            "total_invoices": total_invoices,
            "status_breakdown": {
                "pending": pending_count,
                "paid": paid_count,
                "overdue": overdue_count
            },
            "amount_metrics": {
                "total": float(total_amount),
                "paid": float(paid_amount),
                "pending": float(pending_amount)
            },
            "recent_invoices": recent_invoices
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500