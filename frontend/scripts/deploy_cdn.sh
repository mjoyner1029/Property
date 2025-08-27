#!/bin/bash
# Script to deploy frontend to Cloudflare CDN
# Requires Wrangler CLI to be installed: npm i @cloudflare/wrangler -g

set -e

echo "Starting deployment to Cloudflare CDN..."

# Build the project
echo "Building frontend..."
npm run build

# Ensure we have the workers site package
if [ ! -d "workers-site" ]; then
  echo "Creating workers site directory..."
  mkdir -p workers-site
  
  # Create package.json
  cat > workers-site/package.json << EOF
{
  "name": "assetanchor-worker",
  "version": "1.0.0",
  "description": "Asset Anchor CDN Worker",
  "main": "index.js",
  "dependencies": {
    "@cloudflare/kv-asset-handler": "^0.3.0"
  }
}
EOF

  # Create index.js worker
  cat > workers-site/index.js << EOF
import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler'

/**
 * The DEBUG flag will do two things:
 * 1. We will skip caching on the edge, which makes it easier to debug
 * 2. We will return an error if the asset is not found in KV
 */
const DEBUG = false

/**
 * Handle frontend requests and serve from CDN
 */
addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event))
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500,
        }),
      )
    }
    event.respondWith(new Response('Internal Error', { status: 500 }))
  }
})

/**
 * Handle requests by serving assets from KV or returning index.html for SPA routes
 */
async function handleEvent(event) {
  const url = new URL(event.request.url)

  try {
    // Serve static assets directly
    if (url.pathname.match(/\\.(js|css|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|ico)$/)) {
      return await getAssetFromKV(event)
    }
    
    // For everything else, return index.html for SPA routing
    let options = {}
    
    // If this is a SPA route, serve index.html
    if (!url.pathname.match(/\\.(js|css|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|ico)$/)) {
      options = {
        mapRequestToAsset: req => {
          return new Request(\`\${new URL(req.url).origin}/index.html\`, req)
        }
      }
    }

    let response = await getAssetFromKV(event, options)

    // Add cache control headers to match wrangler.toml
    if (response.status === 200) {
      // Apply different cache rules for different file types
      const url = new URL(event.request.url)
      
      if (url.pathname.match(/\\.(js|css|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|ico)$/)) {
        response = new Response(response.body, {
          ...response,
          headers: {
            ...response.headers,
            'Cache-Control': 'public, max-age=31536000',
          },
        })
      } else {
        response = new Response(response.body, {
          ...response,
          headers: {
            ...response.headers,
            'Cache-Control': 'public, max-age=86400',
          },
        })
      }
    }
    
    return response
  } catch (e) {
    // If an error is thrown try to serve the fallback
    if (DEBUG) {
      return new Response(e.message || e.toString(), {
        status: 500,
      })
    }
    
    try {
      const fallbackResponse = await getAssetFromKV(event, {
        mapRequestToAsset: req => {
          return new Request(\`\${new URL(req.url).origin}/index.html\`, req)
        },
      })
      
      return new Response(fallbackResponse.body, {
        ...fallbackResponse,
        status: 200,
        headers: {
          ...fallbackResponse.headers,
          'Cache-Control': 'public, max-age=600',
        },
      })
    } catch (e) {
      return new Response('Internal Error', { status: 500 })
    }
  }
}
EOF

  # Install dependencies
  cd workers-site
  npm install
  cd ..
  
  echo "Workers site created."
fi

# Publish to Cloudflare using Wrangler
echo "Deploying to Cloudflare CDN..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo "Wrangler CLI not found. Please install it with: npm i @cloudflare/wrangler -g"
  exit 1
fi

# Deploy
wrangler publish

echo "Deployment to CDN complete!"
