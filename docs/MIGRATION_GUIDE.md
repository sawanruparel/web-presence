# Migration Guide: Old to New Access Control System

## Overview

This guide helps you migrate from the old password-only system to the new three-tier access control system.

## What Changed

### Old System
- Only password-protected content
- All protected content required a password
- No way to make content public from backend
- Fixed password verification flow

### New System
- Three access modes: open, password, email-list
- Flexible per-content configuration
- Email allowlists for team/group content
- Unified verification endpoint
- Centralized configuration

## Step-by-Step Migration

### Step 1: Update Backend Services

**Remove**: Old `api/src/services/auth-service.ts` (optional - keep for now)

**Add**: New service
```bash
api/src/services/access-control-service.ts  # Already created
```

### Step 2: Update Routes

**Old routes in `api/src/routes/protected-content.ts`**:
```typescript
// POST /auth/verify (password only)
// GET /auth/content/:type/:slug
```

**New routes** (already updated):
```typescript
// GET /auth/access/:type/:slug (NEW)
// POST /auth/verify (ENHANCED)
// GET /auth/content/:type/:slug (same)
// GET /auth/password/:type/:slug (NEW)
```

### Step 3: Add Configuration

Create or update `api/config/access-control.json`:

```json
{
  "contentAccessRules": {
    "notes": {
      "previously-protected-note": {
        "mode": "password",
        "description": "Keep as password-protected"
      },
      "new-public-note": {
        "mode": "open",
        "description": "Now public - was private before"
      }
    }
  }
}
```

### Step 4: Update Frontend

#### Old Password Modal
```tsx
<PasswordModal
  isOpen={true}
  onSubmit={(password) => verifyWithPassword(password)}
  title="My Article"
/>
```

#### New Access Modal
```tsx
import { AccessModal } from './components/access-modal'

<AccessModal
  isOpen={true}
  accessMode={accessMode}  // 'open' | 'password' | 'email-list'
  onSubmit={(payload) => {
    // payload.password for password mode
    // payload.email for email-list mode
  }}
  title="My Article"
/>
```

### Step 5: Update Frontend Flow

**Old Flow**:
```
Show password modal
↓
User enters password
↓
POST /auth/verify with password
↓
Get token
↓
Fetch content
```

**New Flow**:
```
GET /auth/access/:type/:slug
↓
Check access mode
├─ open: Load immediately
├─ password: Show password modal
└─ email-list: Show email modal
↓
POST /auth/verify with credentials
↓
Get token
↓
Fetch content
```

## Configuration Migration

### Convert Old Content to New System

**For content that was password-protected**:
```json
{
  "mode": "password",
  "description": "Original password-protected content"
}
```

**For content that should be public**:
```json
{
  "mode": "open",
  "description": "Now public for everyone"
}
```

**For team-restricted content**:
```json
{
  "mode": "email-list",
  "description": "Restricted to team members",
  "allowedEmails": ["team@company.com"]
}
```

## API Contract Changes

### Request Changes

**Old**:
```json
POST /auth/verify
{
  "type": "notes",
  "slug": "my-article",
  "password": "notes-my-article-hash"
}
```

**New** (backward compatible):
```json
POST /auth/verify
{
  "type": "notes",
  "slug": "my-article",
  "password": "notes-my-article-hash",  // Optional
  "email": "user@example.com"            // Optional
}
```

### Response Changes

**Old**:
```json
{
  "success": true,
  "token": "base64..."
}
```

**New**:
```json
{
  "success": true,
  "token": "base64...",
  "accessMode": "password"  // NEW
}
```

### New Endpoint

**GET** `/auth/access/:type/:slug`
```json
{
  "accessMode": "password",
  "requiresPassword": true,
  "requiresEmail": false,
  "message": "Password protected content"
}
```

## Database/Config Structure

### Old System
No centralized config - relied on frontend or environment variables

### New System
Config-based in `api/config/access-control.json`:

```json
{
  "contentAccessRules": {
    "notes": {
      "slug": {
        "mode": "open|password|email-list",
        "description": "...",
        "allowedEmails": [...]  // For email-list mode
      }
    },
    "publications": {},
    "ideas": {},
    "pages": {}
  }
}
```

## Types Migration

### Old Type
```typescript
interface VerifyPasswordRequest {
  type: 'notes' | 'publications' | 'ideas' | 'pages'
  slug: string
  password: string  // Always required
}
```

### New Type
```typescript
interface VerifyPasswordRequest {
  type: 'notes' | 'publications' | 'ideas' | 'pages'
  slug: string
  password?: string  // Optional
  email?: string     // Optional
}
```

## Rollback Plan

If you need to revert to the old system:

1. **Restore old auth service** (if deleted)
2. **Revert route changes** to use only password verification
3. **Remove config file**
4. **Update frontend** to old PasswordModal component

However, the new system is backward compatible - old password-protected content will continue working.

## Testing Migration

### Test 1: Open Content
```bash
curl http://localhost:8787/auth/access/notes/my-note
# Should return "accessMode": "open"
```

### Test 2: Password-Protected Content
```bash
curl -X POST http://localhost:8787/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"type":"notes","slug":"my-note","password":"..."}'
# Should return token
```

### Test 3: Email-Restricted Content
```bash
curl -X POST http://localhost:8787/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"type":"notes","slug":"my-note","email":"user@example.com"}'
# Should return token if authorized
```

## Backward Compatibility

✅ **Fully compatible** - Old clients will continue working:

```typescript
// Old code still works
const response = await fetch('/auth/verify', {
  method: 'POST',
  body: JSON.stringify({
    type: 'notes',
    slug: 'my-note',
    password: 'notes-my-note-hash'
  })
})
// Returns token as before
```

## Common Issues During Migration

### Issue: "Access mode not defined"
**Solution**: Add content to `api/config/access-control.json`

### Issue: "Email not authorized"
**Solution**: Check email matches allowlist exactly (case-insensitive but must match)

### Issue: "Content not found"
**Solution**: Verify content file exists and is in the right directory

### Issue: "Old password no longer works"
**Solution**: Password format hasn't changed - verify config mode is "password"

## Timeline Recommendation

1. **Week 1**: Create new config file, test endpoints
2. **Week 2**: Update frontend component
3. **Week 3**: Deploy to staging
4. **Week 4**: Test thoroughly
5. **Week 5**: Deploy to production

## Validation Checklist

- [ ] All old password-protected content configured
- [ ] New public content marked as "open"
- [ ] Team content has correct email allowlists
- [ ] Frontend tests pass with new modal
- [ ] API endpoints tested with curl
- [ ] Token generation working
- [ ] Content retrieval works
- [ ] Staging environment tested
- [ ] Production backup created
- [ ] Rollback plan documented

## Support

- Check `docs/access-control-system.md` for details
- Review `docs/ACCESS_CONTROL_EXAMPLES.md` for config examples
- See `IMPLEMENTATION_SUMMARY.md` for architecture

---

Migration is straightforward and fully backward compatible!
