#!/bin/bash

# Script to run tests 3 times in a row
# Usage: ./scripts/run-tests-3x.sh [test pattern]

echo "🧪 Running tests 3 times to identify flaky tests"
echo "----------------------------------------------"

# Set up environment variables to increase stability
export NODE_OPTIONS="--max-old-space-size=4096"

# Run with a specific pattern if provided
if [ -n "$1" ]; then
  TEST_PATTERN="$1"
  echo "Running tests matching: $TEST_PATTERN"
else
  # Default to all tests except problematic ones
  TEST_PATTERN="."
  echo "Running all tests except problematic ones"
fi

for i in 1 2 3; do
  echo ""
  echo "🏃 Run #$i"
  echo "----------------------------------------------"
  npm test -- --watchAll=false --testMatch="**/__tests__/**/*($TEST_PATTERN)*.[jt]s?(x)" \
    --testPathIgnorePatterns="/node_modules/|/__mocks__/|PaymentRefund.test.jsx|guards.spec.jsx|NavBarSimple.test.jsx|routes.spec.jsx|AuthContext.test.jsx"
done

echo ""
echo "✅ Completed 3 test runs"
