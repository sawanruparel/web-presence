# Database Schema Review & Justification

**Date:** October 17, 2025  
**Purpose:** Detailed review of each table before implementation

---

## Table-by-Table Analysis

### ⭐ ESSENTIAL TABLES (Must Have)

---

#### 1. `content_access_rules` - Core Access Control

**Purpose:** Single source of truth for who can access what content

```sql
CREATE TABLE content_access_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Content identification
  type TEXT NOT NULL,                    -- 'notes', 'publications', 'ideas', 'pages'
  slug TEXT NOT NULL,                    -- 'physical-interfaces', 'local-first-ai'
  
  -- Access control
  access_mode TEXT NOT NULL DEFAULT 'open', -- 'open', 'password', 'email-list'
  description TEXT,                      -- 'Physical interfaces concepts'
  
  -- Password storage (only for password mode)
  password_hash TEXT,                    -- bcrypt hash of password
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one rule per content
  UNIQUE(type, slug)
);

CREATE INDEX idx_access_rules_type_slug ON content_access_rules(type, slug);
```

**Sample Data:**
```sql
INSERT INTO content_access_rules (type, slug, access_mode, description, password_hash)
VALUES 
  ('notes', 'physical-interfaces', 'open', 'Physical interfaces concepts', NULL),
  ('ideas', 'sample-protected-idea', 'password', 'Sample protected note', '$2a$10$...'),
  ('publications', 'decisionrecord-io', 'email-list', 'Decision Record IO', NULL);
```

**Why Essential:**
- Replaces `access-control.json`
- Enables runtime changes
- Foundation for all access checks

**Fields Breakdown:**

| Field | Required? | Why? |
|-------|-----------|------|
| `id` | Yes | Primary key, foreign key reference |
| `type` | Yes | Content type for routing |
| `slug` | Yes | Content identifier |
| `access_mode` | Yes | Determines auth flow |
| `description` | No | Human-readable, helpful for admin UI |
| `password_hash` | Conditional | Only for password mode, NULL otherwise |
| `created_at` | Nice-to-have | Audit trail, can remove if not needed |
| `updated_at` | Nice-to-have | Track changes, can remove if not needed |

**Minimal Version (if needed):**
```sql
CREATE TABLE content_access_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  access_mode TEXT NOT NULL DEFAULT 'open',
  password_hash TEXT,  -- only for password mode
  UNIQUE(type, slug)
);
```

---

#### 2. `email_allowlist` - Email-Based Access

**Purpose:** Store allowed emails for email-list access mode

```sql
CREATE TABLE email_allowlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Link to access rule
  access_rule_id INTEGER NOT NULL,
  
  -- Email address (case-insensitive)
  email TEXT NOT NULL,
  
  -- Metadata
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(access_rule_id) REFERENCES content_access_rules(id) ON DELETE CASCADE,
  UNIQUE(access_rule_id, email)
);

CREATE INDEX idx_allowlist_rule ON email_allowlist(access_rule_id);
CREATE INDEX idx_allowlist_email ON email_allowlist(email);
```

**Sample Data:**
```sql
-- For publications/decisionrecord-io (access_rule_id = 3)
INSERT INTO email_allowlist (access_rule_id, email)
VALUES 
  (3, 'admin@example.com'),
  (3, 'reviewer@example.com');
```

**Why Essential:**
- Can't store arrays in SQLite efficiently
- Separate table enables easy CRUD
- Supports multiple emails per content

**Could We Skip This?**
- **NO** - You're using email-list mode for `decisionrecord-io`
- Without this, you'd need JSON column (less efficient)

**Minimal Version:**
```sql
CREATE TABLE email_allowlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  access_rule_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  FOREIGN KEY(access_rule_id) REFERENCES content_access_rules(id) ON DELETE CASCADE,
  UNIQUE(access_rule_id, email)
);
```

---

### 📊 ANALYTICS TABLES (Recommended)

---

#### 3. `access_logs` - Audit Trail

**Purpose:** Track all access attempts for security and analytics

```sql
CREATE TABLE access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Content identification
  access_rule_id INTEGER,                -- NULL for open content
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  
  -- Access result
  access_granted BOOLEAN NOT NULL,       -- TRUE if granted, FALSE if denied
  
  -- Credential used (for audit, never password!)
  credential_type TEXT,                  -- 'password', 'email', 'none'
  credential_value TEXT,                 -- email address only (NOT password)
  
  -- Request metadata
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamp
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(access_rule_id) REFERENCES content_access_rules(id) ON DELETE SET NULL
);

CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX idx_access_logs_type_slug ON access_logs(type, slug);
CREATE INDEX idx_access_logs_granted ON access_logs(access_granted);
```

**Sample Data:**
```sql
-- Successful password attempt
INSERT INTO access_logs (access_rule_id, type, slug, access_granted, credential_type, ip_address)
VALUES (2, 'ideas', 'sample-protected-idea', TRUE, 'password', '192.168.1.1');

-- Failed email attempt
INSERT INTO access_logs (access_rule_id, type, slug, access_granted, credential_type, credential_value, ip_address)
VALUES (3, 'publications', 'decisionrecord-io', FALSE, 'email', 'unauthorized@example.com', '192.168.1.2');
```

**Why Recommended:**
- Security monitoring (detect brute force)
- Analytics (which content needs auth most)
- Compliance (audit trail)
- Debug access issues

**Could We Skip This?**
- **YES** - Initially, add it later
- **BUT** - Very useful for security

**What You Lose Without It:**
- Can't track failed login attempts
- Can't detect suspicious activity
- No audit trail for compliance
- Can't analyze access patterns

---

#### 4. `page_views` - Web Analytics

**Purpose:** Track page views for analytics and engagement metrics

```sql
CREATE TABLE page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Content identification
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  
  -- Session tracking
  session_id TEXT,                       -- Anonymous session ID
  
  -- Request metadata
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,                         -- Where user came from
  
  -- Engagement
  view_duration_ms INTEGER,              -- Time on page (if tracked)
  
  -- Timestamp
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_views_timestamp ON page_views(timestamp);
CREATE INDEX idx_page_views_type_slug ON page_views(type, slug);
CREATE INDEX idx_page_views_session ON page_views(session_id);
```

**Sample Data:**
```sql
INSERT INTO page_views (type, slug, session_id, referrer, view_duration_ms)
VALUES 
  ('notes', 'physical-interfaces', 'abc123', 'https://google.com', 45000),
  ('ideas', 'local-first-ai', 'abc123', NULL, 120000);
```

**Why Recommended:**
- Understand content popularity
- Track referral sources
- Measure engagement
- Guide content strategy

**Could We Skip This?**
- **YES** - Add it later when you need analytics
- Use Google Analytics initially if preferred

**What You Lose Without It:**
- No first-party analytics
- Dependent on third-party tools
- Can't correlate access control with views

---

### 🔐 ADMIN TABLES (Optional - You Asked About These)

---

#### 5. `admin_users` - Admin Authentication

**Purpose:** Authenticate users who can manage access rules via API

```sql
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Credentials
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,           -- bcrypt hash
  
  -- Profile
  name TEXT,
  role TEXT DEFAULT 'admin',             -- For future: 'admin', 'superadmin'
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Tracking
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_email ON admin_users(email);
```

**Sample Data:**
```sql
INSERT INTO admin_users (email, password_hash, name)
VALUES ('admin@example.com', '$2a$10$...', 'Admin User');
```

---

#### 6. `admin_sessions` - Session Management

**Purpose:** Track admin login sessions

```sql
CREATE TABLE admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- User reference
  admin_user_id INTEGER NOT NULL,
  
  -- Session
  token TEXT NOT NULL UNIQUE,            -- JWT or session token
  
  -- Request metadata
  ip_address TEXT,
  user_agent TEXT,
  
  -- Expiry
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);
```

---

### 🤔 DO YOU NEED ADMIN TABLES?

**The Question:** How will you update access rules in the database?

#### Option A: Skip Admin Tables (Simpler)

**How to manage access rules:**

1. **Direct DB Updates (Local Development)**
   ```bash
   # Add/update access rule
   npx wrangler d1 execute web-presence-db --local \
     --command "INSERT INTO content_access_rules (type, slug, access_mode) 
                VALUES ('notes', 'new-note', 'password')"
   ```

2. **Migration Scripts**
   ```javascript
   // scripts/add-access-rule.js
   const response = await fetch('http://localhost:8787/api/internal/access-rules', {
     method: 'POST',
     headers: { 
       'X-API-Key': process.env.INTERNAL_API_KEY  // Simple API key
     },
     body: JSON.stringify({
       type: 'notes',
       slug: 'new-note',
       accessMode: 'password',
       password: 'my-password'
     })
   })
   ```

3. **Protected API Endpoint with API Key**
   ```typescript
   // Simple API key auth (no user accounts)
   app.post('/api/internal/access-rules', async (c) => {
     const apiKey = c.req.header('X-API-Key')
     if (apiKey !== c.env.INTERNAL_API_KEY) {
       return c.json({ error: 'Unauthorized' }, 401)
     }
     
     // Create access rule
     // ...
   })
   ```

**Pros:**
- ✅ Simpler - No user management
- ✅ Faster - Skip 2 tables
- ✅ Less code - No login/session logic
- ✅ Sufficient for personal site

**Cons:**
- ❌ No web UI for management
- ❌ Manual database updates
- ❌ Single API key (no per-user audit)

---

#### Option B: Include Admin Tables (Complete)

**How to manage access rules:**

1. **Web UI Dashboard**
   - Login at `/admin`
   - Manage access rules visually
   - View analytics
   - Add/remove emails

2. **API with Authentication**
   ```bash
   # Login
   curl -X POST http://api.example.com/api/admin/login \
     -d '{"email":"admin@example.com","password":"secret"}'
   
   # Get token, use for subsequent requests
   curl -X POST http://api.example.com/api/admin/access-rules \
     -H "Authorization: Bearer <token>" \
     -d '{"type":"notes","slug":"new-note","accessMode":"password"}'
   ```

**Pros:**
- ✅ Professional solution
- ✅ Multiple admins possible
- ✅ Per-user audit trail
- ✅ Web UI for non-technical users
- ✅ Scalable

**Cons:**
- ❌ More complex
- ❌ More code to maintain
- ❌ Needs admin UI development

---

## 💡 RECOMMENDED APPROACH

### Phase 1: Essential Tables Only (Start Here)

**Tables to Create:**
1. ✅ `content_access_rules` - Core access control
2. ✅ `email_allowlist` - Email-based access
3. ✅ `access_logs` - Audit trail (highly recommended)

**Skip for Now:**
4. ❌ `page_views` - Add later when you want analytics
5. ❌ `admin_users` - Not needed yet
6. ❌ `admin_sessions` - Not needed yet

**How to Manage Access Rules:**
- Use simple API key authentication
- Create management scripts
- Direct DB access for updates

```typescript
// Simple protected endpoint
app.post('/api/internal/access-rules', apiKeyMiddleware, async (c) => {
  // Create/update access rules
})

app.get('/api/content-catalog', apiKeyMiddleware, async (c) => {
  // For build script
})
```

**API Key Middleware:**
```typescript
async function apiKeyMiddleware(c: Context, next: Next) {
  const apiKey = c.req.header('X-API-Key')
  if (apiKey !== c.env.INTERNAL_API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}
```

---

### Phase 2: Add Analytics (When Needed)

**Add Table:**
3. ✅ `page_views`

**Why Later:**
- Not blocking core functionality
- Can use Google Analytics meanwhile
- Easy to add when you want first-party analytics

---

### Phase 3: Add Admin System (If You Want Web UI)

**Add Tables:**
4. ✅ `admin_users`
5. ✅ `admin_sessions`

**When to Add:**
- Multiple people managing content
- Need web UI for non-technical users
- Want per-user audit trail

---

## 📋 MINIMAL SCHEMA (Start Here)

```sql
-- Table 1: Access Rules
CREATE TABLE content_access_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  access_mode TEXT NOT NULL DEFAULT 'open',
  description TEXT,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(type, slug)
);

CREATE INDEX idx_access_rules_type_slug ON content_access_rules(type, slug);

-- Table 2: Email Allowlists
CREATE TABLE email_allowlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  access_rule_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(access_rule_id) REFERENCES content_access_rules(id) ON DELETE CASCADE,
  UNIQUE(access_rule_id, email)
);

CREATE INDEX idx_allowlist_rule ON email_allowlist(access_rule_id);
CREATE INDEX idx_allowlist_email ON email_allowlist(email);

-- Table 3: Access Logs (Recommended)
CREATE TABLE access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  access_rule_id INTEGER,
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  access_granted BOOLEAN NOT NULL,
  credential_type TEXT,
  credential_value TEXT,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(access_rule_id) REFERENCES content_access_rules(id) ON DELETE SET NULL
);

CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX idx_access_logs_type_slug ON access_logs(type, slug);
```

**Total: 3 tables, ~60 lines of SQL**

---

## 🎯 FINAL RECOMMENDATION

### Start With: 3 Essential Tables

1. **`content_access_rules`** - Must have
2. **`email_allowlist`** - Must have (you use email-list mode)
3. **`access_logs`** - Highly recommended (security + audit)

### Management Approach: Simple API Key

- No admin users table
- Use `X-API-Key` header for authentication
- Create helper scripts for common operations
- Add admin UI later if needed

### Add Later:
- `page_views` - When you want analytics
- `admin_users` + `admin_sessions` - When you want web UI

---

## ❓ Questions for You

1. **Do you need to manage access rules frequently?**
   - YES → Consider admin tables
   - NO → API key is fine

2. **Will multiple people manage access rules?**
   - YES → Need admin users + audit trail
   - NO → API key is sufficient

3. **Do you want a web UI for management?**
   - YES → Need admin tables + build UI
   - NO → Scripts + API are fine

4. **Do you need analytics now?**
   - YES → Include `page_views`
   - NO → Add later (easy to add)

---

## 🚀 My Recommendation

**Start minimal, grow as needed:**

```
Phase 1 (Week 1): 3 core tables + API key auth
Phase 2 (Later):  Add page_views when you want analytics
Phase 3 (Future): Add admin tables if you want web UI
```

**This gives you:**
- ✅ All access control features working
- ✅ Audit trail for security
- ✅ Room to grow
- ✅ Not over-engineered

**Sound good?**
