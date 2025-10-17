# Access Control System Implementation

## Overview

The updated password/access control API now supports three different access modes for content:

1. **Open** - Publicly accessible, no authentication required
2. **Password** - Protected by a password (unique per content item)
3. **Email-List** - Restricted to a list of approved email addresses

## Configuration

Access control rules are defined in `/api/config/access-control.json`:

```json
{
  "contentAccessRules": {
    "notes": {
      "physical-interfaces": {
        "mode": "open",
        "description": "Physical interfaces concepts"
      },
      "sample-protected-idea": {
        "mode": "password",
        "description": "Sample protected note"
      }
    },
    "publications": {
      "decisionrecord-io": {
        "mode": "email-list",
        "description": "Decision Record IO publication",
        "allowedEmails": [
          "admin@example.com",
          "reviewer@example.com"
        ]
      }
    },
    "ideas": {},
    "pages": {}
  }
}
```

### Configuration Schema

```typescript
interface AccessControlRule {
  mode: 'open' | 'password' | 'email-list'
  description: string
  allowedEmails?: string[]  // Required for 'email-list' mode
}
```

## API Endpoints

### 1. Check Access Requirements

**GET** `/auth/access/:type/:slug`

Returns the access mode and requirements for a content item.

**Response:**
```json
{
  "accessMode": "password",
  "requiresPassword": true,
  "requiresEmail": false,
  "message": "Sample protected note"
}
```

### 2. Verify Access

**POST** `/auth/verify`

Verifies access based on the content's access mode.

**Request:**
```typescript
{
  type: 'notes' | 'publications' | 'ideas' | 'pages'
  slug: string
  password?: string      // Required for 'password' mode
  email?: string         // Required for 'email-list' mode
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "base64-encoded-jwt",
  "accessMode": "password"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid password for notes/sample-protected-idea"
}
```

### 3. Get Protected Content

**GET** `/auth/content/:type/:slug`

Retrieves the full content after successful authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "slug": "sample-protected-idea",
  "title": "Sample Protected Idea",
  "date": "2025-10-16",
  "readTime": "5 min",
  "type": "notes",
  "excerpt": "...",
  "content": "...",
  "html": "..."
}
```

### 4. Get Password (Development)

**GET** `/auth/password/:type/:slug`

Returns the password for a password-protected content item (development/debugging only).

**Response:**
```json
{
  "type": "notes",
  "slug": "sample-protected-idea",
  "password": "notes-sample-protected-idea-a1b2c3",
  "note": "Use this password to access the protected content"
}
```

## Service Architecture

### Access Control Service (`api/src/services/access-control-service.ts`)

The main service for managing access control logic:

```typescript
accessControlService.getAccessRule(type, slug)          // Get rule for content
accessControlService.isPubliclyAccessible(type, slug)   // Check if public
accessControlService.verifyPassword(password, type, slug) // Verify password
accessControlService.verifyEmail(email, type, slug)     // Verify email in allowlist
accessControlService.generateContentPassword(type, slug) // Generate password
accessControlService.generateToken(payload)             // Create JWT token
accessControlService.getAccessMode(type, slug)          // Get access mode
```

### Token Payload Structure

```typescript
interface TokenPayload {
  type: string
  slug: string
  email?: string              // Present only for 'email-list' mode
  verifiedAt: string         // ISO timestamp
  iat: number                // Issued at (unix timestamp)
  exp: number                // Expiration (unix timestamp, 24 hours)
}
```

## Frontend Integration

### Updated Access Modal Component

A new unified `AccessModal` component handles all three access modes:

```tsx
import { AccessModal, AccessPayload } from './components/access-modal'

function Example() {
  const [isOpen, setIsOpen] = useState(false)
  const [accessMode, setAccessMode] = useState<AccessMode>('open')
  
  const handleSubmit = async (payload: AccessPayload) => {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'notes',
        slug: 'my-content',
        password: payload.password,
        email: payload.email
      })
    })
    // Handle response...
  }
  
  return (
    <AccessModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onSubmit={handleSubmit}
      title="My Article"
      accessMode={accessMode}
    />
  )
}
```

## Frontend Workflow

1. **Check Access Requirements**
   - Call `GET /auth/access/:type/:slug` to determine access mode
   - If "open", display content immediately
   - If "password" or "email-list", show appropriate modal

2. **User Provides Access Credentials**
   - User enters password or email
   - Modal sends POST to `/auth/verify` with credentials

3. **Receive Token**
   - Backend validates credentials based on access mode
   - Returns JWT token if valid

4. **Access Protected Content**
   - Store token in sessionStorage/localStorage
   - Call `GET /auth/content/:type/:slug` with `Authorization: Bearer <token>` header
   - Backend validates token in middleware
   - Return full content

## Password Generation Algorithm

Passwords are deterministic based on type and slug:

```javascript
function generateContentPassword(type, slug) {
  const baseString = `${type}-${slug}`
  const hash = simpleHash(baseString)
  return `${type}-${slug}-${hash}`
}
```

**Example:**
- Type: `notes`
- Slug: `sample-protected-idea`
- Password: `notes-sample-protected-idea-a1b2c3`

## Email Verification

Email addresses in the allowlist are case-insensitive and trimmed during comparison:

```typescript
// Allowed: ["admin@example.com"]
// Valid: "admin@example.com", "Admin@Example.com", " admin@example.com "
// Invalid: "user@example.com"
```

## Backend Routes Integration

The router is mounted at `/auth` in the main app:

```typescript
// In api/src/index.ts
app.route('/auth', protectedContentRouter)
```

**Available routes:**
- `GET /auth/access/:type/:slug`
- `GET /auth/password/:type/:slug`
- `POST /auth/verify`
- `GET /auth/content/:type/:slug`

## Migration Guide

### From Old System

**Before:**
- Only password-protected content
- All requests required password

**After:**
- Three access modes available
- Define config in `api/config/access-control.json`
- Update frontend to use new `AccessModal` component
- Use `AccessPayload` interface for form submission

## Future Enhancements

1. **Database Backing**
   - Replace JSON config with database
   - Support dynamic rule updates without redeployment
   - Add access audit logging

2. **Rate Limiting**
   - Implement rate limiting on verification endpoint
   - Prevent brute force attacks

3. **Cryptographic Improvements**
   - Use proper JWT signing with JOSE library
   - Implement token refresh mechanism
   - Add encryption for sensitive data

4. **Access Analytics**
   - Track access patterns
   - Monitor failed verification attempts
   - Generate access reports

## Security Notes

⚠️ **Current Limitations:**

1. **Passwords are predictable** - Anyone with the algorithm can generate valid passwords
2. **No encryption** - Tokens are Base64 encoded, not cryptographically signed
3. **No rate limiting** - Vulnerable to brute force attacks
4. **No audit logging** - No tracking of access attempts
5. **Fixed expiration** - No token refresh, users must re-authenticate after 24 hours

**Recommendations:**

1. Use proper JWT signing (available via `jose` library already in dependencies)
2. Implement rate limiting
3. Add database backing for dynamic configuration
4. Implement audit logging
5. Add email verification for email-list mode
6. Consider two-factor authentication for sensitive content
