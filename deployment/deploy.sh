#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/spraykart/frontend}"
REPO_DIR="${REPO_DIR:-$(cd "$APP_DIR/.." && pwd)}"
PM2_APP="${PM2_APP:-spraykart}"
BRANCH="${BRANCH:-main}"

"$(dirname "$0")/predeploy_check.sh"

cd "$APP_DIR"
git pull origin "$BRANCH"
npm ci
npm run build
if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
  pm2 reload "$PM2_APP" --update-env
else
  pm2 start "$REPO_DIR/deployment/ecosystem.config.js" --update-env
fi
