# DNS Setup Guide for Asset Anchor

This guide explains how to configure DNS for the Asset Anchor application.

## Domain Architecture

Asset Anchor uses the following domain structure:

- `assetanchor.io` - Main application (Vercel)
- `www.assetanchor.io` - Alternate entry point (Vercel)
- `api.assetanchor.io` - API endpoints (Render)

## Required DNS Records

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A | @ (apex) | 76.76.21.21 | Points apex domain to Vercel |
| CNAME | www | cname.vercel-dns.com. | Points www subdomain to Vercel |
| CNAME | api | [your-render-app-name].onrender.com. | Points API subdomain to Render |

## Step-by-Step Configuration

### 1. Vercel DNS Configuration

1. Log in to your Vercel account
2. Add `assetanchor.io` as a domain in your project settings:
   - Go to Project → Settings → Domains
   - Add `assetanchor.io` and follow the instructions
   - Add `www.assetanchor.io` as a domain alias

3. Vercel will give you DNS records to add to your domain registrar:
   - A record for the apex domain (`assetanchor.io`) pointing to `76.76.21.21`
   - CNAME record for `www` pointing to `cname.vercel-dns.com.`

### 2. Render DNS Configuration

1. Log in to your Render account
2. Navigate to your backend service dashboard
3. Go to Settings → Custom Domains
4. Add `api.assetanchor.io` as a custom domain
5. Render will provide you with a CNAME value (something like `[your-app].onrender.com`)
6. Add this CNAME record to your domain registrar

### 3. Registrar Configuration

At your domain registrar (e.g., Namecheap, GoDaddy, etc.):

1. Access the DNS settings for `assetanchor.io`
2. Add the following records:
   ```
   A     @     76.76.21.21
   CNAME  www   cname.vercel-dns.com.
   CNAME  api   [your-render-app-name].onrender.com.
   ```
3. Save changes

## SSL Certificate Verification

Both Vercel and Render will automatically provision SSL certificates via Let's Encrypt once the DNS records propagate.

### Verifying SSL for Vercel

1. Wait 5-10 minutes after DNS changes (can take up to 24-48 hours to fully propagate)
2. Visit `https://assetanchor.io` in your browser
3. Check for the padlock icon in the address bar
4. In Vercel dashboard, your domain should show "Valid Configuration" with a green checkmark

### Verifying SSL for Render

1. Wait 5-10 minutes after DNS changes (can take up to 24-48 hours to fully propagate)
2. Visit `https://api.assetanchor.io/api/health` in your browser
3. Check for the padlock icon in the address bar
4. In Render dashboard under Custom Domains, status should change from "Pending" to "Active"

## Troubleshooting

### DNS Propagation Issues

- Use `dig assetanchor.io` or online DNS lookup tools to verify records
- DNS changes can take 24-48 hours to fully propagate worldwide

### SSL Certificate Issues

- If Vercel/Render cannot verify domain ownership, check your DNS records again
- Ensure no CAA records are blocking Let's Encrypt certificate issuance
- If using Cloudflare, make sure the proxy is turned off (DNS only) during initial setup

### API Subdomain Not Working

- Verify the CNAME record points to the correct Render URL
- Check if the Render service is running
- Verify that the custom domain is properly configured in Render

## Email Domain Verification

For email deliverability, see the `EMAIL.md` file for SPF, DKIM, and DMARC setup instructions.
