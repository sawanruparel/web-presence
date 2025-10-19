# API Endpoints

Complete reference for all API endpoints.

## Overview

The API provides two main endpoint groups:

1. **Content Catalog** (`/api/content-catalog`) - For build script to fetch access rules
2. **Internal Admin** (`/api/internal/*`) - For managing access rules and viewing logs
3. **Auth** (`/auth/*`) - For content access control

All endpoints require API key authentication via `X-API-Key` header except auth endpoints.

## Authentication

Most endpoints require API key in the request header:

```bash
X-API-Key: <your-api-key>
```

The API key is configured in:
- `/api/.dev.vars` (local): `INTERNAL_API_KEY`
- `/web/.env.local` (build script): `BUILD_API_KEY`

## Health Check

### GET /health

Returns the API status and version information.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## Content Catalog Endpoints

These endpoints are used by the build script to fetch access control rules.

### GET /api/content-catalog

Get all content access rules with email allowlists.

**Response:**
```json
{
  "rules": [
    {
      "type": "notes",
      "slug": "my-note",
      "accessMode": "open",
      "description": "My note",
      "requiresPassword": false,
      "requiresEmail": false
    },
    {
      "type": "ideas",
      "slug": "secret-idea",
      "accessMode": "password",
      "description": "Secret idea",
      "requiresPassword": true,
      "requiresEmail": false
    },
    {
      "type": "publications",
      "slug": "private-pub",
      "accessMode": "email-list",
      "description": "Private publication",
      "requiresPassword": false,
      "requiresEmail": true,
      "allowedEmails": ["user1@example.com", "user2@example.com"]
    }
  ],
  "totalCount": 3,
  "timestamp": "2025-10-17T00:00:00.000Z"
}
```

### GET /api/content-catalog/:type

Get access rules for specific content type (notes, ideas, publications, pages).

**Response:**
```json
{
  "type": "notes",
  "rules": [...],
  "count": 2
}
```

## Auth Endpoints

These endpoints handle content access control and authentication.

### GET /auth/access/:type/:slug

Check what access is required for a content item.

**Response:**
```json
{
  "accessMode": "password",
  "requiresPassword": true,
  "requiresEmail": false,
  "message": "Password-protected content"
}
```

### POST /auth/verify

Verify access credentials and get token.

**Request Body:**
```json
{
  "type": "notes",
  "slug": "my-article",
  "password": "user-password",    // for password mode
  "email": "user@example.com"     // for email-list mode
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessMode": "password"
}
```

### GET /auth/content/:type/:slug

Get protected content after authentication.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "slug": "my-article",
  "title": "My Article",
  "date": "2024-01-01",
  "readTime": "5 min",
  "type": "notes",
  "excerpt": "This is a protected article...",
  "content": "# My Article\n\nContent here...",
  "html": "<h1>My Article</h1><p>Content here...</p>"
}
```

### GET /auth/password/:type/:slug

Get password for a content item (development only).

**Response:**
```json
{
  "type": "notes",
  "slug": "my-article",
  "password": "notes-my-article-abc123",
  "note": "Use this password to access the protected content"
}
```

## Internal Admin Endpoints

These endpoints are for managing access rules, email allowlists, and viewing logs.

### Access Rules Management

#### GET /api/internal/access-rules

Get all access rules. Supports query parameters:
- `type` - Filter by content type
- `mode` - Filter by access mode (open, password, email-list)

**Example:**
```bash
curl http://localhost:8787/api/internal/access-rules?type=notes \
  -H "X-API-Key: YOUR_KEY"
```

**Response:**
```json
{
  "rules": [
    {
      "id": 1,
      "type": "notes",
      "slug": "my-note",
      "access_mode": "open",
      "description": "My note",
      "password_hash": null,
      "created_at": "2025-10-17T00:00:00.000Z",
      "updated_at": "2025-10-17T00:00:00.000Z",
      "allowedEmails": []
    }
  ],
  "count": 1
}
```

#### POST /api/internal/access-rules

Create new access rule.

**Request Body:**
```json
{
  "type": "notes",
  "slug": "my-note",
  "accessMode": "open|password|email-list",
  "description": "Optional description",
  "password": "plain-password",  // Required for password mode
  "allowedEmails": ["email@example.com"]  // Required for email-list mode
}
```

#### PUT /api/internal/access-rules/:type/:slug

Update existing access rule.

**Request Body:**
```json
{
  "accessMode": "password",
  "password": "new-password",  // Optional, only if changing password
  "description": "Updated description",
  "allowedEmails": ["new@example.com"]  // Optional, for email-list mode
}
```

#### DELETE /api/internal/access-rules/:type/:slug

Delete access rule (also removes associated email allowlist entries).

### Email Allowlist Management

#### POST /api/internal/access-rules/:type/:slug/emails

Add email to allowlist.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### DELETE /api/internal/access-rules/:type/:slug/emails/:email

Remove email from allowlist.

### Analytics & Logs

#### GET /api/internal/logs

Get access logs. Supports query parameters:
- `limit` - Number of logs to return (default 100)
- `failed` - Only failed attempts (true/false)
- `type` - Filter by content type
- `slug` - Filter by content slug

#### GET /api/internal/stats

Get access statistics.

**Query Parameters:**
- `start` - Start date (ISO 8601)
- `end` - End date (ISO 8601)

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Missing required fields: type, slug, accessMode"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "API key is required. Provide X-API-Key header."
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Access rule not found for notes/my-note"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Access rule already exists for notes/my-note"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Failed to create access rule"
}
```

## Testing

### Manual Testing

Use curl or any HTTP client:

```bash
# Test health endpoint (no auth required)
curl http://localhost:8787/health

# Test content catalog
curl http://localhost:8787/api/content-catalog \
  -H "X-API-Key: d458ab3fede5cfefb6f33b8aa21cc93988052c020e59075b8bdc6d95b9847246"

# Test unauthorized access
curl http://localhost:8787/api/content-catalog
# Should return 401
```

### Run Test Suite

```bash
cd /workspaces/web-presence/api
npx tsx src/test-api-endpoints.ts
```

## Usage in Build Script

The build script will call the content catalog endpoint:

```javascript
// In /web/scripts/fetch-content-from-r2.ts

async function fetchAccessRules() {
  const response = await fetch(`${process.env.BUILD_API_URL}/api/content-catalog`, {
    headers: {
      'X-API-Key': process.env.BUILD_API_KEY
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch access rules')
  }
  
  const data = await response.json()
  return data.rules
}
```
