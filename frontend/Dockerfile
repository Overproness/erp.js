# Use official Node.js runtime as parent image
FROM node:20.9.0-alpine

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=8192

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with specific flags for memory optimization
RUN npm ci --only=production --no-optional --no-fund --no-audit

# Copy source code
COPY . .

# Build the application
RUN npm run build:render

# Install serve to serve static files
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]
