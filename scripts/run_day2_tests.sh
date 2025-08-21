#!/usr/bin/env bash
# Day 2 Test Suite Runner
# This script runs all the Day 2 verification tests in sequence

# Fail on errors, undefined variables, and propagate pipe failures
set -euo pipefail

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration - use env vars with defaults
API_URL="${STAGING_API_URL:-https://staging-api.example.com}"
FRONTEND_URL="${STAGING_FE_URL:-https://staging.assetanchor.io}"
ADMIN_TOKEN="${ADMIN_BEARER_TOKEN:-your_admin_token_here}"
WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-your_stripe_webhook_secret_here}"
REDIS_URL="${REDIS_URL_STAGING:-}"
SENTRY_DSN="${SENTRY_DSN_STAGING:-}"

# CI failure flags
FAIL_ON_PAYMENTS="${FAIL_ON_PAYMENTS:-false}"
FAIL_ON_MULTITENANCY="${FAIL_ON_MULTITENANCY:-false}"
FAIL_ON_RATELIMIT="${FAIL_ON_RATELIMIT:-false}"

# Track test results
RL_FAIL=0
PAY_FAIL=0
MT_FAIL=0
CSP_FAIL=0
SENTRY_FAIL=0

# Create output directory for test results
OUTPUT_DIR="day2-results"
mkdir -p "$OUTPUT_DIR"

echo -e "\n${BOLD}${PURPLE}======================================${NC}"
echo -e "${BOLD}${PURPLE}  Day 2 Staging Verification Suite  ${NC}"
echo -e "${BOLD}${PURPLE}======================================${NC}\n"

echo -e "${BOLD}Test results will be saved to:${NC} $OUTPUT_DIR\n"
echo -e "${BOLD}Target URLs:${NC}"
echo -e "  API: $API_URL"
echo -e "  Frontend: $FRONTEND_URL\n"

# Function to run a test with header
run_test() {
    local title="$1"
    local command="$2"
    local output_file="$3"
    local is_critical="${4:-false}"
    local fail_var_name="$5"
    
    echo -e "\n${BOLD}${BLUE}>>> $title${NC}"
    echo -e "${YELLOW}$command${NC}\n"
    
    # Run the command and capture output
    if eval "$command" > "$OUTPUT_DIR/$output_file" 2>&1; then
        echo -e "${GREEN}✓ Test completed successfully${NC}"
        return 0
    else
        local exit_code=$?
        echo -e "${RED}✗ Test failed with exit code $exit_code${NC}"
        
        if [[ "$is_critical" == "true" ]]; then
            # Set the fail variable passed by name
            eval "$fail_var_name=1"
            echo -e "${RED}⚠️ This is a critical test and may cause the workflow to fail${NC}"
        fi
        
        return $exit_code
    fi
}

echo -e "[1/5] ${BOLD}Rate limit check${NC}"
run_test "Testing Rate Limiting" \
    "python3 scripts/test_rate_limit.py $API_URL/api/auth/login 20" \
    "rate_limit_test.log" \
    "$FAIL_ON_RATELIMIT" \
    "RL_FAIL"

echo -e "\n[2/5] ${BOLD}Stripe webhook signature/idempotency${NC}"
if [ "$WEBHOOK_SECRET" != "your_stripe_webhook_secret_here" ]; then
    run_test "Testing Stripe Webhooks" \
        "python3 scripts/test_stripe_webhook.py $API_URL/api/webhooks/stripe $WEBHOOK_SECRET" \
        "webhook_test.log" \
        "$FAIL_ON_PAYMENTS" \
        "PAY_FAIL"
else
    echo -e "${YELLOW}⚠️ Skipping Stripe webhook tests - no webhook secret provided${NC}"
    echo -e "Set STRIPE_WEBHOOK_SECRET env var to enable this test"
    if [[ "$FAIL_ON_PAYMENTS" == "true" ]]; then
        PAY_FAIL=1
        echo -e "${RED}⚠️ FAIL_ON_PAYMENTS is true but test was skipped - marking as failed${NC}"
    fi
fi

echo -e "\n[3/5] ${BOLD}CSP analysis${NC}"
run_test "Analyzing Content Security Policy" \
    "python3 scripts/analyze_csp.py $FRONTEND_URL" \
    "csp_analysis.log" \
    "false" \
    "CSP_FAIL" || true  # Non-critical, continue even if fails

echo -e "\n[4/5] ${BOLD}Multi-tenancy isolation${NC}"
if [ "$ADMIN_TOKEN" != "your_admin_token_here" ]; then
    run_test "Testing Multi-tenancy Isolation" \
        "python3 scripts/test_multi_tenancy.py $API_URL $ADMIN_TOKEN" \
        "multi_tenancy_test.log" \
        "$FAIL_ON_MULTITENANCY" \
        "MT_FAIL"
else
    echo -e "${YELLOW}⚠️ Skipping multi-tenancy tests - no admin token provided${NC}"
    echo -e "Set ADMIN_BEARER_TOKEN env var to enable this test"
    if [[ "$FAIL_ON_MULTITENANCY" == "true" ]]; then
        MT_FAIL=1
        echo -e "${RED}⚠️ FAIL_ON_MULTITENANCY is true but test was skipped - marking as failed${NC}"
    fi
fi

echo -e "\n[5/5] ${BOLD}Sentry smoke (non-blocking)${NC}"
run_test "Testing Sentry Integration" \
    "python3 scripts/test_sentry.py $API_URL $FRONTEND_URL" \
    "sentry_test.log" \
    "false" \
    "SENTRY_FAIL" || true  # Non-critical, continue even if fails

# Create a summary report
echo -e "\n${BOLD}${GREEN}Creating summary report...${NC}"
cat > "$OUTPUT_DIR/summary.md" << EOF
# Day 2 Testing Summary

Date: $(date)

## Test Results

1. **Rate Limiting**: $([[ "$RL_FAIL" -eq 0 ]] && echo "✅ PASS" || echo "❌ FAIL") - [View Results](rate_limit_test.log)
2. **Stripe Webhooks**: $([[ "$PAY_FAIL" -eq 0 ]] && echo "✅ PASS" || echo "❌ FAIL") - $([[ "$WEBHOOK_SECRET" != "your_stripe_webhook_secret_here" ]] && echo "[View Results](webhook_test.log)" || echo "Not tested - missing webhook secret")
3. **CSP Analysis**: $([[ "$CSP_FAIL" -eq 0 ]] && echo "✅ PASS" || echo "⚠️ Warnings") - [View Results](csp_analysis.log)
4. **Multi-tenancy**: $([[ "$MT_FAIL" -eq 0 ]] && echo "✅ PASS" || echo "❌ FAIL") - $([[ "$ADMIN_TOKEN" != "your_admin_token_here" ]] && echo "[View Results](multi_tenancy_test.log)" || echo "Not tested - missing admin token")
5. **Sentry Integration**: $([[ "$SENTRY_FAIL" -eq 0 ]] && echo "✅ PASS" || echo "⚠️ Warnings") - [View Results](sentry_test.log)

## Critical Test Status

- Rate Limiting: $([[ "$RL_FAIL" -eq 0 ]] && echo "✅ PASS" || echo "❌ FAIL") - Enforce in CI: $FAIL_ON_RATELIMIT
- Payment Webhooks: $([[ "$PAY_FAIL" -eq 0 ]] && echo "✅ PASS" || echo "❌ FAIL") - Enforce in CI: $FAIL_ON_PAYMENTS
- Multi-tenancy: $([[ "$MT_FAIL" -eq 0 ]] && echo "✅ PASS" || echo "❌ FAIL") - Enforce in CI: $FAIL_ON_MULTITENANCY

## Next Steps

1. Check the Sentry dashboard for captured errors
2. Review CSP violation reports
3. Complete the manual verification steps in the [Day 2 Testing Checklist](../test_plans/day2_testing_checklist.md)
4. Document all findings in the deliverable reports
EOF

# Determine exit status based on critical tests
STATUS=0

if [[ "$FAIL_ON_RATELIMIT" == "true" && "$RL_FAIL" -eq 1 ]]; then
    echo -e "${RED}⚠️ Rate limiting check failed and FAIL_ON_RATELIMIT is true${NC}"
    STATUS=1
fi

if [[ "$FAIL_ON_PAYMENTS" == "true" && "$PAY_FAIL" -eq 1 ]]; then
    echo -e "${RED}⚠️ Payment webhook check failed and FAIL_ON_PAYMENTS is true${NC}"
    STATUS=1
fi

if [[ "$FAIL_ON_MULTITENANCY" == "true" && "$MT_FAIL" -eq 1 ]]; then
    echo -e "${RED}⚠️ Multi-tenancy check failed and FAIL_ON_MULTITENANCY is true${NC}"
    STATUS=1
fi

echo -e "\n${BOLD}${PURPLE}======================================${NC}"
echo -e "${BOLD}${PURPLE}  Day 2 Testing Complete  ${NC}"
echo -e "${BOLD}${PURPLE}======================================${NC}\n"

if [[ "$STATUS" -eq 0 ]]; then
    echo -e "${GREEN}✅ All critical tests have passed.${NC}"
else
    echo -e "${RED}❌ One or more critical tests failed. See logs for details.${NC}"
fi

echo -e "Test results saved to: ${BOLD}$OUTPUT_DIR${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Check Sentry for errors captured during testing"
echo -e "2. Complete manual verification steps from the checklist"
echo -e "3. Document all findings in the deliverable reports\n"

# Exit with appropriate status for CI
exit $STATUS
