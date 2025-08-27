"""
Twilio webhook handlers
"""

def register_twilio_webhooks(bp):
    """Register Twilio webhook routes"""
    @bp.route('/twilio', methods=['POST'])
    def twilio_webhook():
        return {'message': 'Twilio webhook received'}, 200
