# Database-Driven Access Control Implementation Plan

**Date:** October 17, 2025  
**Architecture:** Hybrid - Content in Git, Access Control in Database  
**Database:** Cloudflare D1 (SQLite)  
**Timeline:** 1-2 weeks

---

## Architecture Overview

### Hybrid Approach

```
┌─────────────────────────────────────────────────────────────┐
│                     CONTENT STORAGE                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Git Repository (Source of Truth for Content)                │
│  ├── content/                                                │
│  │   ├── notes/                                             │
│  │   ├── publications/                                       │
│  │   ├── ideas/                                             │
│  │   └── pages/                                             │
│  └── content-protected/                                      │
│      ├── notes/                                             │
│      ├── publications/                                       │
│      ├── ideas/                                             │
│      └── pages/                                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              ACCESS CONTROL & ANALYTICS                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Cloudflare D1 Database (Access Rules & Logs)                │
│  ├── content_access_rules                                    │
│  │   - type, slug, access_mode                              │
│  │   - description, allowed_emails                           │
│  ├── access_logs                                             │
│  │   - attempts, grants, denials                            │
│  │   - user, ip, timestamp                                  │
│  └── page_views                                              │
│      - sessions, views, referrers                           │
│      - analytics data                                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    BUILD PROCESS                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Read markdown files from Git                             │
│  2. Fetch access rules from D1 API                           │
│  3. Match files to access rules                              │
│  4. Generate static HTML                                     │
│  5. Create content-metadata.json                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   RUNTIME FLOW                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User requests content                                    │
│  2. Query D1 for access rules                                │
│  3. Verify credentials (if needed)                           │
│  4. Log access attempt                                       │
│  5. Return content or error                                  │
│  6. Track page view                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Content stays in Git** ✅
   - Easy versioning
   - Familiar workflow
   - Markdown editing
   - Git history preserved

2. **Access control in DB** ✅
   - Runtime changes without rebuild
   - Audit logging
   - Analytics
   - No config file management

3. **Build-time DB query** ✅
   - Fetch access rules during build
   - Generate appropriate static files
   - No runtime dependency for static content

---

## Database Schema

### Complete Schema

```sql
-- ============================================================
-- TABLE: content_access_rules
-- Purpose: Define access control for each content item
-- ============================================================
CREATE TABLE content_access_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,                    -- notes, publications, ideas, pages
  slug TEXT NOT NULL,                    -- unique identifier
  access_mode TEXT NOT NULL DEFAULT 'open', -- open, password, email-list
  description TEXT,                      -- human-readable description
  password_hash TEXT,                    -- bcrypt hash (for password mode)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,                       -- admin user who created rule
  UNIQUE(type, slug)
);

CREATE INDEX idx_access_rules_type_slug ON content_access_rules(type, slug);
CREATE INDEX idx_access_rules_mode ON content_access_rules(access_mode);

-- ============================================================
-- TABLE: email_allowlist
-- Purpose: Email addresses allowed for email-list access mode
-- ============================================================
CREATE TABLE email_allowlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  access_rule_id INTEGER NOT NULL,
  email TEXT NOT NULL,                   -- case-insensitive email
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  added_by TEXT,                         -- admin user who added email
  FOREIGN KEY(access_rule_id) REFERENCES content_access_rules(id) ON DELETE CASCADE,
  UNIQUE(access_rule_id, email)
);

CREATE INDEX idx_allowlist_rule ON email_allowlist(access_rule_id);
CREATE INDEX idx_allowlist_email ON email_allowlist(email);

-- ============================================================
-- TABLE: access_logs
-- Purpose: Audit trail of all access attempts
-- ============================================================
CREATE TABLE access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  access_rule_id INTEGER,                -- NULL for open content
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  access_granted BOOLEAN NOT NULL,       -- TRUE if access granted
  credential_type TEXT,                  -- password, email, none
  credential_value TEXT,                 -- email address (NOT password)
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(access_rule_id) REFERENCES content_access_rules(id) ON DELETE SET NULL
);

CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX idx_access_logs_type_slug ON access_logs(type, slug);
CREATE INDEX idx_access_logs_granted ON access_logs(access_granted);
CREATE INDEX idx_access_logs_credential ON access_logs(credential_value);

-- ============================================================
-- TABLE: page_views
-- Purpose: Web analytics and usage tracking
-- ============================================================
CREATE TABLE page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  session_id TEXT,                       -- anonymous session identifier
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,                         -- where user came from
  view_duration_ms INTEGER,              -- time spent on page (if tracked)
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_views_timestamp ON page_views(timestamp);
CREATE INDEX idx_page_views_type_slug ON page_views(type, slug);
CREATE INDEX idx_page_views_session ON page_views(session_id);

-- ============================================================
-- TABLE: admin_users
-- Purpose: Admin authentication for management endpoints
-- ============================================================
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,           -- bcrypt hash
  name TEXT,
  role TEXT DEFAULT 'admin',             -- admin, superadmin
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_email ON admin_users(email);

-- ============================================================
-- TABLE: admin_sessions
-- Purpose: Admin session management
-- ============================================================
CREATE TABLE admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,            -- JWT or session token
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);
```

---

## API Endpoints

### Content Catalog (Build-time)

```typescript
GET /api/content-catalog
Purpose: Fetch all access rules for build-time generation
Auth: API key (set in environment)
Response:
{
  "rules": [
    {
      "type": "notes",
      "slug": "physical-interfaces",
      "accessMode": "open",
      "description": "Physical interfaces concepts"
    },
    {
      "type": "publications",
      "slug": "decisionrecord-io",
      "accessMode": "email-list",
      "description": "Decision Record IO",
      "allowedEmails": ["admin@example.com"]
    }
  ]
}
```

### Access Control Management (Admin)

```typescript
// List all access rules
GET /api/admin/access-rules
Auth: Admin JWT
Query: ?type=notes&access_mode=password
Response: { rules: AccessRule[] }

// Get single rule
GET /api/admin/access-rules/:type/:slug
Auth: Admin JWT
Response: { rule: AccessRule }

// Create new rule
POST /api/admin/access-rules
Auth: Admin JWT
Body: {
  type: "notes",
  slug: "my-note",
  accessMode: "password",
  password: "plain-text-password",  // Will be hashed
  description: "My protected note"
}

// Update rule
PUT /api/admin/access-rules/:type/:slug
Auth: Admin JWT
Body: { accessMode: "open", password: null }

// Delete rule (sets to default: open)
DELETE /api/admin/access-rules/:type/:slug
Auth: Admin JWT

// Manage email allowlist
POST /api/admin/access-rules/:type/:slug/emails
Auth: Admin JWT
Body: { email: "user@example.com" }

DELETE /api/admin/access-rules/:type/:slug/emails/:email
Auth: Admin JWT
```

### Analytics (Admin)

```typescript
// Access logs
GET /api/admin/analytics/access-logs
Auth: Admin JWT
Query: ?start=2025-01-01&end=2025-01-31&type=notes&granted=true
Response: { logs: AccessLog[], total: number }

// Page views
GET /api/admin/analytics/page-views
Auth: Admin JWT
Query: ?start=2025-01-01&end=2025-01-31&type=publications
Response: { 
  views: PageView[], 
  total: number,
  stats: {
    totalViews: number,
    uniqueSessions: number,
    avgDuration: number,
    topReferrers: Array<{referrer: string, count: number}>
  }
}

// Summary stats
GET /api/admin/analytics/summary
Auth: Admin JWT
Query: ?period=7d
Response: {
  totalAccessAttempts: number,
  successfulAccess: number,
  failedAccess: number,
  totalPageViews: number,
  uniqueVisitors: number,
  mostViewedContent: Array<{type: string, slug: string, views: number}>
}
```

### Admin Authentication

```typescript
// Login
POST /api/admin/login
Body: { email: string, password: string }
Response: { token: string, user: { email, name, role } }

// Logout
POST /api/admin/logout
Auth: Admin JWT

// Verify session
GET /api/admin/verify
Auth: Admin JWT
Response: { valid: boolean, user: User }
```

---

## Implementation Steps

### Phase 1: Database Setup (Day 1)

**Step 1.1: Initialize D1 Database**

```bash
cd /workspaces/web-presence/api

# Create D1 database
npx wrangler d1 create web-presence-db

# Output will give you database_id
# Add to wrangler.toml
```

**Step 1.2: Update wrangler.toml**

```toml
[[d1_databases]]
binding = "DB"
database_name = "web-presence-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

**Step 1.3: Create Migration Files**

```bash
# Create migrations directory
mkdir -p api/migrations

# Create initial migration
npx wrangler d1 migrations create web-presence-db initial-schema
```

**Step 1.4: Apply Migrations**

```bash
# Local development
npx wrangler d1 migrations apply web-presence-db --local

# Production (later)
npx wrangler d1 migrations apply web-presence-db --remote
```

### Phase 2: Backend Services (Days 2-3)

**Step 2.1: Create Database Service**

File: `/api/src/services/database-service.ts`

- CRUD operations for access rules
- Email allowlist management
- Query builders
- Transaction support

**Step 2.2: Update Access Control Service**

File: `/api/src/services/access-control-service.ts`

- Replace config file reads with DB queries
- Add logging integration
- Cache access rules in memory (optional)

**Step 2.3: Create Analytics Service**

File: `/api/src/services/analytics-service.ts`

- Log access attempts
- Log page views
- Query analytics data
- Generate reports

**Step 2.4: Create Admin Service**

File: `/api/src/services/admin-service.ts`

- Admin authentication
- Session management
- CRUD for access rules
- User management

### Phase 3: API Routes (Day 4)

**Step 3.1: Content Catalog Endpoint**

File: `/api/src/routes/content-catalog.ts`

- Public endpoint (API key protected)
- Returns all access rules for build

**Step 3.2: Admin Routes**

File: `/api/src/routes/admin.ts`

- All admin endpoints
- JWT authentication middleware
- Input validation

**Step 3.3: Analytics Routes**

File: `/api/src/routes/analytics.ts`

- Query endpoints for logs
- Summary statistics
- Data export

### Phase 4: Build Script Integration (Day 5)

**Step 4.1: Update generate-static-content.js**

```javascript
// Add at top
const BUILD_API_URL = process.env.BUILD_API_URL || 'http://localhost:8787'
const BUILD_API_KEY = process.env.BUILD_API_KEY

async function fetchAccessRules() {
  const response = await fetch(`${BUILD_API_URL}/api/content-catalog`, {
    headers: {
      'Authorization': `Bearer ${BUILD_API_KEY}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch access rules from API')
  }
  
  return await response.json()
}

async function processMarkdownFiles() {
  // Fetch access rules from DB
  const { rules } = await fetchAccessRules()
  
  // Create lookup map
  const accessRulesMap = new Map()
  rules.forEach(rule => {
    const key = `${rule.type}/${rule.slug}`
    accessRulesMap.set(key, rule)
  })
  
  // Process files
  contentTypes.forEach(type => {
    // ... existing file processing
    
    files.forEach(file => {
      const slug = file.replace('.md', '')
      const key = `${type}/${slug}`
      const accessRule = accessRulesMap.get(key)
      
      const contentItem = {
        slug,
        title: cleanTitle,
        // ... existing fields
        isProtected: accessRule?.accessMode !== 'open',
        accessMode: accessRule?.accessMode || 'open'
      }
      
      // Decide where to put content based on access mode
      if (accessRule?.accessMode === 'open') {
        // Include in public metadata
        contentMetadata[type].push(contentItem)
      } else {
        // Protected content
        protectedContent[type].push(contentItem)
      }
    })
  })
}
```

**Step 4.2: Environment Variables**

```bash
# .env.local (for build)
BUILD_API_URL=http://localhost:8787
BUILD_API_KEY=your-build-api-key-here
```

### Phase 5: Migration Script (Day 6)

**Step 5.1: Create Migration Tool**

File: `/scripts/migrate-config-to-db.js`

```javascript
// Read access-control.json
// Insert into D1 database
// Generate passwords for password-protected content
// Validate migration
```

### Phase 6: Admin UI (Days 7-10) - Optional

**Step 6.1: Create Admin Dashboard**

- React admin panel
- Login page
- Access rules management
- Analytics dashboard
- User management

**Step 6.2: Admin Components**

- Access rules table with edit/delete
- Email allowlist editor
- Analytics charts
- Log viewer

### Phase 7: Testing & Deployment (Days 11-12)

**Step 7.1: Local Testing**

- Start local D1 database
- Test all endpoints
- Test build process
- Verify access control

**Step 7.2: Deploy**

```bash
# Deploy backend with D1 binding
npx wrangler deploy

# Build frontend
cd ../web
npm run build

# Deploy frontend
```

---

## Environment Variables

### Backend (api/.dev.vars)

```bash
# Database
# D1 binding is automatic via wrangler.toml

# API Keys
BUILD_API_KEY=your-build-api-key-here
ADMIN_JWT_SECRET=your-jwt-secret-here

# Password hashing
BCRYPT_ROUNDS=10

# Session
SESSION_EXPIRY_HOURS=24
```

### Frontend Build (web/.env.local)

```bash
# Build-time API access
BUILD_API_URL=http://localhost:8787
BUILD_API_KEY=your-build-api-key-here
```

---

## Security Considerations

### 1. API Key Protection

- Store BUILD_API_KEY in environment variables
- Rotate regularly
- Different keys for dev/staging/prod

### 2. Admin Authentication

- Strong password requirements
- JWT with short expiry
- Refresh token mechanism
- Rate limiting on login

### 3. Access Logs

- Never log passwords (even hashed)
- IP anonymization option (GDPR)
- Log retention policy

### 4. Email Privacy

- Case-insensitive comparison
- No email validation messages (privacy)
- GDPR compliance for logs

---

## Migration Strategy

### Step 1: Run Migration Script

```bash
node scripts/migrate-config-to-db.js
```

### Step 2: Verify Data

```bash
# Query D1 to verify
npx wrangler d1 execute web-presence-db --local \
  --command "SELECT * FROM content_access_rules"
```

### Step 3: Test Build

```bash
cd web
npm run build:content
```

### Step 4: Keep Config File as Backup

- Don't delete `access-control.json` immediately
- Use as reference during migration
- Remove after successful deployment

---

## Analytics Capabilities

### Access Analytics

- Total access attempts by content
- Success/failure rates
- Popular protected content
- Failed access patterns (security)
- Time-based access patterns

### Page View Analytics

- Most viewed content
- Referrer sources
- Session durations
- Geographic distribution (if tracking IP)
- Device/browser analytics (user-agent)

### User Behavior

- Content discovery paths
- Return visitor rates
- Protected vs public content ratio
- Email allowlist effectiveness

---

## Future Enhancements

### Phase 2 Features

- [ ] Email notifications on access
- [ ] Time-based access (publish at date)
- [ ] Access expiry (temp passwords)
- [ ] Bulk email management
- [ ] CSV import/export for allowlists

### Phase 3 Features

- [ ] Rate limiting per user/IP
- [ ] Content recommendation engine
- [ ] A/B testing framework
- [ ] Real-time analytics dashboard
- [ ] Webhook notifications

---

## Success Metrics

### Technical

- ✅ Zero config file maintenance
- ✅ Build time < 30s
- ✅ API response time < 100ms
- ✅ 100% audit trail coverage

### Business

- ✅ Track content engagement
- ✅ Monitor access patterns
- ✅ Identify popular content
- ✅ Optimize access control

---

## Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Database Setup | 1 day | Working D1 database |
| Backend Services | 2 days | DB service layer |
| API Routes | 1 day | All endpoints |
| Build Integration | 1 day | Fetch from DB |
| Migration | 1 day | Data migrated |
| Admin UI (Optional) | 4 days | Management interface |
| Testing | 2 days | Production ready |
| **Total** | **8-12 days** | Complete system |

---

## Next Steps

Ready to start implementation! First step:

```bash
cd /workspaces/web-presence/api
npx wrangler d1 create web-presence-db
```

Shall I proceed with Phase 1?
