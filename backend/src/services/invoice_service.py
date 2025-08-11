from ..models.invoice import Invoice
from ..models.tenant_property import TenantProperty
from ..models.property import Property
from ..models.lease import Lease
from ..models.user import User
from ..extensions import db
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta
import calendar

class InvoiceService:
    @staticmethod
    def create_invoice(landlord_id, data):
        """Create a new invoice"""
        try:
            # Validate required fields
            required_fields = ['tenant_id', 'amount', 'due_date', 'description']
            for field in required_fields:
                if field not in data:
                    return None, f"Missing required field: {field}"
            
            # Check if tenant is associated with landlord
            tenant_property = TenantProperty.query.filter_by(
                tenant_id=data['tenant_id']
            ).join(Property).filter_by(
                landlord_id=landlord_id
            ).first()
            
            if not tenant_property:
                return None, "Tenant is not associated with any of your properties"
            
            # Create invoice
            invoice = Invoice(
                landlord_id=landlord_id,
                tenant_id=data['tenant_id'],
                property_id=tenant_property.property_id,
                unit_id=tenant_property.unit_id,
                amount=data['amount'],
                description=data['description'],
                due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date(),
                status='draft' if data.get('is_draft') else 'due',
                invoice_number=data.get('invoice_number') or f"INV-{datetime.now().strftime('%Y%m%d')}-{data['tenant_id']}",
                category=data.get('category', 'rent'),
                created_at=datetime.utcnow()
            )
            
            db.session.add(invoice)
            db.session.commit()
            
            return invoice, None
        
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, str(e)
    
    @staticmethod
    def generate_rent_invoices(landlord_id, month=None, year=None, send_notification=True):
        """Generate rent invoices for all active leases"""
        try:
            # Use current month/year if not specified
            today = datetime.today()
            target_month = month or today.month
            target_year = year or today.year
            
            # Calculate the first day of next month for due date
            first_day_next_month = datetime(target_year, target_month, 1)
            if target_month == 12:
                first_day_next_month = datetime(target_year + 1, 1, 1)
            else:
                first_day_next_month = datetime(target_year, target_month + 1, 1)
            
            # Get all active leases for this landlord
            active_leases = Lease.query.filter_by(
                landlord_id=landlord_id,
                status='active'
            ).all()
            
            # Track created invoices
            created_invoices = []
            errors = []
            
            for lease in active_leases:
                # Check if invoice already exists for this lease/month
                existing_invoice = Invoice.query.filter_by(
                    tenant_id=lease.tenant_id,
                    property_id=lease.property_id,
                    category='rent',
                    due_date=first_day_next_month.date()
                ).first()
                
                if existing_invoice:
                    errors.append(f"Invoice already exists for tenant #{lease.tenant_id} for {first_day_next_month.strftime('%B %Y')}")
                    continue
                
                # Create invoice
                invoice = Invoice(
                    landlord_id=landlord_id,
                    tenant_id=lease.tenant_id,
                    property_id=lease.property_id,
                    unit_id=lease.unit_id,
                    amount=lease.rent_amount,
                    description=f"Monthly Rent for {first_day_next_month.strftime('%B %Y')}",
                    due_date=first_day_next_month.date(),
                    status='due',
                    invoice_number=f"RENT-{first_day_next_month.strftime('%Y%m')}-{lease.tenant_id}",
                    category='rent',
                    created_at=datetime.utcnow(),
                    lease_id=lease.id
                )
                
                db.session.add(invoice)
                created_invoices.append(invoice)
                
                # Send notification if requested (in a real app, you'd use a notification service here)
                if send_notification:
                    # Example: create a notification record or trigger email
                    pass
            
            db.session.commit()
            return created_invoices, errors
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return [], [str(e)]
    
    @staticmethod
    def mark_invoice_paid(invoice_id, landlord_id, payment_id=None):
        """Mark an invoice as paid"""
        try:
            invoice = Invoice.query.get(invoice_id)
            
            if not invoice:
                return False, "Invoice not found"
            
            # Verify landlord owns this invoice
            if invoice.landlord_id != landlord_id:
                return False, "Not authorized to update this invoice"
            
            invoice.status = 'paid'
            invoice.payment_date = datetime.utcnow().date()
            invoice.payment_id = payment_id
            invoice.updated_at = datetime.utcnow()
            
            db.session.commit()
            return True, None
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return False, str(e)
    
    @staticmethod
    def get_tenant_invoices(tenant_id, status=None, page=1, per_page=10):
        """Get invoices for a tenant"""
        try:
            query = Invoice.query.filter_by(tenant_id=tenant_id)
            
            if status:
                if isinstance(status, list):
                    query = query.filter(Invoice.status.in_(status))
                else:
                    query = query.filter_by(status=status)
            
            # Order by due date (most recent first)
            query = query.order_by(Invoice.due_date.desc())
            
            # Paginate results
            paginated_invoices = query.paginate(page=page, per_page=per_page)
            
            return paginated_invoices.items, paginated_invoices.total, None
            
        except SQLAlchemyError as e:
            return [], 0, str(e)