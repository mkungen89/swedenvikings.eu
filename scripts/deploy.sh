#!/bin/bash
# ===========================================
# Sweden Vikings CMS - Manual Deploy Script
# ===========================================
# Run this on the VPS to manually deploy/update
# Usage: bash /opt/swedenvikings/scripts/deploy.sh

set -e

PROJECT_DIR="/opt/swedenvikings"

echo "===========================================
Sweden Vikings CMS - Native Deployment
==========================================="

cd "$PROJECT_DIR"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "ERROR: .env.production not found!"
    echo "Please create it from .env.example.production:"
    echo "  cp .env.example.production .env.production"
    echo "  nano .env.production"
    exit 1
fi

# Pull latest changes
echo ">>> Pulling latest changes from git..."
git pull origin main

# Install dependencies
echo ">>> Installing dependencies..."
npm install --production=false

# Build the application
echo ">>> Building frontend and backend..."
npm run build

# Generate Prisma client
echo ">>> Generating Prisma client..."
cd server && npx prisma generate && cd ..

# Run database migrations
echo ">>> Running database migrations..."
cd server && npx prisma migrate deploy && cd ..

# Reload PM2 processes (zero-downtime)
echo ">>> Reloading PM2 processes..."
pm2 reload ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Show status
echo ">>> PM2 Status:"
pm2 status

echo "
===========================================
Deployment Complete!
===========================================

Service status:
$(pm2 status)

Logs:
- pm2 logs swedenvikings
- pm2 logs swedenvikings --lines 100

Monitoring:
- pm2 monit

"

