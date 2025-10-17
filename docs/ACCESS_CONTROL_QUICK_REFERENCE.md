# Access Control Quick Reference

## 🎯 Three Access Modes

### 1. Open (Default)
```json
{
  "my-article": {
    "mode": "open",
    "description": "Publicly accessible"
  }
}
```
- No authentication needed
- Content loads immediately
- No modal shown to user

### 2. Password
```json
{
  "secret-notes": {
    "mode": "password",
    "description": "Password protected"
  }
}
```
- User enters password
- Password: `{type}-{slug}-{hash}`
- Example: `notes-secret-notes-a1b2c3`
- Token valid for 24 hours

### 3. Email List
```json
{
  "restricted-content": {
    "mode": "email-list",
    "description": "Only for approved emails",
    "allowedEmails": ["admin@example.com", "user@example.com"]
  }
}
```
- User enters email address
- Email checked against allowlist
- Case-insensitive matching
- Token valid for 24 hours

## 📝 Configuration

**File**: `api/config/access-control.json`

```json
{
  "contentAccessRules": {
    "notes": {
      "slug-name": {
        "mode": "open|password|email-list",
        "description": "Human readable description",
        "allowedEmails": ["email@example.com"] // Only for email-list
      }
    },
    "publications": {},
    "ideas": {},
    "pages": {}
  }
}
```

## 🔌 API Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/auth/access/:type/:slug` | GET | Check access requirements | No |
| `/auth/verify` | POST | Verify and get token | No |
| `/auth/content/:type/:slug` | GET | Get protected content | Yes (Bearer token) |
| `/auth/password/:type/:slug` | GET | Get password (dev only) | No |

## 📱 Frontend Integration

### Step 1: Check Access
```typescript
const response = await fetch('/auth/access/notes/my-article')
const { accessMode } = await response.json()
```

### Step 2: Show Modal (if needed)
```tsx
if (accessMode !== 'open') {
  return <AccessModal 
    accessMode={accessMode}
    onSubmit={handleSubmit}
  />
}
```

### Step 3: Verify & Get Token
```typescript
const response = await fetch('/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'notes',
    slug: 'my-article',
    password: userPassword,    // for password mode
    email: userEmail           // for email-list mode
  })
})
const { token } = await response.json()
```

### Step 4: Fetch Content
```typescript
const response = await fetch('/auth/content/notes/my-article', {
  headers: { Authorization: `Bearer ${token}` }
})
const content = await response.json()
```

## 🧪 Testing with cURL

### Check Access
```bash
curl http://localhost:8787/auth/access/notes/my-article
```

### Password Access
```bash
PASSWORD=$(curl -s http://localhost:8787/auth/password/notes/my-article | jq -r '.password')

curl -X POST http://localhost:8787/auth/verify \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"notes\",\"slug\":\"my-article\",\"password\":\"$PASSWORD\"}"
```

### Email Access
```bash
TOKEN=$(curl -s -X POST http://localhost:8787/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"type":"publications","slug":"paper","email":"admin@example.com"}' | jq -r '.token')

curl http://localhost:8787/auth/content/publications/paper \
  -H "Authorization: Bearer $TOKEN"
```

## 🔐 Security Notes

- ✅ Passwords are unique per content item
- ✅ Email allowlists prevent unauthorized access
- ✅ Tokens expire after 24 hours
- ⚠️ Passwords are deterministic (not salted)
- ⚠️ No rate limiting (can be brute forced)
- ⚠️ No audit logging

## 🚀 Workflow Examples

### User accessing open content
```
User clicks → Content loads immediately
```

### User accessing password-protected content
```
User clicks → Modal appears (password input)
            → User enters password
            → POST /auth/verify
            → Token returned
            → GET /auth/content (with token)
            → Content loads
```

### User accessing email-restricted content
```
User clicks → Modal appears (email input)
            → User enters email
            → POST /auth/verify
            → Email checked against allowlist
            → Token returned (if authorized)
            → GET /auth/content (with token)
            → Content loads
```

## 📦 Files Overview

| File | Purpose |
|------|---------|
| `api/config/access-control.json` | Configuration of access rules |
| `api/src/services/access-control-service.ts` | Core access control logic |
| `api/src/routes/protected-content.ts` | API endpoints |
| `types/api.ts` | TypeScript interfaces |
| `web/src/components/access-modal.tsx` | Frontend modal component |
| `docs/access-control-system.md` | Full documentation |

## 🔄 Token Structure

```json
{
  "type": "notes",
  "slug": "my-article",
  "email": "user@example.com",  // Only for email-list mode
  "verifiedAt": "2025-10-16T10:30:00.000Z",
  "iat": 1728989400,
  "exp": 1729075800
}
```

Encoded as Base64. Valid for 24 hours from issue time.

## ❓ Common Questions

**Q: How do I update access rules?**
A: Edit `api/config/access-control.json` and redeploy the API.

**Q: Can users change their password?**
A: Not currently - passwords are auto-generated from type and slug.

**Q: What if I add a new email to the allowlist?**
A: Any users who had tokens before the update must re-authenticate.

**Q: How long are tokens valid?**
A: 24 hours from creation. Users must re-authenticate after that.

**Q: Can I mix access modes for the same content?**
A: No - each content item has exactly one access mode.

**Q: How do I know who accessed what?**
A: Currently no audit logging - this is a future enhancement.

## 🛠️ Development

### Type checking
```bash
cd api && npm run type-check
```

### Run backend
```bash
cd api && npm run dev
```

### Build for production
```bash
cd api && npm run deploy
```

## 📚 Learn More

- Full documentation: `docs/access-control-system.md`
- Implementation summary: `IMPLEMENTATION_SUMMARY.md`
- Test examples: `scripts/test-access-control.js`
