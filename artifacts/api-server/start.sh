#!/bin/bash
set -e
echo "Running database seed (skipped if already seeded)..."
pnpm --filter @workspace/scripts run seed 2>&1 || echo "Seed step skipped."
echo "Starting API server..."
exec node artifacts/api-server/dist/index.cjs
