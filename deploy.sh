#!/usr/bin/env bash
# Deploy latest code to VPS and restart the mini-golf API service.
# Run from local machine: ./deploy.sh
#
# Requires VPS_HOST=user@host in a local .env file (not committed).
set -euo pipefail

VPS=$(grep -E '^VPS_HOST=' .env | cut -d= -f2-)
[ -n "$VPS" ] || { echo "VPS_HOST not set in .env"; exit 1; }

echo "=== Pre-deploy checks ==="

if ! git diff-index --quiet HEAD --; then
    echo "WARNING: uncommitted local changes won't be deployed (only pushed commits)."
fi

echo "--- typecheck ---"
pnpm run typecheck

echo "--- git push ---"
git push origin main

echo ""
echo "=== Deploying to $VPS ==="

ssh "$VPS" bash <<'REMOTE'
set -euo pipefail
cd ~/mini-golf

export DATABASE_URL="file:/home/ubuntu/mini-golf/data/mini_golf.db"
export PORT=5761
export BASE_PATH="/"

echo "--- git pull ---"
git pull

echo "--- install deps ---"
pnpm install --frozen-lockfile

echo "--- db migrate ---"
pnpm --filter @workspace/db run push

echo "--- build ---"
pnpm run build

echo "--- publish static frontend (nginx can't read ~/mini-golf directly) ---"
sudo cp -r artifacts/mini-golf/dist/public/. /var/www/golf.flyboybyte.com/
sudo chown -R root:root /var/www/golf.flyboybyte.com
sudo chmod -R a+rX /var/www/golf.flyboybyte.com

echo "--- restart api service ---"
systemctl --user restart mini-golf-api.service

echo "--- status ---"
systemctl --user status mini-golf-api.service --no-pager -l | head -8
REMOTE

echo ""
echo "Deploy complete."
