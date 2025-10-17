# Manual Testing Guide

## 🧪 Manual Testing URLs and Credentials

### Prerequisites
Make sure the API server is running:
```bash
cd /workspaces/web-presence/api
npm run dev
```

Server should be available at: `http://localhost:8787`

---

## 📋 Test Content Available

Based on current database, here are the test cases:

### 1️⃣ **Open Access (No Protection)**
These should work without any credentials:

**Notes:**
- `physical-interfaces` - Open access

**Ideas:**
- `extending-carplay` - Open access

**Pages:**
- `about` - Open access
- `contact` - Open access

---

### 2️⃣ **Password Protected**

#### Test Case 1: `local-first-ai` (Ideas)
- **Type:** `ideas`
- **Slug:** `local-first-ai`
- **Password:** `ai-secret-2024`

#### Test Case 2: `test-password` (Ideas - from tests)
- **Type:** `ideas`
- **Slug:** `test-password`
- **Password:** `secret123`

---

### 3️⃣ **Email-List Protected**

#### Test Case 1: `sample-protected-idea` (Ideas)
- **Type:** `ideas`
- **Slug:** `sample-protected-idea`
- **Allowed Emails:**
  - `admin@example.com`
  - `team@example.com`
  - `reviewer@example.com`

#### Test Case 2: `decisionrecord-io` (Publications)
- **Type:** `publications`
- **Slug:** `decisionrecord-io`
- **Allowed Emails:**
  - `subscriber@example.com`
  - `admin@example.com`

#### Test Case 3: `test-email` (Publications - from tests)
- **Type:** `publications`
- **Slug:** `test-email`
- **Allowed Emails:**
  - `allowed@example.com`
  - `admin@example.com`
  - `user3@example.com`

---

## 🔧 API Endpoints for Testing

### Check Access Requirements
```bash
# Check what access mode a content item has
curl http://localhost:8787/auth/access/ideas/local-first-ai
```

**Response:**
```json
{
  "accessMode": "password",
  "requiresPassword": true,
  "requiresEmail": false,
  "message": "Password-protected AI idea"
}
```

---

### Verify Access (Open)
```bash
curl -X POST http://localhost:8787/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "type": "notes",
    "slug": "physical-interfaces"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJ0eXBl...",
  "accessMode": "open"
}
```

---

### Verify Access (Password)
```bash
# Correct password
curl -X POST http://localhost:8787/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ideas",
    "slug": "local-first-ai",
    "password": "ai-secret-2024"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "token": "eyJ0eXBl...",
  "accessMode": "password"
}
```

**Expected Response (Wrong Password):**
```json
{
  "success": false,
  "message": "Invalid password for ideas/local-first-ai"
}
```

---

### Verify Access (Email-List)
```bash
# Allowed email
curl -X POST http://localhost:8787/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ideas",
    "slug": "sample-protected-idea",
    "email": "admin@example.com"
  }'
```

**Expected Response (Allowed):**
```json
{
  "success": true,
  "token": "eyJ0eXBl...",
  "accessMode": "email-list"
}
```

**Expected Response (Not Allowed):**
```json
{
  "success": false,
  "message": "Your email is not authorized to access this content"
}
```

---

## 🧪 Quick Test Script

Run this to test all scenarios:

```bash
#!/bin/bash
BASE_URL="http://localhost:8787"

echo "🧪 Manual Testing Guide"
echo "======================="
echo ""

# Test 1: Open access
echo "1️⃣ Testing OPEN access (physical-interfaces)..."
curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"type":"notes","slug":"physical-interfaces"}' \
  | jq '{success, accessMode}'
echo ""

# Test 2: Password - correct
echo "2️⃣ Testing PASSWORD access - CORRECT (local-first-ai)..."
curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"type":"ideas","slug":"local-first-ai","password":"ai-secret-2024"}' \
  | jq '{success, accessMode, message}'
echo ""

# Test 3: Password - wrong
echo "3️⃣ Testing PASSWORD access - WRONG (local-first-ai)..."
curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"type":"ideas","slug":"local-first-ai","password":"wrong-password"}' \
  | jq '{success, message}'
echo ""

# Test 4: Email - allowed
echo "4️⃣ Testing EMAIL-LIST access - ALLOWED (sample-protected-idea)..."
curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"type":"ideas","slug":"sample-protected-idea","email":"admin@example.com"}' \
  | jq '{success, accessMode, message}'
echo ""

# Test 5: Email - not allowed
echo "5️⃣ Testing EMAIL-LIST access - NOT ALLOWED (sample-protected-idea)..."
curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"type":"ideas","slug":"sample-protected-idea","email":"notallowed@example.com"}' \
  | jq '{success, message}'
echo ""

echo "✅ Manual testing complete!"
```

Save this as `test-manual.sh` and run:
```bash
chmod +x test-manual.sh
./test-manual.sh
```

---

## 📊 View Access Logs

See who accessed what:
```bash
# Get recent access logs (requires API key)
curl -s http://localhost:8787/api/internal/logs?limit=20 \
  -H "X-API-Key: d458ab3fede5cfefb6f33b8aa21cc93988052c020e59075b8bdc6d95b9847246" \
  | jq '.logs[] | {type, slug, access_granted, credential_type, timestamp}'
```

---

## 🎯 Summary Table

| Content Type | Slug | Access Mode | Credential |
|-------------|------|-------------|------------|
| notes | physical-interfaces | ✅ open | None |
| ideas | extending-carplay | ✅ open | None |
| ideas | local-first-ai | 🔒 password | `ai-secret-2024` |
| ideas | sample-protected-idea | 📧 email-list | `admin@example.com`, `team@example.com`, `reviewer@example.com` |
| publications | decisionrecord-io | 📧 email-list | `subscriber@example.com`, `admin@example.com` |
| pages | about | ✅ open | None |
| pages | contact | ✅ open | None |

---

## 🔍 Check All Access Rules

To see all rules in the database:
```bash
curl -s http://localhost:8787/api/content-catalog \
  -H "X-API-Key: d458ab3fede5cfefb6f33b8aa21cc93988052c020e59075b8bdc6d95b9847246" \
  | jq '.rules[] | {type, slug, accessMode, requiresPassword, requiresEmail, allowedEmails}'
```

---

## ⚠️ Troubleshooting

If you get no response:
1. Check if API server is running: `curl http://localhost:8787/health`
2. Check logs: `tail -f /tmp/wrangler.log`
3. Restart server: `cd /workspaces/web-presence/api && npm run dev`

If authentication fails:
1. Verify credentials in this guide
2. Check database: Run seed script again if needed
3. View access logs to see what went wrong
