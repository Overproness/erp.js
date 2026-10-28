# Multi-stage Dockerfile for ERP.js Backend
FROM node:20.9.0-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json tsconfig.json ./
RUN npm ci --no-audit --no-fund

# Copy backend source code
COPY src ./src
COPY scripts ./scripts

# Build TypeScript to JavaScript
RUN npm run build

# Production runtime image
FROM node:20.9.0-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8888

# Install dumb-init for proper signal handling in container environments
RUN apk add --no-cache dumb-init

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production --no-audit --no-fund --ignore-scripts

# Copy compiled production artifacts
COPY --from=builder /app/dist ./dist

# Create necessary upload and public storage directories
RUN mkdir -p /app/dist/uploads /app/dist/public

# Run as standard unprivileged node user
USER node

EXPOSE 8888

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "-r", "module-alias/register", "dist/server.js"]
