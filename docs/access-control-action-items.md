# Access Control Implementation - Action Items

## ✅ Completed

1. ✅ Create access control config structure
2. ✅ Implement `accessControlService` with three modes
3. ✅ Update API types for access control
4. ✅ Modify `/auth/verify` endpoint to handle all modes
5. ✅ Add `/auth/access/:type/:slug` endpoint
6. ✅ Update `/auth/password/:type/:slug` endpoint
7. ✅ Type checking passes without errors

## 🔴 Critical (Before Production)

### 1. Implement Proper JWT Signing
**File:** `/api/src/services/access-control-service.ts`
**Priority:** CRITICAL
**Effort:** 1-2 hours

```typescript
// Current (insecure)
const token = btoa(JSON.stringify(tokenData))

// Needed (secure)
import { SignJWT } from 'jose'
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret')
const token = await new SignJWT(tokenData)
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('24h')
  .sign(secret)
```

### 2. Fix Security Default for Unknown Content
**File:** `/api/src/services/access-control-service.ts`
**Priority:** CRITICAL
**Effort:** 15 minutes

```typescript
// Current (insecure)
getAccessMode(type: string, slug: string): AccessMode {
  const rule = this.getAccessRule(type, slug)
  return rule?.mode || 'open'  // ❌ Unknown content is public!
}

// Fixed (secure)
getAccessMode(type: string, slug: string): AccessMode | null {
  const rule = this.getAccessRule(type, slug)
  return rule?.mode || null  // ✅ Force explicit handling
}
```

### 3. Add Token Claim Validation
**File:** `/api/src/routes/protected-content.ts`
**Priority:** CRITICAL
**Effort:** 30 minutes

```typescript
protectedContentRouter.get('/content/:type/:slug', authMiddleware, async (c) => {
  const type = c.req.param('type')
  const slug = c.req.param('slug')
  
  // Add this validation
  const user = c.get('user')
  if (user.type !== type || user.slug !== slug) {
    return c.json({ 
      error: 'Forbidden', 
      message: 'Token not valid for this content' 
    }, 403)
  }
  
  // ... rest of code
})
```

### 4. Add Email Format Validation
**File:** `/api/src/services/access-control-service.ts`
**Priority:** CRITICAL
**Effort:** 15 minutes

```typescript
verifyEmail(email: string, type: string, slug: string): boolean {
  // Add format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return false
  }
  
  const rule = this.getAccessRule(type, slug)
  // ... rest of code
}
```

## 🟡 High Priority (Within 1 Week)

### 5. Add Rate Limiting
**New File:** `/api/src/middleware/rate-limiter.ts`
**Priority:** HIGH
**Effort:** 1-2 hours

```typescript
import { Context, Next } from 'hono'

const rateLimits = new Map<string, { count: number, resetAt: number }>()

export const rateLimiter = (maxAttempts: number, windowMs: number) => {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('cf-connecting-ip') || 'unknown'
    const key = `${ip}:${c.req.url}`
    
    const now = Date.now()
    const limit = rateLimits.get(key)
    
    if (limit && limit.resetAt > now) {
      if (limit.count >= maxAttempts) {
        return c.json({ error: 'Too many requests' }, 429)
      }
      limit.count++
    } else {
      rateLimits.set(key, { count: 1, resetAt: now + windowMs })
    }
    
    await next()
  }
}
```

Then apply to routes:
```typescript
import { rateLimiter } from '../middleware/rate-limiter'

// In protected-content.ts
protectedContentRouter.post('/verify', 
  rateLimiter(5, 60000), // 5 attempts per minute
  async (c) => { ... }
)
```

### 6. Add Audit Logging
**New File:** `/api/src/services/audit-logger.ts`
**Priority:** HIGH
**Effort:** 2 hours

```typescript
export interface AuditLog {
  timestamp: string
  event: 'access_attempt' | 'access_granted' | 'access_denied'
  type: string
  slug: string
  email?: string
  ip?: string
  userAgent?: string
  success: boolean
  reason?: string
}

export const auditLogger = {
  async log(entry: AuditLog): Promise<void> {
    // For now, just console.log
    // Later: send to analytics, KV store, or external service
    console.log(JSON.stringify(entry))
  }
}
```

### 7. Remove Config Duplication
**Priority:** HIGH
**Effort:** 30 minutes

Choose one approach:
- **Option A:** Keep TypeScript only (delete JSON file)
- **Option B:** Load from JSON at runtime

Recommendation: Keep TypeScript for Cloudflare Workers bundling.

### 8. Update Frontend Modal
**File:** `/web/src/components/password-modal.tsx`
**Priority:** HIGH
**Effort:** 2-3 hours

Create new `AccessModal` component:
```tsx
interface AccessModalProps {
  isOpen: boolean
  onClose: () => void
  accessMode: 'open' | 'password' | 'email-list'
  onSubmit: (credentials: { 
    password?: string
    email?: string 
  }) => Promise<void>
  title: string
  isLoading?: boolean
  error?: string
}

export function AccessModal({ accessMode, ... }: AccessModalProps) {
  // Render different UI based on accessMode
  if (accessMode === 'open') {
    // Show "Access" button only
  } else if (accessMode === 'password') {
    // Show password input
  } else if (accessMode === 'email-list') {
    // Show email input
  }
}
```

### 9. Add Comprehensive Tests
**New Files:** Multiple test files
**Priority:** HIGH
**Effort:** 4-6 hours

```
api/
  tests/
    services/
      access-control-service.test.ts  (2 hours)
    routes/
      protected-content.test.ts       (2 hours)
    integration/
      access-control.integration.test.ts (2 hours)
```

## 🟢 Nice to Have (Future)

### 10. Add Refresh Tokens
**Effort:** 3-4 hours

### 11. Add Environment Secret to Password Generation
**File:** `/api/src/services/access-control-service.ts`
**Effort:** 30 minutes

```typescript
generateContentPassword(type: string, slug: string): string {
  const secret = process.env.PASSWORD_SECRET || 'default-secret'
  const baseString = `${type}-${slug}-${secret}`
  const hash = this.simpleHash(baseString)
  return `${type}-${slug}-${hash}`
}
```

### 12. Add Config Enhancements
- Wildcard support
- Email groups
- Expiration dates
- Metadata fields

### 13. Add Documentation
**Files:**
- `docs/access-control-api.md`
- `docs/access-control-config.md`
- `docs/access-control-migration.md`
- `docs/access-control-security.md`

### 14. Optimize Email Allowlist for Large Lists
**Effort:** 1 hour

```typescript
// Use Set for O(1) lookup instead of array iteration
private emailSets = new Map<string, Set<string>>()

verifyEmail(email: string, type: string, slug: string): boolean {
  const key = `${type}:${slug}`
  
  if (!this.emailSets.has(key)) {
    const rule = this.getAccessRule(type, slug)
    if (rule?.allowedEmails) {
      this.emailSets.set(
        key, 
        new Set(rule.allowedEmails.map(e => e.toLowerCase().trim()))
      )
    }
  }
  
  const emailSet = this.emailSets.get(key)
  return emailSet?.has(email.toLowerCase().trim()) || false
}
```

### 15. Migrate to Datastore
**Effort:** 1-2 days

Use Cloudflare KV or D1:
```typescript
// Replace in-memory config with KV store
const accessRule = await env.ACCESS_RULES.get(`${type}:${slug}`)
```

## Effort Summary

| Priority | Total Items | Estimated Time |
|----------|-------------|----------------|
| 🔴 Critical | 4 items | ~3 hours |
| 🟡 High | 5 items | ~12-15 hours |
| 🟢 Nice to Have | 6 items | ~20-30 hours |

## Recommended Timeline

### Week 1 (Must Do)
- Day 1-2: Complete all 🔴 Critical items (3 hours)
- Day 3-4: Rate limiting + Audit logging (3 hours)
- Day 5: Remove config duplication (30 min)

### Week 2 (Should Do)
- Day 1-3: Frontend modal updates (2-3 hours)
- Day 4-5: Comprehensive tests (4-6 hours)

### Week 3+ (Nice to Have)
- Add enhancements as needed
- Documentation
- Performance optimizations
- Datastore migration

## Quick Start Commands

```bash
# Type check
cd /workspaces/web-presence/api && npm run type-check

# Run dev server
cd /workspaces/web-presence/api && npm run dev

# Test verification endpoint
curl -X POST http://localhost:8787/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"type":"notes","slug":"sample-protected-idea","password":"notes-sample-protected-idea-abc123"}'

# Test access check endpoint
curl http://localhost:8787/auth/access/publications/decisionrecord-io

# Test email verification
curl -X POST http://localhost:8787/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"type":"publications","slug":"decisionrecord-io","email":"admin@example.com"}'
```

## Questions?

Review the full implementation review at `/docs/implementation-review.md`
