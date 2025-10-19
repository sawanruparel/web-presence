# Access Control Architecture Decision

**Date:** October 17, 2025  
**Status:** CRITICAL - Architecture Mismatch Identified  
**Priority:** HIGH - Blocks Production Deployment

---

## Problem Statement

There is a **critical architectural inconsistency** between:

1. **Frontend Build System** - Uses `content/` and `content-protected/` folders
2. **Backend Access Control** - Uses database-driven access control system
3. **No Single Source of Truth** - Three potential sources of access rules:
   - Folder structure (`content/` vs `content-protected/`)
   - Frontmatter (`protected: true`)
   - Database access rules

### Current State Analysis

#### Frontend Build Process (`fetch-content-from-r2.ts`)

```
content/                      → public metadata (content-metadata.json)
  ├── notes/
  ├── publications/
  ├── ideas/
  └── pages/

content-protected/            → backend only (protected-content.json)
  ├── notes/
  ├── publications/
  ├── ideas/
  └── pages/
```

**Rules:**
- Files in `content/` → Always public, included in `content-metadata.json`
- Files in `content-protected/` → ONLY processed if `protected: true` in frontmatter
- Protected content goes to `protected-content.json` (backend only)
- Protected content **NOT included** in public metadata

#### Backend Access Control (`access-control-service.ts` + Database)

```json
{
  "contentAccessRules": {
    "notes": {
      "physical-interfaces": { "mode": "open" },
      "sample-protected-idea": { "mode": "password" }
    },
    "publications": {
      "decisionrecord-io": { 
        "mode": "email-list",
        "allowedEmails": ["admin@example.com"]
      }
    }
  }
}
```

**Rules:**
- Config file defines access mode per slug: `open`, `password`, `email-list`
- NO relationship to folder structure
- NO relationship to frontmatter

### The Mismatches

#### Issue 1: Folder vs Config Mismatch

**Example Problem:**
```
File: content-protected/ideas/sample-protected-idea.md
Config: notes/sample-protected-idea (wrong type!)
```

The config says `notes/sample-protected-idea` but the file is in `content-protected/ideas/`!

#### Issue 2: Public Files with Protected Config

**Example Problem:**
```
File: content/publications/decisionrecord-io.md (PUBLIC folder)
Config: email-list mode (PROTECTED)
Frontend: Included in public metadata
Backend: Expects email verification
```

Frontend shows it as public, backend blocks it!

#### Issue 3: Protected Files with No Config

**Example Problem:**
```
File: content-protected/notes/secret-note.md
Config: No entry for this slug
Backend: Returns "open" mode (default)
```

File is in protected folder but accessible to all!

#### Issue 4: Three-Way Inconsistency

```
Folder:      content-protected/ideas/sample-protected-idea.md
Frontmatter: protected: true
Config:      notes/sample-protected-idea (different type!)
```

Which source of truth wins?

---

## Impact Assessment

### Critical Issues

1. **Security Risk** 
   - Files in `content-protected/` may be accessible without auth if not in config
   - Public files may have broken auth if in config

2. **Development Confusion**
   - Developers must maintain 3 separate systems
   - Easy to create mismatches
   - No validation between sources

3. **Content Management Nightmare**
   - Adding new protected content requires:
     1. Create file in `content-protected/`
     2. Add `protected: true` frontmatter
     3. Update database access rules
     4. Ensure slug matches exactly
     5. Ensure type matches folder
   
4. **No Audit Trail**
   - Can't determine what's actually protected
   - Can't validate configuration
   - Can't report on access control

---

## Solution Options

### Option 1: Folder-Driven (Recommended for Immediate Fix)

**Single Source of Truth:** Folder structure + frontmatter

#### Implementation

**Frontend Build Script Changes:**
```javascript
// In fetch-content-from-r2.ts
function determineAccessMode(filePath, frontmatter, type, slug) {
  const isInProtectedFolder = filePath.includes('content-protected')
  const hasFrontmatter = frontmatter?.protected === true
  
  if (!isInProtectedFolder && !hasFrontmatter) {
    return { mode: 'open' }
  }
  
  // Default protected content to password mode
  const mode = frontmatter?.accessMode || 'password'
  
  return {
    mode,
    allowedEmails: frontmatter?.allowedEmails || [],
    description: frontmatter?.description || `Protected ${type}`
  }
}
```

**Frontmatter Extension:**
```yaml
---
title: "My Secret Article"
protected: true
accessMode: "email-list"  # open | password | email-list
allowedEmails:
  - admin@example.com
  - reviewer@example.com
description: "Beta tester access only"
---
```

**Auto-Generate database rules:**
```javascript
// Generate config during build
function generateAccessControlConfig(contentMetadata, protectedContent) {
  const config = { contentAccessRules: {} }
  
  contentTypes.forEach(type => {
    config.contentAccessRules[type] = {}
    
    // Public content
    contentMetadata[type].forEach(item => {
      config.contentAccessRules[type][item.slug] = {
        mode: 'open',
        description: item.title
      }
    })
    
    // Protected content
    protectedContent[type].forEach(item => {
      config.contentAccessRules[type][item.slug] = {
        mode: item.accessMode || 'password',
        description: item.description || item.title,
        allowedEmails: item.allowedEmails || []
      }
    })
  })
  
  return config
}

// Write to database via API
const response = await fetch('/api/internal/access-rules', {
  method: 'POST',
  headers: { 'X-API-Key': process.env.API_KEY },
  body: JSON.stringify(rule)
})
```

**Pros:**
- ✅ Content authors control access in frontmatter
- ✅ Folder structure provides visual organization
- ✅ Build-time generation ensures consistency
- ✅ Works today with existing infrastructure
- ✅ No backend changes needed

**Cons:**
- ❌ Requires build to update access control
- ❌ No runtime access control changes
- ❌ No audit logging capability

**Timeline:** 2-4 hours

---

### Option 2: API-Driven (Best Long-term)

**Single Source of Truth:** Backend API endpoint

#### Implementation

**New API Endpoint:**
```typescript
// GET /api/content-catalog
// Returns ALL content with access metadata

interface ContentCatalogItem {
  type: string
  slug: string
  title: string
  date: string
  readTime: string
  excerpt: string
  accessMode: 'open' | 'password' | 'email-list'
  description?: string
  requiresPassword?: boolean
  requiresEmail?: boolean
}

export async function getContentCatalog(c: Context) {
  // Read from database or config
  const catalog = await accessControlService.getAllContent()
  return c.json(catalog)
}
```

**Frontend Build Changes:**
```javascript
// Call API during build
async function fetchContentCatalog() {
  const response = await fetch('http://localhost:8787/api/content-catalog')
  return await response.json()
}

// Filter what gets bundled
async function processContent() {
  const catalog = await fetchContentCatalog()
  
  const publicMetadata = catalog.filter(item => 
    item.accessMode === 'open'
  )
  
  const protectedMetadata = catalog.filter(item =>
    item.accessMode !== 'open'
  )
  
  // Process files based on catalog
  // ...
}
```

**Pros:**
- ✅ Backend controls all access
- ✅ Can change access without rebuild
- ✅ Enables audit logging
- ✅ Enables web analytics
- ✅ Prepares for database integration

**Cons:**
- ❌ Requires API to be running during build
- ❌ More complex build process
- ❌ Still need content in files

**Timeline:** 1-2 days

---

### Option 3: Database-Driven (Future State)

**Single Source of Truth:** Database (Cloudflare D1 or similar)

#### Implementation

**Schema:**
```sql
CREATE TABLE content (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  read_time TEXT,
  excerpt TEXT,
  content TEXT NOT NULL,
  html TEXT NOT NULL,
  access_mode TEXT DEFAULT 'open',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(type, slug)
);

CREATE TABLE email_allowlist (
  id INTEGER PRIMARY KEY,
  content_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  FOREIGN KEY(content_id) REFERENCES content(id),
  UNIQUE(content_id, email)
);

CREATE TABLE access_log (
  id INTEGER PRIMARY KEY,
  content_id INTEGER NOT NULL,
  user_email TEXT,
  access_granted BOOLEAN,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(content_id) REFERENCES content(id)
);

CREATE TABLE page_views (
  id INTEGER PRIMARY KEY,
  content_id INTEGER NOT NULL,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(content_id) REFERENCES content(id)
);
```

**Pros:**
- ✅ Complete control
- ✅ Audit logging built-in
- ✅ Web analytics built-in
- ✅ Runtime access control
- ✅ No build required for access changes
- ✅ Can add CMS later

**Cons:**
- ❌ Significant development time
- ❌ Database setup/management
- ❌ Migration complexity
- ❌ Still need to migrate from files

**Timeline:** 1-2 weeks

---

## Recommendation

### Immediate Action (Today)

**Implement Option 1: Folder-Driven**

1. Extend frontmatter to include access control
2. Auto-generate database rules during build
3. Validate folder structure matches config

**Why:**
- Fixes the critical inconsistency NOW
- No backend changes needed
- Works with existing code
- Fast to implement (2-4 hours)

### Phase 2 (Next Sprint)

**Implement Option 2: API-Driven**

- Backend serves content catalog
- Build script validates against API
- Enables audit logging

### Phase 3 (Future)

**Implement Option 3: Database-Driven**

- Full CMS capability
- Analytics dashboard
- Complete audit trail

---

## Implementation Plan for Option 1

### Step 1: Extend Frontmatter Schema (30 min)

```yaml
---
title: "Article Title"
date: "2025-01-15"
protected: true           # Required for content-protected/
accessMode: "email-list"  # open | password | email-list
allowedEmails:            # Only for email-list mode
  - admin@example.com
  - beta@example.com
description: "Access control description"
---
```

### Step 2: Update Build Script (1 hour)

- Parse access control from frontmatter
- Generate database rules automatically
- Validate consistency

### Step 3: Validation Script (30 min)

```javascript
// Validate:
// 1. All files in content-protected/ have protected: true
// 2. All protected files are in content-protected/
// 3. email-list mode has allowedEmails
// 4. Generated config matches files
```

### Step 4: Documentation (30 min)

- Update content management docs
- Add examples
- Migration guide

### Step 5: Migration (1 hour)

- Move files to correct folders
- Add frontmatter
- Test all modes

**Total Time: ~4 hours**

---

## Next Steps

Please confirm which option you'd like to proceed with:

1. **Quick Fix** - Option 1 (Recommended for now)
2. **API-Driven** - Option 2 (Better long-term)
3. **Database** - Option 3 (Future state)

Or a combination approach:
- Implement Option 1 today
- Plan Option 2 for next sprint
- Consider Option 3 for future

What's your preference?
