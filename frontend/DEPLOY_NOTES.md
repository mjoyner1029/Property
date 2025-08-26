# Frontend Deployment Guide

This document provides comprehensive instructions for deploying the Asset Anchor frontend application in production environments.

## Deployment Options

The application can be deployed using various methods:

1. **Static Hosting with Runtime Environment Injection** (Recommended)
   - Build the app and use the provided Express server for runtime environment injection
   - Works with platforms like Render, Heroku, or any Docker-capable host

2. **Static Hosting with Build-Time Environment**
   - Traditional static hosting with environment variables set at build time
   - Works with Vercel, Netlify, AWS S3 + CloudFront, etc.

3. **Container Deployment**
   - Using the provided Dockerfile for containerized deployment
   - Works with Kubernetes, Docker Swarm, ECS, etc.

## Prerequisites

- Node.js >= 20.x
- npm >= 9.x
- Proper environment variables (see below)

## Environment Variables

The application requires several environment variables to function correctly. These can be set either at build time or runtime (using the provided Express server).

See [.env.example](/.env.example) for a complete list of supported variables.

### Required Environment Variables

```
REACT_APP_API_URL=https://api.your-domain.com/api
REACT_APP_FRONTEND_URL=https://your-domain.com
```

### Production Environment Variables

```
NODE_ENV=production
REACT_APP_ENV=production
REACT_APP_LOG_LEVEL=error
REACT_APP_SENTRY_ENVIRONMENT=production
```

## Build Instructions

### Standard Build

```bash
# Install dependencies
npm ci

# Build for production
npm run build:prod

# Start production server (with runtime env injection)
npm run start:prod
```

### Docker Build

```bash
# Build the Docker image
docker build -t asset-anchor-frontend:latest .

# Run the container
docker run -p 3000:3000 \
  -e REACT_APP_API_URL=https://api.your-domain.com/api \
  -e REACT_APP_FRONTEND_URL=https://your-domain.com \
  asset-anchor-frontend:latest
```

## Platform-Specific Instructions

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in the Vercel dashboard
3. Use the following settings:
   - Build Command: `npm run build:prod`
   - Output Directory: `build`
   - Install Command: `npm ci`
4. Deploy using the Vercel dashboard or CLI

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Configure environment variables in the Netlify dashboard
3. Use the following settings:
   - Build Command: `npm run build:prod`
   - Publish Directory: `build`
4. Set up redirect rules in netlify.toml (already included in the repo)

### Docker/Kubernetes Deployment

The application includes a Dockerfile that builds the app and sets up the Express server for runtime environment injection.

1. Build the Docker image:
   ```bash
   docker build -t asset-anchor-frontend:latest .
   ```

2. Run the container with required environment variables:
   ```bash
   docker run -p 3000:3000 \
     -e REACT_APP_API_URL=https://api.your-domain.com/api \
     -e REACT_APP_FRONTEND_URL=https://your-domain.com \
     asset-anchor-frontend:latest
   ```

3. For Kubernetes, use the provided k8s manifest files in the `/k8s` directory.

## Security Considerations

1. **Content Security Policy**: The Express server includes a default CSP. Review and adjust it in `start.js` based on your requirements.

2. **Security Headers**: Additional security headers are set in the Express server. Review and adjust them as needed.

3. **Environment Variables**: Never include secrets in frontend environment variables. Use the backend for handling secrets and authentication.

4. **HTTPS**: Always deploy the frontend with HTTPS in production.

## Monitoring and Logging

1. **Sentry Integration**: Set up Sentry for error tracking by providing the `REACT_APP_SENTRY_DSN` environment variable.

2. **Logging**: The application uses a structured logging system with configurable log levels via `REACT_APP_LOG_LEVEL`.

3. **Health Checks**: The Express server provides `/health` and `/ready` endpoints for monitoring.

## Performance Optimizations

1. **Compression**: The Express server includes response compression.

2. **Cache Control**: Proper cache headers are set for static assets.

3. **Source Maps**: Source maps are disabled in production builds by default. Enable them if needed using `GENERATE_SOURCEMAP=true`.

## Troubleshooting

### Common Issues

1. **API Connection Issues**: Verify that the `REACT_APP_API_URL` is correct and the API is accessible from the frontend.

2. **404 Errors on Refresh**: Ensure that proper redirect rules are in place for SPA routing.

3. **Environment Variable Issues**: Verify that environment variables are correctly set according to the platform requirements.

### Debug Mode

For debugging deployment issues, you can enable debug logging by setting:

```
REACT_APP_LOG_LEVEL=debug
```

## Release Process

1. Run the release preparation script:
   ```bash
   npm run prepare:release
   ```

2. Verify that all tests pass and the build completes successfully.

3. Deploy to your production environment.

4. Monitor error tracking and performance metrics after deployment.

## Additional Resources

- [React Production Best Practices](https://reactjs.org/docs/optimizing-performance.html)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Docker Deployment Guide](https://docs.docker.com/get-started/overview/)
