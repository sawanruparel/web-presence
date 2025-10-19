# Common Tasks & Recipes

Quick recipes for common access control tasks.

## 📝 Configuration Tasks

### Add Open/Public Content

```json
{
  "notes": {
    "my-public-article": {
      "mode": "open",
      "description": "Publicly accessible article"
    }
  }
}
```

**Result**: Content loads immediately, no authentication needed

---

### Add Password-Protected Content

**Steps**:
1. Add content file to `content/` directory
2. Run: `node api/scripts/generate-seed-config.js` to update `content-config.json`
3. Run: `./api/seed-database-dynamic.sh` to sync database
4. Get password: `node scripts/generate-passwords.js ideas local-first-ai`
5. Share password with users
6. Password format: `{adjective}-{noun}-{4-digit-number}` (e.g., `swift-tiger-7392`)

---

### Add Email-Restricted Content

```json
{
  "publications": {
    "team-document": {
      "mode": "email-list",
      "description": "Restricted to approved team members",
      "allowedEmails": [
        "alice@company.com",
        "bob@company.com",
        "charlie@company.com"
      ]
    }
  }
}
```

**Steps**:
1. Add emails to allowlist
2. Users enter their email address
3. System checks if email is in allowlist
4. If authorized, user gets token

---

### Add Content with Email Groups

```json
{
  "pages": {
    "internal-handbook": {
      "mode": "email-list",
      "description": "Employee handbook",
      "allowedEmails": [
        "all-employees@company.com"
      ]
    }
  }
}
```

**Result**: All emails in the group can access the content

---

### Convert Content Between Modes

#### From Public to Password-Protected
```json
// Before
"my-article": { "mode": "open" }

// After
"my-article": { "mode": "password" }
```

#### From Password to Public
```json
// Before
"my-article": { "mode": "password" }

// After
"my-article": { "mode": "open" }
```

#### From Password to Email-Restricted
```json
// Before
"my-article": { "mode": "password" }

// After
"my-article": {
  "mode": "email-list",
  "allowedEmails": ["user1@example.com", "user2@example.com"]
}
```

---

## 🧪 Testing Tasks

### Test Open Content

```bash
# Check access requirements
curl http://localhost:8787/auth/access/notes/my-article

# Expected response
{
  "accessMode": "open",
  "requiresPassword": false,
  "requiresEmail": false,
  "message": "My Article"
}
```

---

### Test Password-Protected Content

```bash
# Get the password from content-config.json
PASSWORD=$(node scripts/generate-passwords.js ideas local-first-ai)

echo "Password: $PASSWORD"

# Verify with password
curl -X POST http://localhost:8787/auth/verify \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"ideas\",\"slug\":\"local-first-ai\",\"password\":\"$PASSWORD\"}"

# Expected response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessMode": "password"
}
```

---

### Test Email-Restricted Content

```bash
# Verify with authorized email
curl -X POST http://localhost:8787/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"type":"publications","slug":"team-doc","email":"alice@company.com"}'

# Expected response (if authorized)
{
  "success": true,
  "token": "base64-token...",
  "accessMode": "email-list"
}

# Test with unauthorized email
curl -X POST http://localhost:8787/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"type":"publications","slug":"team-doc","email":"unauthorized@example.com"}'

# Expected response
{
  "success": false,
  "message": "Your email is not authorized to access this content"
}
```

---

### Test Getting Protected Content

```bash
# First, get a token
TOKEN=$(curl -s -X POST http://localhost:8787/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"type":"notes","slug":"public","password":""}' | jq -r '.token')

# Then fetch the content
curl http://localhost:8787/auth/content/notes/public \
  -H "Authorization: Bearer $TOKEN"

# Expected response
{
  "slug": "public",
  "title": "Article Title",
  "date": "2025-10-16",
  "readTime": "5 min",
  "type": "notes",
  "excerpt": "...",
  "content": "...",
  "html": "<p>...</p>"
}
```

---

## 🎯 Frontend Integration Tasks

### Implement Access Check

```typescript
async function checkContentAccess(type: string, slug: string) {
  const response = await fetch(`/auth/access/${type}/${slug}`)
  const { accessMode } = await response.json()
  
  return accessMode  // 'open' | 'password' | 'email-list'
}
```

---

### Implement Verification

```typescript
async function verifyAccess(
  type: string, 
  slug: string, 
  password?: string,
  email?: string
) {
  const response = await fetch('/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      slug,
      password,
      email
    })
  })
  
  const { success, token, accessMode } = await response.json()
  
  if (success) {
    // Store token
    sessionStorage.setItem(`token-${type}-${slug}`, token)
    return token
  } else {
    throw new Error('Verification failed')
  }
}
```

---

### Fetch Protected Content

```typescript
async function getProtectedContent(type: string, slug: string) {
  const token = sessionStorage.getItem(`token-${type}-${slug}`)
  
  if (!token) {
    throw new Error('No access token')
  }
  
  const response = await fetch(`/auth/content/${type}/${slug}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}
```

---

### Complete Flow

```typescript
async function loadContent(type: string, slug: string) {
  // Step 1: Check access mode
  const accessResponse = await fetch(`/auth/access/${type}/${slug}`)
  const { accessMode } = await accessResponse.json()
  
  // Step 2: Handle based on mode
  let token
  
  if (accessMode === 'open') {
    // Direct access
    token = (await verifyAccess(type, slug)).token
  } else if (accessMode === 'password') {
    // Get password from user via modal
    const password = await getPasswordFromUser()
    token = await verifyAccess(type, slug, password)
  } else if (accessMode === 'email-list') {
    // Get email from user via modal
    const email = await getEmailFromUser()
    token = await verifyAccess(type, slug, undefined, email)
  }
  
  // Step 3: Fetch content
  const content = await getProtectedContent(type, slug)
  
  // Step 4: Display content
  displayContent(content)
}
```

---

## 🔒 Security Tasks

### Rotate Email Allowlist

```json
// Before
"team-document": {
  "allowedEmails": ["oldstaff@company.com"]
}

// After (new staff added)
"team-document": {
  "allowedEmails": [
    "newstaff@company.com",
    "anotherstaff@company.com"
  ]
}
```

**Note**: Old users with tokens will continue working until token expires (24 hours)

---

### Remove User Access

```json
// Remove email from allowlist
"team-document": {
  "allowedEmails": [
    // "removed-user@company.com" removed
    "active-user@company.com"
  ]
}
```

---

### Audit Access

Since there's no built-in audit logging yet, you can:

1. **Log verification attempts** in middleware
2. **Track failed attempts** per email/password
3. **Monitor token generation** patterns

Example middleware addition:
```typescript
// In auth middleware or routes
const attemptLog = {
  timestamp: new Date(),
  type: c.req.param('type'),
  slug: c.req.param('slug'),
  status: success ? 'verified' : 'denied'
}
// Store in database or log file
```

---

## 🚀 Deployment Tasks

### Update Config in Production

1. Update database access rules via API
2. Deploy API: `cd api && npm run deploy`
3. Changes take effect immediately

### Rollback if Needed

1. Keep backup of previous config
2. Revert to previous version: `git revert <commit>`
3. Deploy: `npm run deploy`

### Monitor After Deployment

- Test each access mode
- Verify tokens are generated
- Check content retrieval works
- Monitor for errors

---

## 🐛 Troubleshooting Tasks

### Debug: Content Not Found

```bash
# Check if content rule exists
curl http://localhost:8787/auth/access/notes/my-article

# If 404: Add to config
# If success: Content rule exists
```

### Debug: Token Expired

```bash
# Tokens are valid for 24 hours
# To fix: User re-authenticates
# Implement token refresh (future enhancement)
```

### Debug: Email Not Authorized

```bash
# Verify email matches exactly (case-insensitive but exact spelling)
# Example:
# Configured: "alice@company.com"
# Submitted: "alice@company.com" ✅ Works
# Submitted: "ALICE@COMPANY.COM" ✅ Works (case-insensitive)
# Submitted: "alice@company.co" ❌ Doesn't match
# Submitted: "alice@company.com " ❌ Extra space doesn't match
```

### Debug: Password Not Accepted

```bash
# Get the correct password from content-config.json
node scripts/generate-passwords.js ideas local-first-ai

# Format is: {adjective}-{noun}-{4-digit-number}
# Example: swift-tiger-7392

# Common issues:
# - Wrong type
# - Wrong slug
# - Extra spaces
# - Different capitalization (passwords are case-sensitive)
```

---

## 📊 Monitoring Tasks

### Check API Health

```bash
curl http://localhost:8787/health
```

### Monitor Failed Attempts

```bash
# Set up logging in middleware to capture:
# - Failed password attempts
# - Unauthorized emails
# - Missing parameters
# - Invalid tokens
```

### Track Usage Patterns

Log these metrics:
- Verification attempts per day
- Failed vs successful verifications
- Most accessed content
- Most common access modes

---

## 📚 Documentation Tasks

### Update Your Own Docs

When you update config, document:

```markdown
## Access Control Configuration

### Public Content
- Ideas: extending-carplay
- Notes: getting-started

### Password Protected
- Notes: secret-notes (password: notes-secret-notes-xyz)

### Email Restricted
- Publications: team-strategy (reviewers: alice@, bob@)
```

---

## 🎓 Learning Resources

Review these files to understand the system better:

1. **Architecture**: `docs/api/access-control.md`
2. **Service Code**: `api/src/services/access-control-service.ts`
3. **Routes**: `api/src/routes/protected-content.ts`
4. **Frontend**: `web/src/components/access-modal.tsx`

---

## ✅ Checklist for New Content

When adding new content:

- [ ] Create content file
- [ ] Add to database access rules via API
- [ ] Choose access mode
- [ ] Add description
- [ ] For email-list: Add allowedEmails array
- [ ] Test access endpoint
- [ ] Test verification endpoint
- [ ] Test content retrieval
- [ ] Update documentation
- [ ] Deploy

---

That's it! These recipes cover the most common tasks. Refer to the full documentation for more details.
