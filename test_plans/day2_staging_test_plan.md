# Day 2 - Staging Environment Testing Plan

## Overview
This document outlines the test plan for Day 2 goals: verifying core flows in staging, confirming monitoring is live, and ensuring rate-limits and CSP are behaving as expected.

## Prerequisites
1. Access to staging environment
2. Admin, landlord, and tenant test accounts
3. Stripe test keys configured
4. Stripe CLI installed for webhook testing
5. Redis configured for rate limiting
6. Sentry DSN configured for both frontend and backend

## 1. Authentication Flows

### Register Flow
- **Test Case**: Create new user accounts for each role (admin, landlord, tenant)
- **Expected Result**: Accounts created successfully, verification emails sent
- **Steps**:
  1. Navigate to register page
  2. Fill required fields with valid data
  3. Submit form
  4. Check database for user creation
  5. Verify welcome email received

### Login Flow
- **Test Case**: Log in with newly created accounts
- **Expected Result**: Successful login, redirected to appropriate dashboard
- **Steps**:
  1. Navigate to login page
  2. Enter credentials
  3. Submit form
  4. Verify redirection to role-specific dashboard
  5. Verify JWT token issued

### Forgot/Reset Password Flow
- **Test Case**: Reset password for each role
- **Expected Result**: Password reset email sent, password changed successfully
- **Steps**:
  1. Navigate to forgot password page
  2. Submit email address
  3. Check for reset email
  4. Click reset link
  5. Set new password
  6. Verify login with new password

### Email Verification
- **Test Case**: Verify email for new accounts
- **Expected Result**: Email marked as verified in system
- **Steps**:
  1. Check verification email
  2. Click verification link
  3. Verify status change in database

## 2. Role-based Access Control

### Admin Access
- **Test Case**: Admin can access all routes and data
- **Expected Result**: Full access to all system areas
- **Steps**:
  1. Log in as admin
  2. Navigate to admin-only routes
  3. Verify access to all properties across tenants
  4. Check admin-specific actions (user management, system settings)

### Landlord Access
- **Test Case**: Landlord can only access their own properties and tenants
- **Expected Result**: Access limited to owned resources
- **Steps**:
  1. Log in as landlord
  2. Verify access to owned properties
  3. Attempt to access other landlords' properties (should be denied)

### Tenant Access
- **Test Case**: Tenant can only access their assigned units and personal data
- **Expected Result**: Access limited to personal resources
- **Steps**:
  1. Log in as tenant
  2. Verify access to assigned units
  3. Attempt to access other tenants' data (should be denied)
  4. Verify access to personal payment history

## 3. CRUD Operations

### Properties
- **Test Case**: Create, read, update, and delete properties
- **Expected Result**: All operations work as expected
- **Steps**:
  1. Create new property with required fields
  2. View property details
  3. Update property information
  4. Delete property (if applicable)

### Tenants
- **Test Case**: Create, read, update, and delete tenant records
- **Expected Result**: All operations work as expected
- **Steps**:
  1. Create new tenant account
  2. Assign to property
  3. Update tenant information
  4. Remove tenant from property

### Maintenance
- **Test Case**: Create, read, update, and delete maintenance requests
- **Expected Result**: All operations work as expected
- **Steps**:
  1. Create maintenance request as tenant
  2. View request as landlord
  3. Update status of request
  4. Close request

### Messages
- **Test Case**: Send and receive messages between roles
- **Expected Result**: Messages delivered and stored correctly
- **Steps**:
  1. Send message from tenant to landlord
  2. Verify landlord receives notification
  3. Reply to message
  4. Verify thread is maintained

## 4. Payment Processing

### One-time Checkout Session
- **Test Case**: Create a one-time payment via Stripe Checkout
- **Expected Result**: Payment processed, recorded in system
- **Steps**:
  1. Log in as tenant
  2. Navigate to payment page
  3. Select one-time payment option
  4. Enter Stripe test card details
  5. Complete payment
  6. Verify payment recorded in database
  7. Check payment history in UI

### Subscription Creation
- **Test Case**: Create a recurring subscription via Stripe
- **Expected Result**: Subscription created, initial payment processed
- **Steps**:
  1. Log in as tenant
  2. Navigate to subscription setup
  3. Select subscription plan
  4. Enter Stripe test card details
  5. Complete subscription setup
  6. Verify subscription record in database
  7. Verify subscription visible in tenant dashboard

### Webhook Idempotency
- **Test Case**: Test duplicate webhook events handling
- **Expected Result**: Duplicate events don't create duplicate records
- **Steps**:
  1. Use Stripe CLI to simulate webhook event
  2. Send same event multiple times
  3. Verify system only processes once
  4. Check logs for idempotency key handling

### Signature Verification
- **Test Case**: Test invalid webhook signatures
- **Expected Result**: Invalid signatures rejected
- **Steps**:
  1. Use Stripe CLI to simulate webhook with invalid signature
  2. Verify event rejected
  3. Check logs for signature verification failures

### Payment State Updates
- **Test Case**: Verify system state changes after payment
- **Expected Result**: Related records updated properly
- **Steps**:
  1. Make test payment
  2. Verify invoice marked as paid
  3. Verify payment history updated
  4. Check landlord dashboard for payment reflection

## 5. Multi-tenancy Verification

### Data Isolation
- **Test Case**: Create two tenant organizations with similar data structures
- **Expected Result**: Complete data isolation between tenants
- **Steps**:
  1. Create Tenant Organization A with properties, users, payments
  2. Create Tenant Organization B with properties, users, payments
  3. Log in as user from Organization A
  4. Verify only Organization A data is visible
  5. Log in as user from Organization B
  6. Verify only Organization B data is visible

### Isolation Tests
- **Test 1**: Properties Isolation
  - Create properties in both orgs, verify no cross-visibility
  
- **Test 2**: Tenants Isolation
  - Add tenant users to both orgs, verify no cross-visibility
  
- **Test 3**: Payments Isolation
  - Process payments in both orgs, verify financial data separation
  
- **Test 4**: Messages Isolation
  - Send messages in both orgs, verify communication isolation

### White-labeling / Branding
- **Test Case**: Verify tenant-specific branding if supported
- **Expected Result**: UI displays appropriate branding per tenant
- **Steps**:
  1. Configure branding for each tenant organization
  2. Log in to each tenant portal
  3. Verify logos, colors, and themes are tenant-specific

## 6. Security and Performance

### CSP Report-Only Mode
- **Test Case**: Check for CSP violations
- **Expected Result**: Any violations reported but not blocked
- **Steps**:
  1. Check browser console for CSP violation warnings
  2. Check Sentry for reported violations
  3. Document any legitimate sources that need whitelist additions

### Rate Limiting with Redis
- **Test Case**: Verify rate limiting is active
- **Expected Result**: Requests beyond limit receive 429 response
- **Steps**:
  1. Use script or tool to send rapid API requests
  2. Verify 429 responses after limit exceeded
  3. Check Redis for rate limit records
  4. Verify rate limit headers are present in responses

### CORS Configuration
- **Test Case**: Verify CORS allows only permitted origins
- **Expected Result**: Only Vercel FE and admin origins allowed
- **Steps**:
  1. Make cross-origin requests from allowed origins (should succeed)
  2. Make cross-origin requests from disallowed origins (should fail)
  3. Check for proper CORS headers in responses

### Lighthouse CI
- **Test Case**: Run Lighthouse tests on key pages
- **Expected Result**: Establish baseline performance metrics
- **Steps**:
  1. Run Lighthouse tests on login, dashboard, and key workflow pages
  2. Document performance, accessibility, best practices, and SEO scores
  3. Save reports as baseline for future comparison

## 7. Monitoring

### Sentry Error Tracking
- **Test Case**: Trigger controlled errors in frontend and backend
- **Expected Result**: Errors captured with stack traces in Sentry
- **Steps**:
  1. Backend: Trigger 500 error via special endpoint
  2. Frontend: Trigger JavaScript error
  3. Verify both errors appear in Sentry
  4. Confirm environment tag is "staging"
  5. Verify user context and breadcrumbs included

### Health Checks
- **Test Case**: Verify health endpoints are responding
- **Expected Result**: Healthy responses from all services
- **Steps**:
  1. Test backend health endpoint `/api/health`
  2. Test frontend root for proper loading
  3. Set up external uptime monitoring for both
  4. Verify monitoring alerts configured

## 8. Deliverables

### Payments End-to-End
- Document successful payment flows (happy path)
- Document error handling for payment failures
- Capture screenshots of payment process and receipts

### Two-tenant Isolation Verification
- Document test cases proving isolation
- Capture evidence of isolation between tenants
- Document any potential isolation weaknesses found

### CSP/Rate Limit/CORS Verification
- Document CSP configuration and any violations found
- Provide evidence of rate limiting working correctly
- Document CORS tests and results

### Sentry Events
- Provide screenshots of captured errors in Sentry
- Verify both frontend and backend events are properly tagged
- Confirm all expected error context is included
