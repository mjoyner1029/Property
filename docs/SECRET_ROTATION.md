# Secret Rotation Procedure

This document outlines the procedures for rotating secrets in the Asset Anchor platform. Following these procedures helps maintain security by regularly changing sensitive credentials.

## Scheduled Rotation Intervals

| Secret Type | Rotation Interval | Description |
|-------------|-----------------|-------------|
| JWT Secret Keys | Every 90 days | Used for signing authentication tokens |
| Database Credentials | Every 180 days | Database access credentials |
| API Keys (Stripe, Email services, etc.) | Every 180 days | Third-party service credentials |
| AWS/S3 Credentials | Every 180 days | Cloud provider credentials |
| Encryption Keys | Every 365 days | Data encryption keys |

## JWT Secret Key Rotation

JWT Secret Keys must be rotated carefully to avoid invalidating user sessions.

### Procedure

1. **Generate new secret key**:
   ```bash
   NEW_SECRET=$(openssl rand -hex 32)
   echo $NEW_SECRET
   ```

2. **Update the secret in Render environment variables**:
   - Go to the Render dashboard
   - Select the backend service
   - Go to Environment
   - Update the `JWT_SECRET_KEY` with the new value
   - Set up the old key as `JWT_SECRET_KEY_PREVIOUS`

3. **Update the JWT verification code** (if not already supporting multiple keys):
   - Ensure the code checks both current and previous keys
   - This allows for a grace period during key rotation

4. **Deploy the changes**:
   - Deploy the updated backend with support for multiple keys

5. **Monitor for errors**:
   - Watch error logs for JWT verification issues
   - Set up alerts for increased JWT failures

6. **Complete the rotation**:
   - After the grace period (typically 24-48 hours):
   - Remove the `JWT_SECRET_KEY_PREVIOUS` variable
   - Deploy again to finalize the rotation

## Database Credentials Rotation

### Procedure

1. **Create new database user**:
   ```sql
   CREATE USER 'asset_anchor_new'@'%' IDENTIFIED BY 'new_strong_password';
   GRANT ALL PRIVILEGES ON asset_anchor.* TO 'asset_anchor_new'@'%';
   FLUSH PRIVILEGES;
   ```

2. **Update application configuration**:
   - Update the `DATABASE_URL` in Render environment variables
   - Deploy the application with new credentials

3. **Verify connectivity**:
   - Ensure application is functioning with new credentials
   - Check logs for any database connection issues

4. **Remove old user**:
   ```sql
   REVOKE ALL PRIVILEGES ON asset_anchor.* FROM 'asset_anchor_old'@'%';
   DROP USER 'asset_anchor_old'@'%';
   FLUSH PRIVILEGES;
   ```

## API Key Rotation (Stripe, Email services, etc.)

### Procedure

1. **Generate new API keys** in the respective service dashboard
   - For Stripe: https://dashboard.stripe.com/apikeys
   - For Email Service (Postmark): https://account.postmarkapp.com/api_tokens

2. **Update environment variables**:
   - Update API keys in Render environment
   - Update webhook secrets if applicable

3. **Deploy and verify**:
   - Deploy the application with new keys
   - Test functionality that uses these services
   - Verify webhooks are working correctly

4. **Revoke old keys**:
   - After confirming everything works, revoke old API keys

## AWS/S3 Credential Rotation

### Procedure

1. **Create new IAM user** or access key:
   - In AWS console, go to IAM
   - Create a new access key for existing user or create new user
   - Attach appropriate policies (S3 access)

2. **Update environment variables**:
   - Update `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in Render environment

3. **Deploy and verify**:
   - Deploy the application with new credentials
   - Test file upload and download functionality

4. **Remove old credentials**:
   - After confirming functionality, delete the old access key

## Emergency Credential Rotation

In case of suspected security breach:

1. **Rotate all credentials immediately**
2. **Force logout all users** by updating JWT secret without a grace period
3. **Audit access logs** for unauthorized activities
4. **Document the incident** including timeline and affected systems
5. **Notify relevant stakeholders** if required by compliance policies

## Documentation and Tracking

Keep track of all secret rotations:

1. **Document rotation dates** in a secure internal system
2. **Set up calendar reminders** for scheduled rotations
3. **Update emergency contact information** for off-hours rotation needs

## Secret Storage

Always store secrets securely:

1. **Never commit secrets to code repositories**
2. **Use environment variables** for application configuration
3. **Consider a secret management service** like HashiCorp Vault for more sensitive environments
