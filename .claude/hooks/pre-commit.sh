#!/bin/bash
# Pre-commit hook — runs before every Claude bash action
# Blocks execution if TypeScript or lint errors are found.

RED="\033[0;31m"
GREEN="\033[0;32m"
NC="\033[0m"

# Skip checks when the TypeScript toolchain isn't set up yet
# (no tsconfig or dependencies not installed) — otherwise every
# bash command is blocked during initial scaffolding.
if [ ! -f tsconfig.json ] || [ ! -d node_modules/typescript ]; then
  exit 0
fi

echo "Checking types..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo -e "${RED}Type errors found. Fix before committing.${NC}"
  exit 2
fi

STAGED=$(git diff --cached --name-only --diff-filter=d | grep -E "\.(ts|tsx)$")
if [ -n "$STAGED" ]; then
  echo "Linting staged files..."
  npx eslint $STAGED --quiet
  if [ $? -ne 0 ]; then
    echo -e "${RED}Lint errors. Run npm run lint to see details.${NC}"
    exit 2
  fi
fi

echo -e "${GREEN}All checks passed!${NC}"
exit 0
