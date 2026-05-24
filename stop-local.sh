#!/usr/bin/env bash
set -euo pipefail

# Stop the local Garrison Forge dev server started by start-local.sh

PID_FILE_FRONTEND=".dev-frontend.pid"
PID_FILE_BACKEND=".dev-backend.pid"

stop_pid() {
  local file="$1"
  if [ ! -f "$file" ]; then
    return
  fi
  local PID
  PID=$(cat "$file" || true)
  if [ -z "${PID:-}" ]; then
    rm -f "$file"
    return
  fi
  if kill -0 "$PID" 2>/dev/null; then
    echo "Stopping process with PID $PID from $file..."
    kill "$PID" || true
    sleep 1
    if kill -0 "$PID" 2>/dev/null; then
      echo "Process still alive, sending SIGKILL..."
      kill -9 "$PID" || true
    fi
    echo "✅ Process $PID stopped."
  else
    echo "No process with PID $PID (from $file) is running. Cleaning up PID file."
  fi
  rm -f "$file"
}

stop_pid "$PID_FILE_FRONTEND"
stop_pid "$PID_FILE_BACKEND"
