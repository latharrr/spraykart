#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/spraykart/frontend}"
PM2_APP="${PM2_APP:-spraykart}"
BRANCH="${BRANCH:-main}"

"$(dirname "$0")/predeploy_check.sh"

cd "$APP_DIR"
git pull origin "$BRANCH"
npm ci
npm run build
pm2 restart "$PM2_APP"
