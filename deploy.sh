#!/usr/bin/env bash
# deploy.sh — Zero-downtime deployment script for EduSuite SaaS
# Usage: bash deploy.sh [branch]

set -euo pipefail

BRANCH=${1:-main}
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "========================================"
echo " EduSuite Deploy — $(date)"
echo " Branch: $BRANCH"
echo "========================================"

# ── 1. Pull latest code ────────────────────────────────────────────────────────
echo "[1/8] Pulling latest code from $BRANCH…"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

# ── 2. Build Docker images ─────────────────────────────────────────────────────
echo "[2/8] Building Docker images…"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache laravel_app

# ── 3. Install/update Composer dependencies ────────────────────────────────────
echo "[3/8] Installing Composer dependencies…"
docker-compose run --rm laravel_app composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --prefer-dist

# ── 4. Run migrations ──────────────────────────────────────────────────────────
echo "[4/8] Running central migrations…"
docker-compose run --rm laravel_app php artisan migrate --force --no-interaction

echo "       Running tenant migrations…"
docker-compose run --rm laravel_app php artisan tenants:migrate --force

# ── 5. Clear all caches ────────────────────────────────────────────────────────
echo "[5/8] Clearing caches…"
docker-compose run --rm laravel_app php artisan optimize:clear
docker-compose run --rm laravel_app php artisan optimize
docker-compose run --rm laravel_app php artisan config:cache
docker-compose run --rm laravel_app php artisan route:cache
docker-compose run --rm laravel_app php artisan view:cache

# ── 6. Storage link ────────────────────────────────────────────────────────────
echo "[6/8] Linking storage…"
docker-compose run --rm laravel_app php artisan storage:link --force 2>/dev/null || true

# ── 7. Restart services ────────────────────────────────────────────────────────
echo "[7/8] Restarting containers…"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans

# ── 8. Restart Horizon ─────────────────────────────────────────────────────────
echo "[8/8] Restarting Horizon queue worker…"
docker-compose exec horizon php artisan horizon:terminate 2>/dev/null || true
sleep 2

# ── Health check ───────────────────────────────────────────────────────────────
echo ""
echo "Verifying deployment…"
sleep 5
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/up || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Deployment successful! /up returned HTTP 200"
else
    echo "⚠️  Warning: /up returned HTTP $HTTP_STATUS — check logs"
    docker-compose logs --tail=50 laravel_app
fi

echo ""
echo "========================================"
echo " Deploy complete: $TIMESTAMP"
echo "========================================"
