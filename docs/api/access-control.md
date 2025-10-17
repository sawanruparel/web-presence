# Access Control System

A comprehensive three-tier access control system for content protection with password, email-list, and open access modes.

## Overview

The access control system provides flexible content protection with three distinct access modes:

| Mode | Description | Use Case | User Experience |
|------|-------------|----------|-----------------|
| **🔓 Open** | Public content | Blog posts, public pages | Direct access, no modal |
| **🔐 Password** | Password protected | Subscriber content, paywalled articles | User enters password, gets token |
| **📧 Email-List** | Team/group content | Beta testers, reviewers, team docs | User enters email, checked against allowlist |

## Quick Start

### 1. Define Access Rules

Edit `api/config/access-control.json`:

```json
{
  "contentAccessRules": {
    "notes": {
      "my-article": {
        "mode": "password",
        "description": "My password-protected article"
      }
    },
    "publications": {
      "team-document": {
        "mode": "email-list",
        "description": "Restricted to team members",
        "allowedEmails": ["alice@company.com", "bob@company.com"]
      }
    },
    "ideas": {},
    "pages": {}
  }
}
```

### 2. Deploy Backend

```bash
cd api
npm run deploy
```

### 3. Use Frontend Component

```tsx
import { AccessModal } from './components/access-modal'

function MyContent() {
  const [accessMode, setAccessMode] = useState('open')
  
  return (
    <AccessModal
      isOpen={shouldShow}
      accessMode={accessMode}
      onSubmit={handleVerify}
      title="My Article"
    />
  )
}
```

## API Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/auth/access/:type/:slug` | GET | Check what access is required | No |
| `/auth/verify` | POST | Verify access and get token | No |
| `/auth/content/:type/:slug` | GET | Get protected content (needs token) | Yes (Bearer token) |
| `/auth/password/:type/:slug` | GET | Get password (development only) | No |

## Configuration Examples

### Personal Blog
```json
{
  "ideas": {"article": {"mode": "open"}},
  "notes": {"private": {"mode": "password"}}
}
```

### Team Documentation
```json
{
  "pages": {"handbook": {
    "mode": "email-list",
    "allowedEmails": ["team@company.com"]
  }}
}
```

### Academic Content
```json
{
  "notes": {
    "lecture": {
      "mode": "email-list",
      "allowedEmails": ["student1@uni.edu", "student2@uni.edu"]
    }
  }
}
```

## Frontend Integration

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

## Testing with cURL

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

## Architecture

### Service Flow

```
User accesses content
    ↓
Frontend calls /auth/access/:type/:slug
    ↓
Check access mode (open/password/email-list)
    ├─ Open → Load content directly
    ├─ Password → Show password modal
    └─ Email-list → Show email modal
    ↓
User submits credentials
    ↓
Frontend calls POST /auth/verify with credentials
    ↓
accessControlService validates:
  - Password mode: Hash password and compare
  - Email mode: Check if email in allowlist
  - Open mode: Return token immediately
    ↓
Return JWT token (expires in 24 hours)
    ↓
Frontend stores token and calls /auth/content/:type/:slug
    ↓
authMiddleware validates token
    ↓
Return full protected content
```

### Service Methods

```typescript
accessControlService.getAccessRule(type, slug)
  → Returns the AccessControlRule or null

accessControlService.isPubliclyAccessible(type, slug)
  → Returns true if mode is 'open'

accessControlService.verifyPassword(password, type, slug)
  → Returns true if password matches generated hash

accessControlService.verifyEmail(email, type, slug)
  → Returns true if email is in allowlist (case-insensitive)

accessControlService.getAccessMode(type, slug)
  → Returns 'open' | 'password' | 'email-list'

accessControlService.generateToken(payload)
  → Returns Base64-encoded JWT token (24h expiry)
```

## Security Features

✅ **Implemented:**
- Access control rules centrally defined in config
- Per-content password generation with hash function
- Email whitelist support with case-insensitive matching
- Token-based access to protected content
- 24-hour token expiration

⚠️ **Current Limitations (For Future Enhancement):**
- Passwords are deterministic (not salted)
- Tokens are Base64 encoded, not cryptographically signed
- No rate limiting on verification attempts
- No audit logging of access attempts
- No email verification for email-list mode

## Token Structure

### Token Payload
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

## Common Tasks

### Add a New Password-Protected Article
1. Create article in `content/notes/my-article.md`
2. Add to config:
```json
"my-article": {"mode": "password", "description": "..."}
```
3. Get password from `/auth/password/notes/my-article`
4. Share password with users

### Create Email-Restricted Content
1. Create content file
2. Add to config with email list:
```json
"team-doc": {
  "mode": "email-list",
  "allowedEmails": ["alice@company.com", "bob@company.com"]
}
```
3. Users access with their email

### Make Content Public
1. Create content file
2. Add to config:
```json
"public-article": {"mode": "open"}
```
3. No authentication needed

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API not responding | Check if backend is deployed with `npm run dev` or `npm run deploy` |
| Modal not showing | Verify `/auth/access/:type/:slug` returns correct access mode |
| Token invalid | Check token isn't expired (24 hours) or corrupted |
| Email not authorized | Verify email case matches allowlist exactly |
| Password incorrect | Use `/auth/password/:type/:slug` to verify correct password |

## Files Overview

### Backend Services
- **`api/config/access-control.json`** - Configuration defining access for each content item
- **`api/src/services/access-control-service.ts`** - Core service with validation logic
- **`api/src/routes/protected-content.ts`** - API endpoints for access control

### Frontend
- **`web/src/components/access-modal.tsx`** - React modal supporting all access modes

### Types
- **`types/api.ts`** - Shared TypeScript interfaces

## Next Steps

1. **Configure your content** - Edit `api/config/access-control.json`
2. **Test the API** - Use curl examples above
3. **Integrate frontend** - Update React components to use `AccessModal`
4. **Deploy** - Push changes to production
5. **Monitor** - Watch for any access issues

## Tips

- Use email groups/distribution lists for large teams
- Keep descriptions clear and informative
- Document why each content has its access level
- Review access rules periodically
- Test thoroughly before deploying to production
- Consider creating a management dashboard for access rules (future enhancement)

---

**Status**: ✅ Implementation Complete and Ready to Use  
**TypeScript**: ✅ All types checked  
**Tests**: ✅ Configuration valid  
**Documentation**: ✅ Comprehensive  
**Ready to Deploy**: ✅ Yes
