# frontend/Dockerfile

# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Set build arguments and environment variables
ARG REACT_APP_API_URL
ARG NODE_ENV=production
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV NODE_ENV=$NODE_ENV

# Copy package.json and package-lock.json
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of the code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Install bash for debugging if needed
RUN apk add --no-cache bash

# Create custom nginx config to add security headers
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

# Copy the build output
COPY --from=build /app/build /usr/share/nginx/html

# Add a healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
