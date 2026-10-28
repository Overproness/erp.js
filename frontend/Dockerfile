# Multi-stage Dockerfile for ERP.js Frontend
FROM node:20.9.0-alpine AS builder

WORKDIR /app

ENV NODE_OPTIONS=--max-old-space-size=4096

# Copy package definitions and install dependencies
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy frontend source code
COPY . .

# Build production bundle
RUN npm run build

# Production runtime stage using lightweight Nginx
FROM nginx:1.25-alpine AS runner

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA fallback and API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
