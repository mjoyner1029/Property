# DNS Setup Quick Guide

This document provides the exact DNS configuration needed for Asset Anchor production deployment.

## Required DNS Records

| Type | Host/Name | Value/Target | TTL | Purpose |
|------|-----------|--------------|-----|---------|
| A | @ | 76.76.21.21 | 3600 | Apex domain pointing to Vercel |
| CNAME | www | cname.vercel-dns.com. | 3600 | www subdomain for frontend |
| CNAME | api | assetanchor-api.onrender.com. | 3600 | API subdomain for backend |

## Verification Commands

After setting up DNS records, you should verify they are properly propagated:

```bash
# Verify apex domain
dig assetanchor.io +noall +answer

# Verify www subdomain
dig www.assetanchor.io +noall +answer

# Verify api subdomain
dig api.assetanchor.io +noall +answer
```

Expected results:

```
assetanchor.io.        3600    IN      A       76.76.21.21
www.assetanchor.io.    3600    IN      CNAME   cname.vercel-dns.com.
api.assetanchor.io.    3600    IN      CNAME   assetanchor-api.onrender.com.
```

## SSL/TLS Certificates

SSL certificates are automatically managed by Vercel for the frontend domains and by Render for the API domain. No manual certificate configuration is required.

## DNS Propagation

DNS propagation can take up to 24-48 hours worldwide, but often completes within a few hours. You can check propagation status using:

```bash
# Check global propagation
curl -s https://dnschecker.org/api/?mode=A\&domain=assetanchor.io | jq
```

Or using an online tool like [DNSChecker](https://dnschecker.org).

## Going Live Checklist

- [ ] Verify all DNS records are configured correctly
- [ ] Ensure SSL certificates are issued and valid
- [ ] Test all domains using curl or browser
- [ ] Verify that API requests from frontend work correctly
- [ ] Check for mixed content warnings in browser console
- [ ] Ensure proper redirects are in place (HTTP to HTTPS, non-www to www if desired)
