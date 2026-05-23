#!/usr/bin/env bash
# macOS-friendly double-click script to stop the Garrison Forge dev server

cd "$(dirname "$0")"

./stop-local.sh

read -p "Press Enter to close this window..." _
