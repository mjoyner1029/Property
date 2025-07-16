# backend/src/routes/__init__.py

def register_routes(app):
    """Register all API routes with the Flask app"""
    
    # Import route modules
    from .auth_routes import auth_bp
    from .user_routes import user_bp
    from .property_routes import property_bp
    from .unit_routes import unit_bp
    from .tenant_routes import tenant_bp
    from .maintenance_routes import maintenance_bp
    from .payment_routes import payment_bp
    from .lease_routes import lease_bp
    from .document_routes import document_bp
    from .messaging_routes import messaging_bp
    from .notification_routes import notification_bp
    from .analytics_routes import analytics_bp
    from .stripe_routes import stripe_bp
    from .invoice_routes import invoice_bp
    from .admin_routes import admin_bp
    from .webhook_routes import webhook_bp
    from .landlord_routes import landlord_bp
    from .onboard_routes import onboard_bp
    from .invite_routes import invite_bp
    from .verify_email_routes import verify_email_bp
    from .logs_routes import logs_bp
    
    # Register blueprints with API prefix
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(property_bp, url_prefix='/api/properties')
    app.register_blueprint(unit_bp, url_prefix='/api/units')
    app.register_blueprint(tenant_bp, url_prefix='/api/tenants')
    app.register_blueprint(maintenance_bp, url_prefix='/api/maintenance')
    app.register_blueprint(payment_bp, url_prefix='/api/payments')
    app.register_blueprint(lease_bp, url_prefix='/api/leases')
    app.register_blueprint(document_bp, url_prefix='/api/documents')
    app.register_blueprint(messaging_bp, url_prefix='/api/messages')
    app.register_blueprint(notification_bp, url_prefix='/api/notifications')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(stripe_bp, url_prefix='/api/stripe')
    app.register_blueprint(invoice_bp, url_prefix='/api/invoices')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(webhook_bp, url_prefix='/api/webhooks')
    app.register_blueprint(landlord_bp, url_prefix='/api/landlords')
    app.register_blueprint(onboard_bp, url_prefix='/api/onboarding')
    app.register_blueprint(invite_bp, url_prefix='/api/invites')
    app.register_blueprint(verify_email_bp, url_prefix='/api/verify-email')
    app.register_blueprint(logs_bp, url_prefix='/api/logs')
