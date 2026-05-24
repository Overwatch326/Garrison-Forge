#!/usr/bin/env bash
set -euo pipefail

# Start the Garrison Forge app locally (backend + Vite dev server).
# Assumes you have Node/npm installed.
# - Starts backend dev server on port 4000
# - Starts frontend Vite dev server on port 5173
# PID files are written so stop-local.sh can terminate them.

APP_DIR="."          # root of repo
BACKEND_DIR="backend"
PID_FILE_FRONTEND=".dev-frontend.pid"
PID_FILE_BACKEND=".dev-backend.pid"

# Check existing frontend dev
if [ -f "$PID_FILE_FRONTEND" ]; then
  PID=$(cat "$PID_FILE_FRONTEND" || true)
  if [ -n "${PID:-}" ] && kill -0 "$PID" 2>/dev/null; then
    echo "Frontend dev server already seems to be running with PID $PID."
  fi
fi

# Check existing backend dev
if [ -f "$PID_FILE_BACKEND" ]; then
  BPID=$(cat "$PID_FILE_BACKEND" || true)
  if [ -n "${BPID:-}" ] && kill -0 "$BPID" 2>/dev/null; then
    echo "Backend dev server already seems to be running with PID $BPID."
  fi
fi

cd "$APP_DIR"

echo "Ensuring root dependencies are installed (npm install)..."
npm install

echo "Ensuring backend dependencies are installed (npm install in backend/)..."
(cd "$BACKEND_DIR" && npm install)

# Start backend dev server
if [ ! -f "$PID_FILE_BACKEND" ] || ! kill -0 "$(cat "$PID_FILE_BACKEND" 2>/dev/null || echo 0)" 2>/dev/null; then
  echo "Starting backend dev server (npm run dev in $BACKEND_DIR)..."
  (cd "$BACKEND_DIR" && npm run dev) &
  BPID=$!
  echo "$BPID" > "${OLDPWD}/${PID_FILE_BACKEND}"
  echo "✅ Backend dev server started (PID $BPID) on http://localhost:4000"
else
  echo "Backend dev server already running, skipping start."
fi

# Start frontend dev server
if [ ! -f "$PID_FILE_FRONTEND" ] || ! kill -0 "$(cat "$PID_FILE_FRONTEND" 2>/dev/null || echo 0)" 2>/dev/null; then
  echo "Starting frontend dev server (npm run dev)..."
  npm run dev &
  FPID=$!
  echo "$FPID" > "${OLDPWD}/${PID_FILE_FRONTEND}"
  echo "✅ Frontend dev server started (PID $FPID) on http://localhost:5173"
else
  echo "Frontend dev server already running, skipping start."
fi
