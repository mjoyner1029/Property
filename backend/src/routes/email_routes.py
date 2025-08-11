from flask import Blueprint, render_template, request, jsonify, current_app, abort
from ..services.email_service import EmailService

bp = Blueprint('email', __name__)

@bp.route('/preview/<template_name>', methods=['GET'])
def preview_email(template_name):
    """
    Preview an email template with sample data.
    Only available in non-production environments.
    
    Example:
    /api/email/preview/verification?user_name=John&verification_link=https://example.com/verify
    """
    # Only allow in development or testing
    if current_app.config.get('ENV') == 'production':
        abort(404)
        
    # Get query parameters
    params = request.args.to_dict()
    
    # Set default parameters if not provided
    default_params = {
        'verification': {
            'user_name': 'Test User',
            'verification_link': 'https://assetanchor.io/verify?token=sample-token'
        },
        'welcome': {
            'user_name': 'Test User'
        },
        'password_reset': {
            'user_name': 'Test User',
            'reset_link': 'https://assetanchor.io/reset?token=sample-token'
        },
        'invite': {
            'inviter_name': 'Jane Doe',
            'invitation_link': 'https://assetanchor.io/invite?token=sample-token',
            'role': 'Tenant'
        },
        'payment_receipt': {
            'user_name': 'Test User',
            'amount': '$1,200.00',
            'date': '2025-08-10',
            'description': 'Monthly rent payment'
        },
        'payment_failed': {
            'user_name': 'Test User',
            'amount': '$1,200.00',
            'date': '2025-08-10',
            'description': 'Monthly rent payment'
        },
        'maintenance_request': {
            'recipient_name': 'Property Manager',
            'property_name': 'Sunset Apartments, Unit 101',
            'description': 'Leaking faucet in kitchen',
            'status': 'New',
            'notes': 'Water is dripping constantly'
        },
        'maintenance_update': {
            'recipient_name': 'John Tenant',
            'property_name': 'Sunset Apartments, Unit 101',
            'description': 'Leaking faucet in kitchen',
            'status': 'In Progress',
            'notes': 'Plumber scheduled for tomorrow between 1-3pm'
        }
    }
    
    # Check if template exists
    if template_name not in default_params:
        abort(404, description=f"Email template '{template_name}' not found")
    
    # Use default params and override with provided params
    template_params = default_params[template_name].copy()
    template_params.update(params)
    
    try:
        # Render the template
        html = render_template(f"email/{template_name}.html", **template_params)
        return html
    except Exception as e:
        current_app.logger.error(f"Error rendering email template: {str(e)}")
        return jsonify({
            'error': 'Template rendering error',
            'message': str(e)
        }), 500
