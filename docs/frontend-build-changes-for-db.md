# Frontend & Build Script Changes for Database Migration

**Date:** October 17, 2025  
**Purpose:** Document all changes needed in frontend/build before implementing database  
**Scope:** Minimal schema (3 tables) + API key auth

---

## Overview

**Goal:** Identify what changes when we move from `access-control.json` to database

**Key Change:** Build script will call API instead of reading config file

---

## Current vs Future Architecture

### Current Architecture (File-Based)

```
┌─────────────────────────────────────────┐
│  Build Process (generate-static-        │
│  content.js)                             │
├─────────────────────────────────────────┤
│                                          │
│  1. Read markdown from content/         │
│  2. Process frontmatter                  │
│  3. Generate HTML                        │
│  4. Create content-metadata.json         │
│                                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Backend Runtime (access-control-        │
│  service.ts)                             │
├─────────────────────────────────────────┤
│                                          │
│  1. Read access-control.json             │
│  2. Check access mode                    │
│  3. Verify credentials                   │
│  4. Return content                       │
│                                          │
└─────────────────────────────────────────┘

No connection between build and runtime!
```

### Future Architecture (Database)

```
┌─────────────────────────────────────────┐
│  Build Process (generate-static-        │
│  content.js)                             │
├─────────────────────────────────────────┤
│                                          │
│  1. Read markdown from content/         │
│  2. Call GET /api/content-catalog  ← NEW│
│  3. Match files to access rules    ← NEW│
│  4. Process based on access mode   ← NEW│
│  5. Generate HTML                        │
│  6. Create content-metadata.json         │
│                                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Backend Runtime (access-control-        │
│  service.ts)                             │
├─────────────────────────────────────────┤
│                                          │
│  1. Query database for access rules← NEW│
│  2. Check access mode                    │
│  3. Verify credentials                   │
│  4. Log access attempt              ← NEW│
│  5. Return content                       │
│                                          │
└─────────────────────────────────────────┘

Build calls runtime API to get access rules!
```

---

## Files That Need Changes

### 1. Environment Variables

#### New Variables Needed

**File: `/api/.dev.vars`** (local development)
```bash
# API Key for internal endpoints
INTERNAL_API_KEY=your-random-api-key-here-min-32-chars

# Database binding (automatic from wrangler.toml)
# DB = ...
```

**File: `/web/.env.local`** (build time)
```bash
# Backend API URL (for build script to call)
BUILD_API_URL=http://localhost:8787
BUILD_API_KEY=your-random-api-key-here-min-32-chars

# Must match INTERNAL_API_KEY from api/.dev.vars
```

**File: `/.env.example`** (documentation)
```bash
# Backend API Keys
INTERNAL_API_KEY=generate-random-32-char-string
BUILD_API_KEY=same-as-internal-api-key

# Build Configuration
BUILD_API_URL=http://localhost:8787
```

**Generate API Key:**
```bash
# Run this to generate secure key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 2. Build Script Changes

#### File: `/web/scripts/generate-static-content.js`

**Current: No API calls**

**Changes Needed:**

##### A. Add API Client at Top

```javascript
// Add after imports
const BUILD_API_URL = process.env.BUILD_API_URL || 'http://localhost:8787'
const BUILD_API_KEY = process.env.BUILD_API_KEY

if (!BUILD_API_KEY) {
  console.error('Error: BUILD_API_KEY environment variable is required')
  console.error('Run: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"')
  process.exit(1)
}

/**
 * Fetch access rules from backend API
 * @returns {Promise<{rules: Array}>}
 */
async function fetchAccessRulesFromAPI() {
  try {
    console.log('Fetching access rules from API:', BUILD_API_URL)
    
    const response = await fetch(`${BUILD_API_URL}/api/content-catalog`, {
      method: 'GET',
      headers: {
        'X-API-Key': BUILD_API_KEY,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API request failed: ${response.status} - ${error}`)
    }
    
    const data = await response.json()
    console.log(`Fetched ${data.rules?.length || 0} access rules from API`)
    
    return data
  } catch (error) {
    console.error('Failed to fetch access rules from API:', error.message)
    console.error('Make sure the backend API is running at:', BUILD_API_URL)
    console.error('Start it with: cd api && npm run dev')
    process.exit(1)
  }
}

/**
 * Create a lookup map for quick access rule retrieval
 * @param {Array} rules - Access rules from API
 * @returns {Map<string, object>}
 */
function createAccessRulesMap(rules) {
  const map = new Map()
  
  rules.forEach(rule => {
    const key = `${rule.type}/${rule.slug}`
    map.set(key, {
      accessMode: rule.accessMode,
      description: rule.description,
      allowedEmails: rule.allowedEmails || [],
      requiresPassword: rule.accessMode === 'password',
      requiresEmail: rule.accessMode === 'email-list'
    })
  })
  
  return map
}
```

##### B. Update `processMarkdownFiles()` Function

**Current Logic:**
```javascript
function processMarkdownFiles() {
  // Process all markdown files
  // All go into contentMetadata
  // Files in content-protected/ go into protectedContent if frontmatter.protected = true
}
```

**New Logic:**
```javascript
async function processMarkdownFiles() {
  // 1. Fetch access rules from API
  const { rules } = await fetchAccessRulesFromAPI()
  const accessRulesMap = createAccessRulesMap(rules)
  
  // 2. Process markdown files
  contentTypes.forEach(type => {
    files.forEach(file => {
      const slug = file.replace('.md', '')
      const key = `${type}/${slug}`
      
      // Look up access rule from API
      const accessRule = accessRulesMap.get(key)
      
      // If no rule found, default to open
      const accessMode = accessRule?.accessMode || 'open'
      
      const contentItem = {
        slug,
        title: cleanTitle,
        // ... other fields
        isProtected: accessMode !== 'open',
        accessMode: accessMode
      }
      
      // Decide where to put content based on access mode
      if (accessMode === 'open') {
        // Public content - include in metadata
        contentMetadata[type].push(contentItem)
      } else {
        // Protected content - only metadata, no full content
        protectedContent[type].push(contentItem)
        
        // Add to public metadata but mark as protected
        contentMetadata[type].push({
          ...contentItem,
          content: undefined,  // Don't include content
          html: undefined      // Don't include HTML
        })
      }
    })
  })
}
```

##### C. Make Main Function Async

**Change:**
```javascript
// Before
function processMarkdownFiles() {
  // ...
}

// After
async function processMarkdownFiles() {
  // ...
}

// At bottom of file
// Before
processMarkdownFiles()

// After
processMarkdownFiles().catch(error => {
  console.error('Build failed:', error)
  process.exit(1)
})
```

##### D. Remove Hardcoded Folder Logic

**Before:**
```javascript
// Process public content from content/
contentTypes.forEach(type => {
  const typeDir = path.join(contentDir, type)
  // ...
})

// Process protected content from content-protected/
contentTypes.forEach(type => {
  const protectedTypeDir = path.join(protectedContentDir, type)
  // ...
})
```

**After:**
```javascript
// Process ALL content from both folders
// Decide public vs protected based on API response
const allContentDirs = [
  { dir: contentDir, name: 'content' },
  { dir: protectedContentDir, name: 'content-protected' }
]

allContentDirs.forEach(({ dir, name }) => {
  contentTypes.forEach(type => {
    const typeDir = path.join(dir, type)
    
    if (!fs.existsSync(typeDir)) return
    
    const files = fs.readdirSync(typeDir).filter(f => f.endsWith('.md'))
    
    files.forEach(file => {
      const slug = file.replace('.md', '')
      const key = `${type}/${slug}`
      const accessRule = accessRulesMap.get(key)
      
      // Access mode from API determines treatment
      const accessMode = accessRule?.accessMode || 'open'
      
      // Process based on access mode, not folder location
      // ...
    })
  })
})
```

**Summary of Changes:**
- ✅ Add `fetchAccessRulesFromAPI()` function
- ✅ Add `createAccessRulesMap()` helper
- ✅ Make `processMarkdownFiles()` async
- ✅ Call API at start of build
- ✅ Use API response to determine public vs protected
- ✅ Remove reliance on folder structure
- ✅ Add error handling for API failures

---

### 3. Package.json Changes

#### File: `/web/package.json`

**Current:**
```json
{
  "scripts": {
    "dev": "npm run build:content && vite",
    "build": "npm run build:content && tsc && vite build",
    "build:content": "node scripts/generate-static-content.js"
  }
}
```

**Changes Needed:**

**Option A: Require API to be running**
```json
{
  "scripts": {
    "dev": "npm run build:content && vite",
    "build": "npm run build:content && tsc && vite build",
    "build:content": "node scripts/generate-static-content.js",
    "build:check-api": "curl -f http://localhost:8787/health || (echo 'Backend API not running! Start with: cd api && npm run dev' && exit 1)"
  }
}
```

**Option B: Start API automatically (better)**
```json
{
  "scripts": {
    "dev": "npm run start:api & npm run build:content && vite",
    "build": "npm run build:content && tsc && vite build",
    "build:content": "node scripts/generate-static-content.js",
    "start:api": "cd ../api && npm run dev &",
    "stop:api": "lsof -ti:8787 | xargs kill -9"
  }
}
```

**Option C: Use concurrently (cleanest)**
```bash
npm install --save-dev concurrently
```

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:api\" \"npm run dev:frontend\"",
    "dev:api": "cd ../api && npm run dev",
    "dev:frontend": "wait-on http://localhost:8787/health && npm run build:content && vite",
    "build": "npm run build:content && tsc && vite build",
    "build:content": "node scripts/generate-static-content.js"
  },
  "devDependencies": {
    "concurrently": "^8.0.0",
    "wait-on": "^7.0.0"
  }
}
```

**Recommendation: Option C** - Cleanest developer experience

---

### 4. Frontend Code Changes

#### File: `/web/src/utils/api-client.ts`

**Current:** Already using `/auth/*` endpoints ✅

**Changes Needed:** None! 

Frontend already calls:
- `GET /auth/access/:type/:slug` - Still works
- `POST /auth/verify` - Still works  
- `GET /auth/content/:type/:slug` - Still works

Backend will query DB instead of config file (transparent to frontend)

---

### 5. Documentation Updates

#### Files to Update:

**File: `/docs/development.md`**
- Add section on environment variables
- Document API key setup
- Update build process

**File: `/docs/build-system.md`**
- Document API dependency
- Update build flow diagram
- Add troubleshooting

**File: `/README.md`**
- Update setup instructions
- Add API key generation step

---

## New Files to Create

### 1. API Key Generation Script

**File: `/scripts/generate-api-key.js`**

```javascript
#!/usr/bin/env node

const crypto = require('crypto')

console.log('='.repeat(60))
console.log('API Key Generator')
console.log('='.repeat(60))

const apiKey = crypto.randomBytes(32).toString('hex')

console.log('\nGenerated API Key:')
console.log(apiKey)

console.log('\nAdd to your .env files:')
console.log('─'.repeat(60))
console.log('# api/.dev.vars')
console.log(`INTERNAL_API_KEY=${apiKey}`)
console.log('')
console.log('# web/.env.local')
console.log(`BUILD_API_KEY=${apiKey}`)
console.log(`BUILD_API_URL=http://localhost:8787`)
console.log('─'.repeat(60))

console.log('\nIMPORTANT:')
console.log('- Keep this key secret')
console.log('- Do NOT commit to git')
console.log('- Use different keys for dev/staging/production')
console.log('='.repeat(60))
```

**Make executable:**
```bash
chmod +x scripts/generate-api-key.js
```

**Usage:**
```bash
node scripts/generate-api-key.js
```

---

### 2. Pre-build Validation Script

**File: `/scripts/validate-build-env.js`**

```javascript
#!/usr/bin/env node

const http = require('http')

console.log('Validating build environment...\n')

// Check environment variables
const required = ['BUILD_API_URL', 'BUILD_API_KEY']
const missing = required.filter(key => !process.env[key])

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:')
  missing.forEach(key => console.error(`   - ${key}`))
  console.error('\nRun: node scripts/generate-api-key.js')
  process.exit(1)
}

console.log('✅ Environment variables set')

// Check API is running
const apiUrl = new URL(process.env.BUILD_API_URL)

const options = {
  hostname: apiUrl.hostname,
  port: apiUrl.port || 80,
  path: '/health',
  method: 'GET',
  timeout: 3000
}

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('✅ Backend API is running')
    console.log('\nBuild environment ready!\n')
    process.exit(0)
  } else {
    console.error(`❌ Backend API returned status ${res.statusCode}`)
    console.error('Start API with: cd api && npm run dev')
    process.exit(1)
  }
})

req.on('error', (error) => {
  console.error('❌ Backend API is not running')
  console.error('Start API with: cd api && npm run dev')
  process.exit(1)
})

req.on('timeout', () => {
  req.destroy()
  console.error('❌ Backend API request timed out')
  console.error('Check if API is running: cd api && npm run dev')
  process.exit(1)
})

req.end()
```

**Add to package.json:**
```json
{
  "scripts": {
    "build:content": "node scripts/validate-build-env.js && node scripts/generate-static-content.js"
  }
}
```

---

## Build Process Flow

### Current Flow (File-Based)

```
1. npm run build:content
   ├─ Read markdown files
   ├─ Process frontmatter
   ├─ Generate HTML
   └─ Write content-metadata.json

2. npm run dev
   └─ Start Vite (reads content-metadata.json)

Backend runs independently
```

### New Flow (API-Based)

```
1. Start backend API (must be first!)
   cd api && npm run dev
   └─ Backend starts on localhost:8787

2. npm run build:content
   ├─ Validate environment variables
   ├─ Check API is running (GET /health)
   ├─ Fetch access rules (GET /api/content-catalog)
   ├─ Read markdown files
   ├─ Match files to access rules
   ├─ Decide public vs protected
   ├─ Generate HTML
   └─ Write content-metadata.json

3. npm run dev
   └─ Start Vite (reads content-metadata.json)

OR (with concurrently):

1. npm run dev
   ├─ Start backend API (background)
   ├─ Wait for API to be ready
   ├─ Run build:content
   └─ Start Vite
```

---

## Environment Setup Checklist

### Developer Setup Steps

```bash
# 1. Generate API key
node scripts/generate-api-key.js

# 2. Create api/.dev.vars
cat > api/.dev.vars << EOF
INTERNAL_API_KEY=<paste-generated-key>
EOF

# 3. Create web/.env.local
cat > web/.env.local << EOF
BUILD_API_URL=http://localhost:8787
BUILD_API_KEY=<paste-same-key>
EOF

# 4. Verify setup
node scripts/validate-build-env.js

# 5. Start development
cd api && npm run dev          # Terminal 1
cd web && npm run dev          # Terminal 2

# OR with concurrently
cd web && npm run dev          # Single command
```

---

## Error Scenarios & Handling

### Scenario 1: API Not Running

**Error:**
```
Failed to fetch access rules from API: connect ECONNREFUSED
Make sure the backend API is running at: http://localhost:8787
```

**Solution:**
```bash
cd api && npm run dev
```

### Scenario 2: Wrong API Key

**Error:**
```
API request failed: 401 - Unauthorized
```

**Solution:**
```bash
# Check keys match
echo "API: $(grep INTERNAL_API_KEY api/.dev.vars)"
echo "Build: $(grep BUILD_API_KEY web/.env.local)"
```

### Scenario 3: Missing Environment Variables

**Error:**
```
Error: BUILD_API_KEY environment variable is required
```

**Solution:**
```bash
node scripts/generate-api-key.js
# Follow instructions to create .env files
```

### Scenario 4: Access Rule Not Found

**Behavior:**
- File exists in Git
- No matching rule in database
- Default to `open` mode
- Content included in public metadata

**This is okay!** - Default to open is safe

---

## Testing Strategy

### Before DB Implementation

**Create Mock API Response:**

```javascript
// In generate-static-content.js (temporary)
async function fetchAccessRulesFromAPI() {
  // MOCK DATA - Remove after DB is ready
  console.log('Using MOCK access rules (DB not implemented yet)')
  
  return {
    rules: [
      {
        type: 'notes',
        slug: 'physical-interfaces',
        accessMode: 'open',
        description: 'Physical interfaces concepts'
      },
      {
        type: 'ideas',
        slug: 'sample-protected-idea',
        accessMode: 'password',
        description: 'Sample protected note'
      },
      {
        type: 'publications',
        slug: 'decisionrecord-io',
        accessMode: 'email-list',
        description: 'Decision Record IO',
        allowedEmails: ['admin@example.com', 'reviewer@example.com']
      }
    ]
  }
}
```

**Test Build Script Changes:**
```bash
# Test with mock data
cd web
npm run build:content

# Verify output
cat src/data/content-metadata.json
```

---

## Summary of Changes

### Files to Modify

| File | Change | Complexity |
|------|--------|-----------|
| `/web/scripts/generate-static-content.js` | Add API fetching, update logic | Medium |
| `/web/package.json` | Add concurrently scripts | Low |
| `api/.dev.vars` | Add INTERNAL_API_KEY | Low |
| `/web/.env.local` | Add BUILD_API_KEY, BUILD_API_URL | Low |
| `/.env.example` | Document variables | Low |

### Files to Create

| File | Purpose | Complexity |
|------|---------|-----------|
| `/scripts/generate-api-key.js` | Generate secure keys | Low |
| `/scripts/validate-build-env.js` | Pre-build validation | Low |

### No Changes Needed

| File | Reason |
|------|--------|
| `/web/src/utils/api-client.ts` | Already uses correct endpoints |
| `/web/src/hooks/use-protected-content.ts` | No backend contract changes |
| `/web/src/pages/*.tsx` | No changes needed |
| `/web/src/components/access-modal.tsx` | No changes needed |

---

## Implementation Order

### Phase 1: Preparation (Before DB)

1. ✅ **Create API key generator script**
2. ✅ **Create validation script**
3. ✅ **Update package.json with concurrently**
4. ✅ **Add mock API response to build script**
5. ✅ **Test build with mock data**
6. ✅ **Verify content-metadata.json output**

### Phase 2: Database Implementation

7. Set up D1 database
8. Create database service
9. Create `/api/content-catalog` endpoint
10. Remove mock data from build script
11. Test with real API

### Phase 3: Migration

12. Create migration script
13. Migrate access-control.json to DB
14. Test all three access modes
15. Remove access-control.json (optional)

---

## Next Steps

Ready to implement Phase 1 changes?

1. Create API key generator script
2. Create validation script  
3. Update build script with API fetching
4. Add mock response for testing
5. Test the build process

Should I start implementing these changes?
