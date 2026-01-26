# Access Control Architecture Decision

**Date:** October 17, 2025  
**Last Updated:** January 25, 2026  
**Status:** ✅ IMPLEMENTED - Database-Driven Architecture  
**Priority:** COMPLETE

---

## Current Implementation (As of January 2026)

The system has been **fully migrated to a database-driven access control architecture**. The database (Cloudflare D1) is the **single source of truth** for all access control decisions.

### Architecture Overview

**Single Source of Truth:** Database (Cloudflare D1)

```
┌─────────────────────────────────────────────────────────────┐
│                    Database (D1)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  content_access_rules table                          │  │
│  │  - type (notes|ideas|publications|pages)             │  │
│  │  - slug (filename without .md)                       │  │
│  │  - access_mode (open|password|email-list)           │  │
│  │  - description                                        │  │
│  │  - allowed_emails (JSON array for email-list mode)   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ (queries)
                          ▼
        ┌─────────────────────────────────────┐
        │  Backend API                        │
        │  - Content Processing Service       │
        │  - Access Control Service           │
        │  - Database Service                 │
        └─────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│  Build Script    │              │  Runtime API      │
│  (fetch-content) │              │  (protected-     │
│                  │              │   content)       │
│  - Fetches       │              │                  │
│    catalog       │              │  - Checks        │
│  - Filters by    │              │    access rules  │
│    access_mode   │              │  - Verifies      │
│  - Only includes │              │    passwords/     │
│    'open' content│              │    emails         │
└──────────────────┘              └──────────────────┘
```

### Key Principles

1. **Database is the ONLY source of truth** for access control
2. **Folder structure is NOT used** to determine access control
   - `content/` and `content-protected/` folders are organizational only
   - Files can be in either folder - database determines access
3. **Frontmatter is NOT used** for access control decisions
   - Frontmatter is for content metadata (title, date, etc.)
   - Access control is managed entirely in the database
4. **Default behavior:** If no database rule exists, content defaults to `open` (public)

### Implementation Details

#### Backend: Content Processing Service

**File:** `api/src/services/content-processing-service.ts`

```typescript
private async determineAccessMode(
  filePath: string,
  frontmatter: Record<string, any>
): Promise<{ isProtected: boolean; accessMode: 'open' | 'password' | 'email-list' }> {
  // ONLY check database - single source of truth
  const type = this.extractType(filePath)
  const slug = this.extractSlug(filePath)
  
  if (this.databaseService) {
    const dbRule = await this.databaseService.getAccessRule(type, slug)
    
    if (dbRule) {
      return {
        isProtected: dbRule.access_mode !== 'open',
        accessMode: dbRule.access_mode
      }
    }
  }
  
  // Default to open if not in database
  return { isProtected: false, accessMode: 'open' }
}
```

**Key Points:**
- ✅ Only queries database - no folder structure checks
- ✅ No frontmatter checks for access control
- ✅ Defaults to `open` if no rule exists

#### Frontend: Build Script

**File:** `web/scripts/fetch-content-from-r2.ts`

```typescript
// Create a map of type/slug -> accessMode from database rules (single source of truth)
const accessRules = new Map<string, string>()
if (catalogData.content && Array.isArray(catalogData.content)) {
  catalogData.content.forEach((rule: { type: string; slug: string; accessMode: string }) => {
    const key = `${rule.type}/${rule.slug}`
    accessRules.set(key, rule.accessMode)
  })
}

// Filter metadata to only include public content (accessMode === 'open')
// Database is the single source of truth for access control
const filterPublicContent = (items: any[], type: string): any[] => {
  return items.filter(item => {
    const key = `${type}/${item.slug}`
    const accessMode = accessRules.get(key)
    // Only include if accessMode is 'open' or not in database (default to open)
    const isPublic = !accessMode || accessMode === 'open'
    return isPublic
  })
}
```

**Key Points:**
- ✅ Fetches access rules from database via API
- ✅ Filters content based on database rules only
- ✅ Only includes `open` content in public metadata

#### Runtime: Access Control

**File:** `api/src/routes/protected-content.ts`

```typescript
// Helper endpoint to check access requirements for a content item
app.get('/access/:type/:slug', async (c) => {
  const type = c.req.param('type')
  const slug = c.req.param('slug')
  
  const accessControlService = createAccessControlService(c.env.DB)
  const accessMode = await accessControlService.getAccessMode(type, slug)
  const rule = await accessControlService.getAccessRule(type, slug)
  
  if (!rule) {
    return c.json({ message: 'Content not found' }, 404)
  }

  return c.json({
    accessMode,
    requiresPassword: accessMode === 'password',
    requiresEmail: accessMode === 'email-list',
    message: rule.description
  })
})
```

**Key Points:**
- ✅ All access checks query database
- ✅ No folder structure or frontmatter checks
- ✅ Returns 404 if content not in database

### Database Schema

```sql
CREATE TABLE content_access_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,                    -- 'notes', 'ideas', 'publications', 'pages'
  slug TEXT NOT NULL,                    -- filename without .md extension
  access_mode TEXT NOT NULL DEFAULT 'open',  -- 'open', 'password', 'email-list'
  description TEXT,
  allowed_emails TEXT,                    -- JSON array of emails for email-list mode
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(type, slug)
);

CREATE INDEX idx_content_access_rules_lookup ON content_access_rules(type, slug);
```

### Access Modes

1. **`open`** - Public content, no authentication required
   - Included in public `content-metadata.json`
   - Accessible without any verification

2. **`password`** - Password-protected content
   - NOT included in public metadata
   - Requires password verification via `/api/protected-content/verify`
   - Token stored in localStorage after verification

3. **`email-list`** - Email allowlist-protected content
   - NOT included in public metadata
   - Requires email verification via `/api/protected-content/verify`
   - Email must be in `allowed_emails` JSON array
   - Token stored in localStorage after verification

### Folder Structure (Organizational Only)

The `content/` and `content-protected/` folders are **purely organizational** and do NOT affect access control:

```
content/                    ← Can contain ANY content (public or protected)
├── notes/
├── publications/
├── ideas/
└── pages/

content-protected/          ← Can contain ANY content (public or protected)
├── notes/
├── publications/
├── ideas/
└── pages/
```

**Important:** The folder location does NOT determine access control. The database does.

### Content Management Workflow

To add new protected content:

1. **Create markdown file** in either `content/` or `content-protected/` folder
   - Location doesn't matter - it's organizational only

2. **Add database rule** via API or migration script:
   ```sql
   INSERT INTO content_access_rules (type, slug, access_mode, description)
   VALUES ('ideas', 'my-secret-idea', 'password', 'Password-protected idea');
   ```

3. **Content is automatically protected** based on database rule
   - Build script excludes it from public metadata
   - Runtime API enforces access control

### Migration from Old System

The system was migrated from a folder-based approach. The migration:

- ✅ Removed all folder structure checks from code
- ✅ Removed all frontmatter-based access control checks
- ✅ Migrated access rules to database
- ✅ Updated build script to use database rules
- ✅ Updated runtime API to use database rules

### Benefits of Current Architecture

1. **Single Source of Truth** - Database is the only place access rules are stored
2. **Runtime Flexibility** - Can change access rules without rebuilding
3. **No Confusion** - Clear that database determines access, not folders
4. **Scalable** - Easy to add new access modes or rules
5. **Auditable** - All access rules visible in database
6. **Consistent** - Same logic for build-time and runtime

### Known Limitations

1. **Password Security** - Uses deterministic passwords (not bcrypt) due to Workers limitations
2. **Token Security** - Tokens are Base64 encoded, not cryptographically signed
3. **No Audit Logging** - Access attempts are not logged (future enhancement)
4. **No Rate Limiting** - Verification attempts are not rate-limited (future enhancement)

---

## Summary

✅ **Status:** Fully implemented and operational

✅ **Single Source of Truth:** Database (Cloudflare D1)

✅ **No Folder Structure Dependencies:** Code does not check folder structure for access control

✅ **No Frontmatter Dependencies:** Code does not check frontmatter for access control

The architecture is now clean, consistent, and maintainable. All access control decisions are made based on database rules only.
