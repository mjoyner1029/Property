# DNS Setup for Asset Anchor

This document contains the exact DNS records needed for the Asset Anchor production deployment.

## Required DNS Records

| Type  | Hostname | Value/Target | TTL |
|-------|----------|-------------|-----|
| A     | @ (apex) | 76.76.21.21 | Auto/3600 |
| CNAME | www      | cname.vercel-dns.com. | Auto/3600 |
| CNAME | api      | assetanchor.onrender.com. | Auto/3600 |

## Notes

- The apex/root domain points directly to Vercel's anycast IP
- The www subdomain is a CNAME to Vercel's DNS service
- The api subdomain points to the Render service
- After updating DNS records, it may take up to 24-48 hours for changes to fully propagate

## Verification

You can verify DNS propagation using:

```bash
dig assetanchor.io +short
dig www.assetanchor.io +short
dig api.assetanchor.io +short
```

Or using an online tool like [DNSChecker](https://dnschecker.org).
