from ..models.payment import Payment
from ..models.invoice import Invoice
from ..models.user import User
from ..extensions import db
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
import stripe
from flask import current_app

class PaymentService:
    @staticmethod
    def create_payment_for_invoice(tenant_id, invoice_id, payment_method, amount=None):
        """Create a payment record for an invoice"""
        try:
            # Get invoice
            invoice = Invoice.query.get(invoice_id)
            if not invoice:
                return None, "Invoice not found"
                
            # Verify tenant is responsible for this invoice
            if invoice.tenant_id != tenant_id:
                return None, "Not authorized to pay this invoice"
                
            # Use invoice amount if not specified
            payment_amount = amount if amount is not None else invoice.amount
            
            # Create payment record
            new_payment = Payment(
                tenant_id=tenant_id,
                landlord_id=invoice.landlord_id,
                invoice_id=invoice_id,
                amount=payment_amount,
                payment_method=payment_method,
                status='pending',
                created_at=datetime.utcnow()
            )
            
            db.session.add(new_payment)
            
            # Update invoice status
            invoice.status = 'processing'
            invoice.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            return new_payment, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def complete_payment(payment_id, transaction_id=None):
        """Mark a payment as completed"""
        try:
            payment = Payment.query.get(payment_id)
            if not payment:
                return False, "Payment not found"
                
            payment.status = 'completed'
            payment.transaction_id = transaction_id
            payment.completed_at = datetime.utcnow()
            
            # Update invoice status
            invoice = Invoice.query.get(payment.invoice_id)
            if invoice:
                invoice.status = 'paid'
                invoice.payment_date = datetime.utcnow()
                invoice.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            return True, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return False, str(e)
    
    @staticmethod
    def fail_payment(payment_id, reason=None):
        """Mark a payment as failed"""
        try:
            payment = Payment.query.get(payment_id)
            if not payment:
                return False, "Payment not found"
                
            payment.status = 'failed'
            payment.failure_reason = reason
            payment.updated_at = datetime.utcnow()
            
            # Update invoice status back to due
            invoice = Invoice.query.get(payment.invoice_id)
            if invoice:
                invoice.status = 'due' if invoice.due_date >= datetime.utcnow().date() else 'overdue'
                invoice.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            return True, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return False, str(e)
    
    @staticmethod
    def create_stripe_payment_intent(tenant_id, invoice_id):
        """Create a Stripe payment intent"""
        try:
            # Get invoice
            invoice = Invoice.query.get(invoice_id)
            if not invoice:
                return None, "Invoice not found"
                
            # Verify tenant is responsible for this invoice
            if invoice.tenant_id != tenant_id:
                return None, "Not authorized to pay this invoice"
                
            # Get tenant and landlord details
            tenant = User.query.get(tenant_id)
            landlord = User.query.get(invoice.landlord_id)
            
            if not tenant or not landlord:
                return None, "User information missing"
                
            # Initialize Stripe
            stripe.api_key = current_app.config['STRIPE_SECRET_KEY']
            
            # Convert amount to cents (Stripe uses smallest currency unit)
            amount_cents = int(float(invoice.amount) * 100)
            
            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='usd',
                description=f"Payment for {invoice.description}",
                metadata={
                    'invoice_id': invoice.id,
                    'tenant_id': tenant_id,
                    'landlord_id': invoice.landlord_id,
                    'tenant_email': tenant.email,
                    'landlord_email': landlord.email
                }
            )
            
            # Create payment record
            payment = Payment(
                tenant_id=tenant_id,
                landlord_id=invoice.landlord_id,
                invoice_id=invoice_id,
                amount=invoice.amount,
                payment_method='card',
                status='pending',
                payment_intent_id=intent.id,
                created_at=datetime.utcnow()
            )
            
            db.session.add(payment)
            
            # Update invoice status
            invoice.status = 'processing'
            invoice.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            return {
                'payment_id': payment.id,
                'client_secret': intent.client_secret
            }, None
            
        except stripe.error.StripeError as e:
            return None, f"Stripe error: {str(e)}"
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, str(e)