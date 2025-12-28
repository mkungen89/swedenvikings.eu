#!/bin/bash
# ===========================================
# Sweden Vikings CMS - Manual Deploy Script
# ===========================================
# Run this on the VPS to manually deploy/update
# Usage: bash /opt/swedenvikings/scripts/deploy.sh

set -e

PROJECT_DIR="/opt/swedenvikings"
COMPOSE_FILE="docker-compose.prod.yml"

echo "===========================================
Sweden Vikings CMS - Manual Deployment
==========================================="

cd "$PROJECT_DIR"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "ERROR: .env.production not found!"
    echo "Please create it from .env.example:"
    echo "  cp .env.example .env.production"
    echo "  nano .env.production"
    exit 1
fi

# Pull latest changes
echo ">>> Pulling latest changes..."
git pull origin main

# Build containers
echo ">>> Building Docker images..."
docker compose -f "$COMPOSE_FILE" build

# Stop old containers
echo ">>> Stopping old containers..."
docker compose -f "$COMPOSE_FILE" down

# Start new containers
echo ">>> Starting containers..."
docker compose -f "$COMPOSE_FILE" up -d

# Wait for services to be ready
echo ">>> Waiting for services to start..."
sleep 15

# Run database migrations
echo ">>> Running database migrations..."
docker compose -f "$COMPOSE_FILE" exec -T app npx prisma migrate deploy

# Cleanup
echo ">>> Cleaning up old Docker images..."
docker image prune -f

# Check status
echo ">>> Container status:"
docker compose -f "$COMPOSE_FILE" ps

echo "
===========================================
Deployment Complete!
===========================================
"

