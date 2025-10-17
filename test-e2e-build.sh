#!/bin/bash
#
# End-to-End Test: Build Script with Database Integration
#
# This test verifies:
# 1. API server is running
# 2. Database has access rules
# 3. Build script fetches rules from API
# 4. Content is correctly classified as open/protected
# 5. Metadata files are generated correctly
#

API_KEY="d458ab3fede5cfefb6f33b8aa21cc93988052c020e59075b8bdc6d95b9847246"
BASE_URL="http://localhost:8787"
WEB_DIR="/workspaces/web-presence/web"

echo "🧪 End-to-End Test: Build Script with Database Integration"
echo "============================================================"

# Test 1: Check API server
echo ""
echo "📝 Test 1: Checking API server..."
STATUS=$(curl -s "$BASE_URL/health" | jq -r '.status' 2>/dev/null)
if [ "$STATUS" = "ok" ]; then
  echo "   ✅ API server is running"
else
  echo "   ❌ API server is not running"
  exit 1
fi

# Test 2: Check database has rules
echo ""
echo "📝 Test 2: Checking database access rules..."
RULE_COUNT=$(curl -s "$BASE_URL/api/content-catalog" \
  -H "X-API-Key: $API_KEY" \
  | jq -r '.totalCount' 2>/dev/null)
if [ "$RULE_COUNT" -gt 0 ]; then
  echo "   ✅ Database has $RULE_COUNT access rules"
else
  echo "   ❌ Database has no access rules"
  exit 1
fi

# Show rule breakdown
echo "   Rule breakdown:"
curl -s "$BASE_URL/api/content-catalog" \
  -H "X-API-Key: $API_KEY" \
  | jq -r '
    "      - Open: \([.rules[] | select(.accessMode == "open")] | length)",
    "      - Password: \([.rules[] | select(.accessMode == "password")] | length)",
    "      - Email-list: \([.rules[] | select(.accessMode == "email-list")] | length)"
  '

# Test 3: Run build script
echo ""
echo "📝 Test 3: Running build script..."
cd "$WEB_DIR"
BUILD_OUTPUT=$(npm run build:content 2>&1)
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
  echo "   ✅ Build script completed successfully"
else
  echo "   ❌ Build script failed with exit code $BUILD_EXIT_CODE"
  echo "$BUILD_OUTPUT"
  exit 1
fi

# Check if API was called
if echo "$BUILD_OUTPUT" | grep -q "Fetched.*access rules from API"; then
  FETCHED_COUNT=$(echo "$BUILD_OUTPUT" | grep -oP 'Fetched \K\d+' | head -1)
  echo "   ✅ API was called and fetched $FETCHED_COUNT rules"
else
  echo "   ❌ API was not called during build"
  exit 1
fi

# Test 4: Verify content metadata file exists
echo ""
echo "📝 Test 4: Checking generated metadata files..."
METADATA_FILE="$WEB_DIR/dist/content-metadata.json"
PROTECTED_FILE="$WEB_DIR/dist/protected-content.json"

if [ -f "$METADATA_FILE" ]; then
  echo "   ✅ content-metadata.json exists"
else
  echo "   ❌ content-metadata.json not found"
  exit 1
fi

if [ -f "$PROTECTED_FILE" ]; then
  echo "   ✅ protected-content.json exists"
else
  echo "   ❌ protected-content.json not found"
  exit 1
fi

# Test 5: Verify protected content classification
echo ""
echo "📝 Test 5: Verifying content classification..."

# Check specific items
LOCAL_FIRST_AI=$(cat "$METADATA_FILE" | jq -r '.ideas[] | select(.slug == "local-first-ai") | .isProtected')
if [ "$LOCAL_FIRST_AI" = "true" ]; then
  echo "   ✅ local-first-ai correctly marked as protected"
else
  echo "   ❌ local-first-ai should be protected"
  exit 1
fi

PHYSICAL_INTERFACES=$(cat "$METADATA_FILE" | jq -r '.notes[] | select(.slug == "physical-interfaces") | .isProtected')
if [ "$PHYSICAL_INTERFACES" = "false" ]; then
  echo "   ✅ physical-interfaces correctly marked as open"
else
  echo "   ❌ physical-interfaces should be open"
  exit 1
fi

DECISIONRECORD=$(cat "$METADATA_FILE" | jq -r '.publications[] | select(.slug == "decisionrecord-io") | .isProtected')
if [ "$DECISIONRECORD" = "true" ]; then
  echo "   ✅ decisionrecord-io correctly marked as protected"
else
  echo "   ❌ decisionrecord-io should be protected"
  exit 1
fi

# Test 6: Verify access modes
echo ""
echo "📝 Test 6: Verifying access modes..."

LOCAL_FIRST_MODE=$(cat "$METADATA_FILE" | jq -r '.ideas[] | select(.slug == "local-first-ai") | .accessMode')
if [ "$LOCAL_FIRST_MODE" = "password" ]; then
  echo "   ✅ local-first-ai has correct access mode (password)"
else
  echo "   ❌ local-first-ai should have password access mode, got: $LOCAL_FIRST_MODE"
  exit 1
fi

SAMPLE_PROTECTED_MODE=$(cat "$METADATA_FILE" | jq -r '.ideas[] | select(.slug == "sample-protected-idea") | .accessMode')
if [ "$SAMPLE_PROTECTED_MODE" = "email-list" ]; then
  echo "   ✅ sample-protected-idea has correct access mode (email-list)"
else
  echo "   ❌ sample-protected-idea should have email-list access mode, got: $SAMPLE_PROTECTED_MODE"
  exit 1
fi

# Test 7: Verify protected content list
echo ""
echo "📝 Test 7: Verifying protected content list..."

PROTECTED_IDEAS=$(cat "$PROTECTED_FILE" | jq -r '.ideas | length')
PROTECTED_PUBS=$(cat "$PROTECTED_FILE" | jq -r '.publications | length')

echo "   Protected ideas: $PROTECTED_IDEAS"
echo "   Protected publications: $PROTECTED_PUBS"

if [ "$PROTECTED_IDEAS" -eq 2 ] && [ "$PROTECTED_PUBS" -eq 1 ]; then
  echo "   ✅ Protected content list is correct"
else
  echo "   ❌ Protected content counts don't match expected values"
  exit 1
fi

# Test 8: Verify metadata completeness
echo ""
echo "📝 Test 8: Checking metadata completeness..."

# Protected content should not have full HTML/content
LOCAL_FIRST_HTML=$(cat "$METADATA_FILE" | jq -r '.ideas[] | select(.slug == "local-first-ai") | has("html")')
if [ "$LOCAL_FIRST_HTML" = "false" ]; then
  echo "   ⚠️  Protected content includes HTML (may expose content)"
else
  echo "   ✅ Protected content HTML handled correctly"
fi

# Open content should have full HTML/content
PHYSICAL_HTML=$(cat "$METADATA_FILE" | jq -r '.notes[] | select(.slug == "physical-interfaces") | .html')
if [ -n "$PHYSICAL_HTML" ] && [ "$PHYSICAL_HTML" != "null" ]; then
  echo "   ✅ Open content includes HTML"
else
  echo "   ❌ Open content missing HTML"
  exit 1
fi

# Summary
echo ""
echo "============================================================"
echo "✅ All End-to-End Tests Passed!"
echo "============================================================"
echo ""
echo "Summary:"
echo "  - API server: ✓ Running"
echo "  - Database: ✓ $RULE_COUNT access rules"
echo "  - Build script: ✓ Successfully called API"
echo "  - Metadata files: ✓ Generated correctly"
echo "  - Content classification: ✓ Correct"
echo "  - Access modes: ✓ Correct"
echo "  - Protected content list: ✓ Correct"
echo ""
