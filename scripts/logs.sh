#!/bin/bash
# ===========================================
# Sweden Vikings CMS - View Logs Script
# ===========================================
# Usage: bash /opt/swedenvikings/scripts/logs.sh [service]
# Services: app, postgres, redis

PROJECT_DIR="/opt/swedenvikings"

cd "$PROJECT_DIR"

SERVICE="${1:-app}"

case "$SERVICE" in
    app)
        echo ">>> Viewing CMS app logs (press Ctrl+C to exit)..."
        docker compose -f docker-compose.prod.yml logs -f app
        ;;
    postgres|db)
        echo ">>> Viewing PostgreSQL logs (press Ctrl+C to exit)..."
        docker compose -f docker-compose.prod.yml logs -f postgres
        ;;
    redis)
        echo ">>> Viewing Redis logs (press Ctrl+C to exit)..."
        docker compose -f docker-compose.prod.yml logs -f redis
        ;;
    all)
        echo ">>> Viewing all logs (press Ctrl+C to exit)..."
        docker compose -f docker-compose.prod.yml logs -f
        ;;
    *)
        echo "Usage: $0 [app|postgres|redis|all]"
        exit 1
        ;;
esac

