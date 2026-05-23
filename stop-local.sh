#!/usr/bin/env bash
set -euo pipefail

# Stop the local Garrison Forge dev server started by start-local.sh

PID_FILE=".dev-server.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "No PID file found ($PID_FILE). Is the dev server running?"
  exit 0
fi

PID=$(cat "$PID_FILE" || true)

if [ -z "${PID:-}" ]; then
  echo "PID file is empty. Removing it."
  rm -f "$PID_FILE"
  exit 0
fi

if kill -0 "$PID" 2>/dev/null; then
  echo "Stopping dev server with PID $PID..."
  kill "$PID" || true
  # Give it a moment to shut down
  sleep 1
  if kill -0 "$PID" 2>/dev/null; then
    echo "Process still alive, sending SIGKILL..."
    kill -9 "$PID" || true
  fi
  echo "✅ Dev server stopped."
else
  echo "No process with PID $PID is running. Cleaning up PID file."
fi

rm -f "$PID_FILE"
