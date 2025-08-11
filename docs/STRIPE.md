# Stripe Integration Guide for Asset Anchor

This document outlines how Stripe is integrated with Asset Anchor for payment processing.

## Stripe Environment Setup

### API Keys

Asset Anchor uses two sets of Stripe API keys:

1. **Test Environment**
   - Used for development and testing
   - Safe to use in non-production environments
   - Test cards won't result in actual charges

2. **Live Environment**
   - Used for production with real transactions
   - Must be kept secure and never committed to the codebase
   - Set via environment variables in the production environment

### Environment Variables

Backend (Flask):
- `STRIPE_PUBLIC_KEY`: Used in API responses to the frontend
- `STRIPE_SECRET_KEY`: Used for server-side API calls
- `STRIPE_WEBHOOK_SECRET`: Used to verify webhook signatures

Frontend (React):
- `REACT_APP_STRIPE_PK`: Used for Elements and checkout

## Webhook Events

Asset Anchor listens for the following Stripe webhook events:

| Event Type | Purpose |
|------------|---------|
| `checkout.session.completed` | Confirm successful payments |
| `invoice.payment_succeeded` | Record subscription payments |
| `invoice.payment_failed` | Handle failed payments |
| `customer.subscription.created` | Set up new subscriptions |
| `customer.subscription.updated` | Update subscription status |
| `customer.subscription.deleted` | Handle subscription cancellations |
| `charge.refunded` | Process refunds |

### Webhook Setup

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Create a new webhook endpoint for `https://api.assetanchor.io/api/webhooks/stripe`
3. Select the events listed above
4. Copy the signing secret to the `STRIPE_WEBHOOK_SECRET` environment variable

## Idempotency

All Stripe operations should use idempotency keys to prevent duplicate operations:

- For API requests: Use a unique ID for each operation
- For webhooks: Stripe's Event ID serves as the idempotency key

## Security Best Practices

1. **Never log full card data**
   - Even in error logs, redact sensitive information

2. **Validate signatures on all webhooks**
   - Always verify the `Stripe-Signature` header

3. **Use Stripe Elements**
   - Card data never touches your server

4. **Keep Stripe libraries updated**
   - Monitor for security updates

## Implementation Details

### Backend Routes

The main webhook handler is located at:
```
/api/webhooks/stripe
```

The route verifies webhook signatures and dispatches events to appropriate handlers.

### Sample Webhook Handler

```python
@bp.route('/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, current_app.config['STRIPE_WEBHOOK_SECRET']
        )
    except ValueError as e:
        # Invalid payload
        current_app.logger.error(f"Invalid Stripe payload: {e}")
        return jsonify({"error": "Invalid payload"}), 400
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        current_app.logger.error(f"Invalid Stripe signature: {e}")
        return jsonify({"error": "Invalid signature"}), 400
        
    # Process the event
    event_handler = StripeEventHandler()
    return event_handler.handle_event(event)
```

## Testing

Use Stripe's test mode and test cards for development:

- `4242 4242 4242 4242` - Successful payment
- `4000 0000 0000 0002` - Declined payment
- `4000 0000 0000 9995` - Insufficient funds

### Testing Webhooks Locally

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run `stripe login` to authenticate
3. Run `stripe listen --forward-to localhost:5050/api/webhooks/stripe`
4. Use the provided webhook signing secret in your local environment

## Subscription Management

Asset Anchor uses Stripe Billing for subscription management:

1. **Subscription Creation**
   - Customer created/retrieved in Stripe
   - Subscription attached to customer
   - Metadata includes tenant/plan details

2. **Subscription Updates**
   - Changes in plan trigger update API calls
   - Proration handled according to business rules

3. **Cancellations**
   - Customer can cancel via dashboard
   - Backend can cancel via API
   - Webhooks notify system of changes

## References

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Elements](https://stripe.com/docs/stripe-js)
