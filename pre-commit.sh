#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Running pre-commit checks..."

echo "-> Running lint checks..."
bun run lint

echo "-> Running TypeScript build checks..."
bun run build

echo "-> Running formatting checks..."
bun run format

echo "All pre-commit checks passed! Proceeding with commit."
