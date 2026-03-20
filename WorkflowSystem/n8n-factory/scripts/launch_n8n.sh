#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# This will be passed as the first argument from our API controller
INSTANCE_ID="$1"
# The base directory where all instance configs are stored
INSTANCES_DIR="/app/n8n-instances" # Path inside the API container
BASE_DOMAIN="localhost" # Using .localhost for local dev

# --- Validation ---
if [ -z "$INSTANCE_ID" ]; then
  echo "Error: No instance ID provided."
  exit 1
fi

# --- Script Logic ---
INSTANCE_NAME="n8n-${INSTANCE_ID}"
INSTANCE_DIR="${INSTANCES_DIR}/${INSTANCE_NAME}"
INSTANCE_URL="${INSTANCE_NAME}.${BASE_DOMAIN}"

echo "🚀 Creating new n8n instance: ${INSTANCE_NAME}"

# Check if instance already exists
if [ -d "$INSTANCE_DIR" ]; then
  echo "⚠️ Instance directory ${INSTANCE_DIR} already exists. Skipping creation."
  exit 0
fi

# 1. Generate a secure, random password for the database
DB_PASSWORD=$(openssl rand -base64 32)

# 2. Create a dedicated directory for the instance's config and data
mkdir -p "$INSTANCE_DIR"

# 3. Create the docker-compose.yml file for the new instance stack
cat << EOF > "$INSTANCE_DIR/docker-compose.yml"
version: '3.9'

services:
  n8n:
    image: n8nio/n8n:local
    container_name: ${INSTANCE_NAME}
    restart: unless-stopped
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres_${INSTANCE_ID} # Connect to the postgres service below
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=${DB_PASSWORD}
      - DB_POSTGRESDB_DATABASE=n8n
      - N8N_HOST=${INSTANCE_URL}
      - WEBHOOK_URL=http://${INSTANCE_URL}/
      - GENERIC_TIMEZONE=Asia/Karachi # Change to your timezone
      - N8N_SECURE_COOKIE=false # Set to true if using HTTPS
    volumes:
      - n8n_${INSTANCE_ID}_data:/home/node/.n8n
    networks:
      - web
    depends_on:
      - postgres
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.${INSTANCE_NAME}.rule=Host(\`${INSTANCE_URL}\`)"
      - "traefik.http.routers.${INSTANCE_NAME}.entrypoints=web"
      - "traefik.http.services.${INSTANCE_NAME}.loadbalancer.server.port=5678"

  postgres:
    image: postgres:15
    container_name: postgres_${INSTANCE_ID}
    restart: unless-stopped
    environment:
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=n8n
    volumes:
      - n8n_${INSTANCE_ID}_db_data:/var/lib/postgresql/data
    networks:
      - web

volumes:
  n8n_${INSTANCE_ID}_data:
  n8n_${INSTANCE_ID}_db_data:

networks:
  web:
    external: true
EOF

# 4. Navigate into the new directory and start the n8n + postgres containers
cd "$INSTANCE_DIR"
docker-compose up -d

echo "✅ Instance ${INSTANCE_NAME} is launching at http://${INSTANCE_URL}"