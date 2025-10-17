# API Endpoints Documentation

## Overview

The API provides two main endpoint groups:

1. **Content Catalog** (`/api/content-catalog`) - For build script to fetch access rules
2. **Internal Admin** (`/api/internal/*`) - For managing access rules and viewing logs

All endpoints require API key authentication via `X-API-Key` header.

## Authentication

All endpoints require API key in the request header:

```bash
X-API-Key: <your-api-key>
```

The API key is configured in:
- `/api/.dev.vars` (local): `INTERNAL_API_KEY`
- `/web/.env.local` (build script): `BUILD_API_KEY`

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

#### GET /api/internal/access-rules/:type/:slug

Get specific access rule.

**Example:**
```bash
curl http://localhost:8787/api/internal/access-rules/notes/my-note \
  -H "X-API-Key: YOUR_KEY"
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

**Examples:**

Open access:
```bash
curl -X POST http://localhost:8787/api/internal/access-rules \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "notes",
    "slug": "public-note",
    "accessMode": "open",
    "description": "Public note"
  }'
```

Password protected:
```bash
curl -X POST http://localhost:8787/api/internal/access-rules \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ideas",
    "slug": "secret-idea",
    "accessMode": "password",
    "password": "mysecret123",
    "description": "Secret idea"
  }'
```

Email-list protected:
```bash
curl -X POST http://localhost:8787/api/internal/access-rules \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "publications",
    "slug": "private-pub",
    "accessMode": "email-list",
    "description": "Private publication",
    "allowedEmails": ["user1@example.com", "user2@example.com"]
  }'
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

**Example:**
```bash
curl -X PUT http://localhost:8787/api/internal/access-rules/notes/my-note \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "accessMode": "password",
    "password": "newpassword123",
    "description": "Now password protected"
  }'
```

#### DELETE /api/internal/access-rules/:type/:slug

Delete access rule (also removes associated email allowlist entries).

**Example:**
```bash
curl -X DELETE http://localhost:8787/api/internal/access-rules/notes/my-note \
  -H "X-API-Key: YOUR_KEY"
```

### Email Allowlist Management

#### POST /api/internal/access-rules/:type/:slug/emails

Add email to allowlist.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Example:**
```bash
curl -X POST http://localhost:8787/api/internal/access-rules/publications/my-pub/emails \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com"}'
```

**Response:**
```json
{
  "message": "Email added to allowlist",
  "email": "newuser@example.com",
  "allowedEmails": ["user1@example.com", "user2@example.com", "newuser@example.com"]
}
```

#### DELETE /api/internal/access-rules/:type/:slug/emails/:email

Remove email from allowlist.

**Example:**
```bash
curl -X DELETE http://localhost:8787/api/internal/access-rules/publications/my-pub/emails/user1@example.com \
  -H "X-API-Key: YOUR_KEY"
```

### Analytics & Logs

#### GET /api/internal/logs

Get access logs. Supports query parameters:
- `limit` - Number of logs to return (default 100)
- `failed` - Only failed attempts (true/false)
- `type` - Filter by content type
- `slug` - Filter by content slug

**Example:**
```bash
# Get recent logs
curl http://localhost:8787/api/internal/logs?limit=50 \
  -H "X-API-Key: YOUR_KEY"

# Get failed attempts
curl http://localhost:8787/api/internal/logs?failed=true&limit=20 \
  -H "X-API-Key: YOUR_KEY"

# Get logs for specific content
curl http://localhost:8787/api/internal/logs?type=notes&slug=my-note \
  -H "X-API-Key: YOUR_KEY"
```

#### GET /api/internal/stats

Get access statistics.

**Query Parameters:**
- `start` - Start date (ISO 8601)
- `end` - End date (ISO 8601)

**Example:**
```bash
curl http://localhost:8787/api/internal/stats \
  -H "X-API-Key: YOUR_KEY"
```

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
// In /web/scripts/generate-static-content.js

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

## Next Steps

1. ✅ API endpoints created and tested
2. ⏳ Update access-control-service.ts to use database
3. ⏳ Update build script to call API
4. ⏳ Create migration script for existing config
5. ⏳ End-to-end testing
