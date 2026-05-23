#!/usr/bin/env bash
# macOS-friendly double-click script to start the Garrison Forge dev server

cd "$(dirname "$0")"

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "node_modules not found. Running npm install..."
  npm install
fi

./start-local.sh

read -p "Press Enter to close this window..." _
