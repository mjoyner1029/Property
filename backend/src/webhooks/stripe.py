"""
Stripe webhook handlers
"""

def register_stripe_webhooks(bp):
    """Register Stripe webhook routes"""
    @bp.route('/stripe', methods=['POST'])
    def stripe_webhook():
        return {'message': 'Stripe webhook received'}, 200
