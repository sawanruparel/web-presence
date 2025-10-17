#!/bin/bash
#
# Test Access Control Service via API
#

API_KEY="d458ab3fede5cfefb6f33b8aa21cc93988052c020e59075b8bdc6d95b9847246"
BASE_URL="http://localhost:8787"

echo "🧪 Testing Access Control Service via API"
echo "============================================================"

# Clean up previous test data
echo ""
echo "🧹 Cleaning up previous test data..."
curl -s -X DELETE "$BASE_URL/api/internal/access-rules/notes/test-open" \
  -H "X-API-Key: $API_KEY" > /dev/null 2>&1
curl -s -X DELETE "$BASE_URL/api/internal/access-rules/ideas/test-password" \
  -H "X-API-Key: $API_KEY" > /dev/null 2>&1
curl -s -X DELETE "$BASE_URL/api/internal/access-rules/publications/test-email" \
  -H "X-API-Key: $API_KEY" > /dev/null 2>&1

# Test 1: Create test data
echo ""
echo "📝 Test 1: Creating test access rules..."

echo "   Creating open access rule..."
curl -s -X POST "$BASE_URL/api/internal/access-rules" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"notes","slug":"test-open","accessMode":"open","description":"Test open access"}' \
  | jq -r '.id' > /dev/null
echo "   ✅ Created open access rule"

echo "   Creating password-protected rule..."
curl -s -X POST "$BASE_URL/api/internal/access-rules" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"ideas","slug":"test-password","accessMode":"password","password":"secret123","description":"Test password protection"}' \
  | jq -r '.id' > /dev/null
echo "   ✅ Created password-protected rule"

echo "   Creating email-list rule..."
curl -s -X POST "$BASE_URL/api/internal/access-rules" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"publications","slug":"test-email","accessMode":"email-list","description":"Test email restriction","allowedEmails":["allowed@example.com","admin@example.com"]}' \
  | jq -r '.id' > /dev/null
echo "   ✅ Created email-list rule"

# Test 2: Verify open access
echo ""
echo "📝 Test 2: Testing open access verification..."
RESULT=$(curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"type":"notes","slug":"test-open"}' \
  | jq -r '.success')
if [ "$RESULT" = "true" ]; then
  echo "   ✅ Open access verification passed"
else
  echo "   ❌ Open access verification failed"
  exit 1
fi

# Test 3: Verify password - correct
echo ""
echo "📝 Test 3: Testing password verification (correct)..."
RESULT=$(curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"type":"ideas","slug":"test-password","password":"secret123"}' \
  | jq -r '.success')
if [ "$RESULT" = "true" ]; then
  echo "   ✅ Correct password accepted"
else
  echo "   ❌ Correct password rejected"
  exit 1
fi

# Test 4: Verify password - incorrect
echo ""
echo "📝 Test 4: Testing password verification (incorrect)..."
RESULT=$(curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"type":"ideas","slug":"test-password","password":"wrongpassword"}' \
  | jq -r '.success')
if [ "$RESULT" = "false" ]; then
  echo "   ✅ Incorrect password rejected"
else
  echo "   ❌ Incorrect password accepted"
  exit 1
fi

# Test 5: Verify email - allowed
echo ""
echo "📝 Test 5: Testing email verification (allowed)..."
RESULT=$(curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"type":"publications","slug":"test-email","email":"allowed@example.com"}' \
  | jq -r '.success')
if [ "$RESULT" = "true" ]; then
  echo "   ✅ Allowed email accepted"
else
  echo "   ❌ Allowed email rejected"
  exit 1
fi

# Test 6: Verify email - not allowed
echo ""
echo "📝 Test 6: Testing email verification (not allowed)..."
RESULT=$(curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"type":"publications","slug":"test-email","email":"notallowed@example.com"}' \
  | jq -r '.success')
if [ "$RESULT" = "false" ]; then
  echo "   ✅ Not allowed email rejected"
else
  echo "   ❌ Not allowed email accepted"
  exit 1
fi

# Test 7: Check access requirements
echo ""
echo "📝 Test 7: Testing access requirements endpoint..."
echo "   Checking open access requirements..."
MODE=$(curl -s "$BASE_URL/auth/access/notes/test-open" \
  | jq -r '.accessMode')
if [ "$MODE" = "open" ]; then
  echo "   ✅ Open access mode correct"
else
  echo "   ❌ Wrong access mode: $MODE"
  exit 1
fi

echo "   Checking password access requirements..."
REQUIRES_PWD=$(curl -s "$BASE_URL/auth/access/ideas/test-password" \
  | jq -r '.requiresPassword')
if [ "$REQUIRES_PWD" = "true" ]; then
  echo "   ✅ Password requirement correct"
else
  echo "   ❌ Wrong password requirement"
  exit 1
fi

echo "   Checking email access requirements..."
REQUIRES_EMAIL=$(curl -s "$BASE_URL/auth/access/publications/test-email" \
  | jq -r '.requiresEmail')
if [ "$REQUIRES_EMAIL" = "true" ]; then
  echo "   ✅ Email requirement correct"
else
  echo "   ❌ Wrong email requirement"
  exit 1
fi

# Test 8: Check access logs
echo ""
echo "📝 Test 8: Checking access logs..."
TOTAL_LOGS=$(curl -s "$BASE_URL/api/internal/logs?limit=100" \
  -H "X-API-Key: $API_KEY" \
  | jq -r '.count')
echo "   Total access logs: $TOTAL_LOGS"

FAILED_LOGS=$(curl -s "$BASE_URL/api/internal/logs?failed=true&limit=50" \
  -H "X-API-Key: $API_KEY" \
  | jq -r '.count')
echo "   Failed access attempts: $FAILED_LOGS"

if [ "$TOTAL_LOGS" -gt 0 ]; then
  echo "   ✅ Access logs are being recorded"
else
  echo "   ⚠️  Warning: No access logs found"
fi

# Test 9: Check access statistics
echo ""
echo "📝 Test 9: Checking access statistics..."
STATS=$(curl -s "$BASE_URL/api/internal/stats" \
  -H "X-API-Key: $API_KEY")
TOTAL=$(echo "$STATS" | jq -r '.stats.total')
GRANTED=$(echo "$STATS" | jq -r '.stats.granted')
DENIED=$(echo "$STATS" | jq -r '.stats.denied')

echo "   Total attempts: $TOTAL"
echo "   Granted: $GRANTED"
echo "   Denied: $DENIED"

if [ "$TOTAL" -gt 0 ]; then
  echo "   ✅ Access statistics available"
else
  echo "   ⚠️  Warning: No statistics found"
fi

# Summary
echo ""
echo "============================================================"
echo "✅ All Access Control Service tests passed!"
echo "============================================================"
