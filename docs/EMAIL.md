# Email Integration Guide for Asset Anchor

This document outlines the email integration for Asset Anchor using Postmark as the email delivery service.

## DNS Setup for Email

To ensure proper email delivery and authentication, the following DNS records need to be set up for the domain `assetanchor.io`:

### SPF Record (Sender Policy Framework)

Add this TXT record to your DNS settings:

```
Type: TXT
Host: @
Value: v=spf1 include:spf.messagingengine.com ~all
```

This record specifies which mail servers are allowed to send email from your domain.

### DKIM Record (DomainKeys Identified Mail)

Add this TXT record to your DNS settings (provided by Postmark):

```
Type: TXT
Host: postmark._domainkey
Value: [DKIM value provided by Postmark]
```

This allows receiving mail servers to verify that incoming email was not altered during transit.

### DMARC Record (Domain-based Message Authentication, Reporting & Conformance)

Add this TXT record to your DNS settings:

```
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@assetanchor.io
```

This record specifies what should happen to emails that fail SPF and DKIM checks.

## Email Templates

Asset Anchor uses Jinja2 templates for all transactional emails. Templates are stored in the `backend/src/templates/email/` directory.

### Available Templates

| Template Name | Purpose | Variables |
|--------------|---------|-----------|
| `welcome.html` | Sent when a new user signs up | `user_name`, `verification_link` |
| `verification.html` | Sent to verify email addresses | `user_name`, `verification_link` |
| `password_reset.html` | Sent when password reset is requested | `user_name`, `reset_link` |
| `invite.html` | Sent when inviting users to join | `inviter_name`, `invitation_link` |
| `payment_receipt.html` | Sent after successful payment | `user_name`, `amount`, `date`, `description` |
| `payment_failed.html` | Sent when payment fails | `user_name`, `amount`, `retry_link` |
| `maintenance_request.html` | Sent when maintenance request is created | `tenant_name`, `property_name`, `description` |
| `maintenance_update.html` | Sent when maintenance request is updated | `recipient_name`, `property_name`, `status`, `notes` |

### Template Structure

All templates should have:
- Responsive design
- Plain text fallback
- Asset Anchor branding
- Clear call-to-action
- Unsubscribe link (when required by law)

## Email Service Implementation

The email service is implemented in `backend/src/services/email.py` and provides a unified interface for sending all types of emails.

### Service Configuration

The email service is configured using these environment variables:

```
EMAIL_PROVIDER=postmark
EMAIL_API_KEY=your-api-key
EMAIL_FROM=no-reply@assetanchor.io
```

### Core Functions

| Function | Purpose |
|----------|---------|
| `send_verification_email` | Send email verification links |
| `send_password_reset` | Send password reset links |
| `send_welcome_email` | Send welcome emails to new users |
| `send_invitation` | Send invitations to new users |
| `send_payment_notification` | Send payment confirmations or failures |
| `send_maintenance_notification` | Send maintenance request notifications |

### Testing Emails

A preview route is available in non-production environments:

```
GET /api/email/preview/<template_name>?<param1>=value1&<param2>=value2
```

This endpoint renders the template with the provided query parameters and returns the HTML.

## Best Practices

1. **Always Use Templates**
   - Never construct email HTML directly in code

2. **Maintain Plain Text Versions**
   - Always provide plain text alternatives

3. **Test Across Email Clients**
   - Verify rendering in Gmail, Outlook, Apple Mail, etc.

4. **Monitor Delivery Metrics**
   - Track open rates, bounce rates, and spam complaints

5. **Handle Bounces**
   - Process bounce webhooks to maintain sender reputation

## Postmark Specific Setup

1. **Create Sender Signature**
   - Verify ownership of `assetanchor.io` in Postmark dashboard
   - Complete DKIM verification process

2. **Set Up Message Streams**
   - Transactional: For account-related emails and receipts
   - Broadcast: For marketing and newsletter content

3. **Configure Webhooks**
   - Set up webhook endpoints for bounces and delivery events
   - Point to: `https://api.assetanchor.io/api/webhooks/postmark`

4. **API Integration**
   - Use Postmark's server API tokens for authentication
   - Use message streams for proper email categorization

## Production Checklist

- [ ] Verify SPF, DKIM, and DMARC records are published
- [ ] Confirm sender signature is verified in Postmark
- [ ] Test all email templates across major email clients
- [ ] Set up bounce and spam complaint handling
- [ ] Implement email analytics tracking
- [ ] Establish monitoring for email delivery issues
