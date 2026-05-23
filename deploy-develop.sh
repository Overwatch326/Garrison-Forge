#!/usr/bin/env bash
set -euo pipefail

# Garrison Forge - simple deploy script for the 'develop' branch
# Usage:
#   ./deploy-develop.sh "feat: update build thread UI"

BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$BRANCH" != "develop" ]; then
  echo "You are on branch '$BRANCH'."
  echo "Switch to 'develop' before deploying:"
  echo "  git checkout develop"
  exit 1
fi

echo "Staging all changes..."
git add .

MESSAGE=${1:-"chore: deploy to develop"}

echo "Committing with message: $MESSAGE"
if ! git commit -m "$MESSAGE"; then
  echo "No changes to commit. Nothing to deploy."
  exit 0
fi

echo "Pushing to origin/develop..."
git push origin develop

echo "✅ Deploy to 'develop' complete."
