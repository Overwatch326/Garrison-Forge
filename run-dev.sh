#!/usr/bin/env bash
set -euo pipefail

# Helper script to install deps and start the dev server
# Run this from inside the Garrison-Forge folder:
#   ./run-dev.sh

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Use absolute npm in case of alias issues
NPM_BIN="$(command -v npm)"

if [ -z "$NPM_BIN" ]; then
  echo "npm is not installed or not in PATH. Install Node.js + npm first." >&2
  exit 1
fi

echo "Using npm at: $NPM_BIN"

echo "Installing dependencies (npm install)..."
"$NPM_BIN" install

echo "Starting dev server (npm run dev)..."
"$NPM_BIN" run dev
