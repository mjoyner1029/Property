# chore(env): add qrcode/pyotp deps and sample Stripe/upload envs

## Changes

1. **Dependencies**
   - Added `qrcode>=7.4` for QR code generation (needed for MFA)
   - Added `pyotp>=2.9.0` for one-time password generation (needed for MFA)

2. **.env.example**
   - Updated `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to simpler example values
   - Added `UPLOAD_DIR=./uploads` for file uploads
   - Added `DOC_UPLOAD_DIR=./uploads/docs` for document uploads

3. **Stripe Webhook Handler**
   - Modified the Stripe webhook handler to allow dev mode operation
   - When `STRIPE_WEBHOOK_SECRET` is not set, it now logs a warning and constructs an event from JSON
   - This prevents the app from crashing in development when Stripe secrets are missing

## Testing

- Verified `pip install -r backend/requirements.txt` succeeds with new dependencies
- Verified app logs a clear warning when Stripe secrets are missing instead of crashing

## Acceptance Criteria

- ✅ `pip install -r backend/requirements.txt` succeeds
- ✅ App logs a warning (doesn't crash) when Stripe secrets are missing in development
