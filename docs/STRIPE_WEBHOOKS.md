# Stripe Webhook Integration

This document outlines the Stripe webhook integration for the Property application, including event types handled, retry policies, and configuration instructions.

## Webhook Overview

Stripe webhooks provide real-time notifications about events in your Stripe account, such as successful payments, failed charges, disputed payments, and subscription status changes. Our application uses these webhooks to update payment records, send notifications, and trigger business logic.

## Webhook Endpoint

- **Production**: `https://api.example.com/api/webhooks/stripe`
- **Staging**: `https://staging-api.example.com/api/webhooks/stripe`
- **Development**: `http://localhost:5000/api/webhooks/stripe`

## Webhook Verification

All webhook requests are verified using the Stripe signature verification:

```python
@app.route('/api/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as e:
        # Invalid payload
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        return jsonify({'error': 'Invalid signature'}), 400
    
    # Handle the event
    handle_stripe_event(event)
    
    return jsonify({'status': 'success'}), 200
```

## Webhook Events Handled

| Event Type | Description | Handler | Business Logic |
|------------|-------------|---------|---------------|
| `payment_intent.succeeded` | Payment was successful | `handle_payment_success` | Update payment status, record transaction, send receipt |
| `payment_intent.payment_failed` | Payment failed | `handle_payment_failure` | Update payment status, notify user, retry logic |
| `charge.refunded` | Payment was refunded | `handle_refund` | Update payment status, adjust balance |
| `invoice.payment_succeeded` | Invoice paid (subscriptions) | `handle_invoice_paid` | Update subscription status |
| `invoice.payment_failed` | Invoice payment failed | `handle_invoice_failure` | Update subscription status, notify user |
| `customer.subscription.created` | New subscription created | `handle_subscription_created` | Initialize subscription record |
| `customer.subscription.updated` | Subscription updated | `handle_subscription_updated` | Update subscription details |
| `customer.subscription.deleted` | Subscription canceled | `handle_subscription_deleted` | Update subscription status |
| `checkout.session.completed` | Checkout process completed | `handle_checkout_completed` | Finalize order, provision access |
| `dispute.created` | Payment disputed | `handle_dispute` | Flag payment, notify admin |

## Event Processing

### Event Handler Structure

```python
def handle_stripe_event(event):
    """Route Stripe events to appropriate handlers"""
    event_handlers = {
        'payment_intent.succeeded': handle_payment_success,
        'payment_intent.payment_failed': handle_payment_failure,
        'charge.refunded': handle_refund,
        'invoice.payment_succeeded': handle_invoice_paid,
        'invoice.payment_failed': handle_invoice_failure,
        'customer.subscription.created': handle_subscription_created,
        'customer.subscription.updated': handle_subscription_updated,
        'customer.subscription.deleted': handle_subscription_deleted,
        'checkout.session.completed': handle_checkout_completed,
        'dispute.created': handle_dispute
    }
    
    handler = event_handlers.get(event.type)
    if handler:
        try:
            handler(event.data.object)
            record_successful_webhook(event.id, event.type)
        except Exception as e:
            record_failed_webhook(event.id, event.type, str(e))
            # Re-raise for retry mechanism
            raise
    else:
        # Unhandled event type
        log.info(f"Unhandled event type: {event.type}")
```

## Idempotency

Stripe webhooks may be delivered multiple times for the same event. Our system implements idempotency to ensure events are processed exactly once:

```python
def process_webhook_event(event_id, event_type, handler_func, data):
    """Process webhook event with idempotency check"""
    
    # Check if this event has been processed before
    if WebhookEvent.query.filter_by(event_id=event_id).first():
        log.info(f"Duplicate webhook event: {event_id}")
        return False
        
    # Record this event
    webhook_event = WebhookEvent(
        event_id=event_id,
        event_type=event_type,
        received_at=datetime.utcnow()
    )
    
    try:
        # Process event
        handler_func(data)
        
        # Mark as processed
        webhook_event.processed_at = datetime.utcnow()
        webhook_event.status = 'processed'
        db.session.add(webhook_event)
        db.session.commit()
        return True
    except Exception as e:
        # Record failure
        webhook_event.error_message = str(e)
        webhook_event.status = 'failed'
        db.session.add(webhook_event)
        db.session.commit()
        raise
```

## Retry Policy

Stripe will retry failed webhook deliveries with an exponential backoff:

1. 1 minute after the initial attempt
2. 2 minutes after the first retry
3. 4 minutes after the second retry
4. 10 minutes after the third retry
5. 30 minutes after the fourth retry
6. 1 hour after the fifth retry
7. 2 hours after the sixth retry
8. 4 hours after the seventh retry
9. 8 hours after the eighth retry
10. 16 hours after the ninth retry
11. 24 hours after the tenth retry

Our application logs failed webhook attempts and has monitoring alerts for repeated failures.

## Manual Retry Process

For events that fail all automatic retries:

1. Review the failed event in the Stripe Dashboard
2. Check application logs for the specific error
3. Fix the underlying issue
4. Manually resend the webhook from the Stripe Dashboard:
   ```
   Stripe Dashboard → Developers → Events → [Select Event] → "Resend webhook"
   ```

## Webhook Configuration

### Setting Up in Stripe Dashboard

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to Developers → Webhooks → Add endpoint
3. Enter the endpoint URL (e.g., `https://api.example.com/api/webhooks/stripe`)
4. Select the events to listen for (see the list above)
5. Get the webhook signing secret

### Environment Configuration

Store the webhook secret in the appropriate environment variable:

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Testing Webhooks Locally

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run local forwarding:
   ```bash
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   ```
3. Trigger test events:
   ```bash
   stripe trigger payment_intent.succeeded
   ```

## Monitoring and Debugging

### Webhook Logs

All webhook events are logged in the database:

```sql
SELECT 
    event_id,
    event_type,
    received_at,
    processed_at,
    status,
    error_message
FROM webhook_events
ORDER BY received_at DESC
LIMIT 100;
```

### Monitoring Alerts

1. **Failed Webhook Alert**: Triggered when the same event fails multiple times
2. **Delayed Processing Alert**: Triggered when webhooks take >30s to process
3. **Missing Webhook Alert**: Triggered when expected webhooks are not received

## Disaster Recovery

If the webhook system fails completely:

1. Temporarily disable webhook endpoint in Stripe
2. Resolve the underlying issue
3. Re-enable the webhook endpoint
4. Run the reconciliation script:
   ```bash
   python scripts/stripe_reconciliation.py --start-date=YYYY-MM-DD
   ```

This script will compare Stripe payment records with our database and update any missing or incorrect data.
