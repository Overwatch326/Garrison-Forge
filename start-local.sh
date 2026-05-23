#!/usr/bin/env bash
set -euo pipefail

# Start the Garrison Forge app locally.
# This assumes you have Node/npm installed and a dev script defined.
# By default, it will run `npm run dev` in the current folder.
# If you later put the app in a subfolder (e.g. frontend/), update APP_DIR below.

APP_DIR="."          # change to "frontend" if your app lives there
PID_FILE=".dev-server.pid"

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE" || true)
  if [ -n "${PID:-}" ] && kill -0 "$PID" 2>/dev/null; then
    echo "Dev server already seems to be running with PID $PID."
    echo "If this is wrong, delete $PID_FILE and try again."
    exit 0
  fi
fi

cd "$APP_DIR"

echo "Starting dev server with: npm run dev"
# Start in background
npm run dev &
PID=$!

echo "$PID" > "${OLDPWD}/${PID_FILE}"

echo "✅ Dev server started (PID $PID)."
