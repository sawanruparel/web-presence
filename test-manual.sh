#!/bin/bash
#
# Quick Manual Testing Script
# Tests all three access modes
#

BASE_URL="http://localhost:8787"

echo "🧪 Manual Testing - Access Control"
echo "===================================="
echo ""

# Check if server is running
echo "🔍 Checking if API server is running..."
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
  echo "❌ API server is not running!"
  echo "   Start it with: cd api && npm run dev"
  exit 1
fi
echo "✅ API server is running"
echo ""

# Test 1: Open access
echo "1️⃣  OPEN ACCESS - physical-interfaces (notes)"
echo "   URL: POST $BASE_URL/auth/verify"
echo "   Body: {type: notes, slug: physical-interfaces}"
curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"type":"notes","slug":"physical-interfaces"}' \
  | jq '{success, accessMode, message}'
echo ""

# Test 2: Password - correct
echo "2️⃣  PASSWORD PROTECTED - local-first-ai (ideas)"
echo "   URL: POST $BASE_URL/auth/verify"
echo "   Body: {type: ideas, slug: local-first-ai, password: ai-secret-2024}"
echo "   ✅ CORRECT PASSWORD:"
curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"type":"ideas","slug":"local-first-ai","password":"ai-secret-2024"}' \
  | jq '{success, accessMode, message}'
echo ""

# Test 3: Password - wrong
echo "   ❌ WRONG PASSWORD:"
curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"type":"ideas","slug":"local-first-ai","password":"wrong-password"}' \
  | jq '{success, message}'
echo ""

# Test 4: Email - allowed
echo "3️⃣  EMAIL-LIST PROTECTED - sample-protected-idea (ideas)"
echo "   URL: POST $BASE_URL/auth/verify"
echo "   Body: {type: ideas, slug: sample-protected-idea, email: admin@example.com}"
echo "   ✅ ALLOWED EMAIL (admin@example.com):"
curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"type":"ideas","slug":"sample-protected-idea","email":"admin@example.com"}' \
  | jq '{success, accessMode, message}'
echo ""

# Test 5: Email - not allowed
echo "   ❌ NOT ALLOWED EMAIL (notallowed@example.com):"
curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"type":"ideas","slug":"sample-protected-idea","email":"notallowed@example.com"}' \
  | jq '{success, message}'
echo ""

# Test 6: Email-list - decisionrecord-io
echo "4️⃣  EMAIL-LIST PROTECTED - decisionrecord-io (publications)"
echo "   URL: POST $BASE_URL/auth/verify"
echo "   Body: {type: publications, slug: decisionrecord-io, email: subscriber@example.com}"
echo "   ✅ ALLOWED EMAIL (subscriber@example.com):"
curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"type":"publications","slug":"decisionrecord-io","email":"subscriber@example.com"}' \
  | jq '{success, accessMode, message}'
echo ""

# Summary
echo "===================================="
echo "✅ Manual testing complete!"
echo ""
echo "📋 Summary of test credentials:"
echo ""
echo "PASSWORD PROTECTED:"
echo "  • local-first-ai: password = 'bright-eagle-4821'"
echo ""
echo "EMAIL-LIST PROTECTED:"
echo "  • sample-protected-idea:"
echo "    - admin@example.com ✓"
echo "    - team@example.com ✓"
echo "    - reviewer@example.com ✓"
echo ""
echo "  • decisionrecord-io:"
echo "    - subscriber@example.com ✓"
echo "    - admin@example.com ✓"
echo ""
echo "OPEN ACCESS:"
echo "  • physical-interfaces (notes)"
echo "  • extending-carplay (ideas)"
echo "  • about, contact (pages)"
echo ""
