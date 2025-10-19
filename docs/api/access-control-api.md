# Access Control API

This document describes the access control management API for managing content permissions and access rules.

## Overview

The Access Control API provides endpoints for:
- Managing access rules for content (open, password, email-list)
- Managing email allowlists for email-list access mode
- Viewing access logs and analytics
- Database-backed access control (replaces JSON config)

## API Endpoints

### Access Rules

#### Get All Access Rules
```
GET /api/access-control/rules
Headers: X-API-Key: your-api-key
```

**Response:**
```json
{
  "rules": [
    {
      "id": 1,
      "type": "notes",
      "slug": "my-secret-note",
      "accessMode": "password",
      "description": "Secret note with password protection",
      "passwordHash": "abc123...",
      "allowedEmails": [],
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### Get Access Rule for Specific Content
```
GET /api/access-control/rules/:type/:slug
Headers: X-API-Key: your-api-key
```

**Response:**
```json
{
  "id": 1,
  "type": "notes",
  "slug": "my-secret-note",
  "accessMode": "password",
  "description": "Secret note with password protection",
  "passwordHash": "abc123...",
  "allowedEmails": [],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

#### Create or Update Access Rule
```
POST /api/access-control/rules
Headers: X-API-Key: your-api-key
Content-Type: application/json

{
  "type": "notes",
  "slug": "my-secret-note",
  "accessMode": "password",
  "description": "Secret note with password protection",
  "passwordHash": "hashed-password-here",
  "allowedEmails": ["user@example.com", "admin@example.com"]
}
```

**Response:**
```json
{
  "message": "Access rule created/updated successfully",
  "ruleId": 1,
  "type": "notes",
  "slug": "my-secret-note"
}
```

#### Update Access Rule
```
PUT /api/access-control/rules/:type/:slug
Headers: X-API-Key: your-api-key
Content-Type: application/json

{
  "accessMode": "email-list",
  "description": "Updated description",
  "password": "new-password",
  "allowedEmails": ["user@example.com", "admin@example.com"]
}
```

**Response:**
```json
{
  "message": "Access rule updated successfully",
  "ruleId": 1,
  "type": "notes",
  "slug": "my-secret-note"
}
```

#### Delete Access Rule
```
DELETE /api/access-control/rules/:type/:slug
Headers: X-API-Key: your-api-key
```

**Response:**
```json
{
  "message": "Access rule deleted successfully",
  "type": "notes",
  "slug": "my-secret-note"
}
```

### Access Logs

#### Get Access Logs
```
GET /api/access-control/logs?page=1&limit=50
Headers: X-API-Key: your-api-key
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "type": "notes",
      "slug": "my-secret-note",
      "accessGranted": true,
      "credentialType": "password",
      "credentialValue": "user@example.com",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2024-01-15T10:00:00Z",
      "accessMode": "password"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Access Modes

### Open Access
- Content is publicly accessible
- No authentication required
- No password or email verification needed

### Password Access
- Content requires a password
- Password is hashed and stored in database
- Users must provide correct password to access

### Email List Access
- Content requires email verification
- Email addresses are stored in allowlist
- Users must provide an allowed email address

## Database Schema

### content_access_rules
```sql
CREATE TABLE content_access_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,                    -- 'notes', 'publications', 'ideas', 'pages'
  slug TEXT NOT NULL,                    -- unique identifier within type
  access_mode TEXT NOT NULL DEFAULT 'open', -- 'open', 'password', 'email-list'
  description TEXT,                      -- human-readable description
  password_hash TEXT,                    -- bcrypt hash of password
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(type, slug)
);
```

### email_allowlist
```sql
CREATE TABLE email_allowlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  access_rule_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(access_rule_id) REFERENCES content_access_rules(id) ON DELETE CASCADE,
  UNIQUE(access_rule_id, email)
);
```

### access_logs
```sql
CREATE TABLE access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  access_rule_id INTEGER,
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  access_granted BOOLEAN NOT NULL,
  credential_type TEXT,                  -- 'password', 'email', 'none'
  credential_value TEXT,                 -- email address only (NOT password)
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(access_rule_id) REFERENCES content_access_rules(id) ON DELETE SET NULL
);
```

## Migration from JSON Config

To migrate from the existing configuration to the database:

```bash
# Run the migration script
cd api
npm run migrate:access-control
```

This will:
1. Read the existing database rules
2. Clear existing database data
3. Insert all access rules into the database
4. Set up email allowlists
5. Verify the migration

## Authentication

All endpoints require the `X-API-Key` header with a valid API key:

```bash
curl -H "X-API-Key: your-api-key" \
  https://your-api.workers.dev/api/access-control/rules
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields: type, slug, accessMode"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid API key"
}
```

### 404 Not Found
```json
{
  "error": "Access rule not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to get access rules",
  "details": "Database connection failed"
}
```

## Usage Examples

### Create Password-Protected Content
```bash
curl -X POST https://your-api.workers.dev/api/access-control/rules \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "notes",
    "slug": "secret-note",
    "accessMode": "password",
    "description": "My secret note",
    "passwordHash": "hashed-password-here"
  }'
```

### Create Email-List Protected Content
```bash
curl -X POST https://your-api.workers.dev/api/access-control/rules \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ideas",
    "slug": "beta-idea",
    "accessMode": "email-list",
    "description": "Beta tester access only",
    "allowedEmails": ["beta@example.com", "tester@example.com"]
  }'
```

### Update Access Mode
```bash
curl -X PUT https://your-api.workers.dev/api/access-control/rules/notes/secret-note \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "accessMode": "open",
    "description": "Now publicly accessible"
  }'
```

### View Access Logs
```bash
curl -H "X-API-Key: your-api-key" \
  "https://your-api.workers.dev/api/access-control/logs?page=1&limit=10"
```

## Integration with Content Sync

The access control system integrates with the content sync process:

1. **Content Processing**: When content is processed, the system checks the database for access rules
2. **Access Determination**: Content is marked as protected based on database rules
3. **R2 Storage**: Protected content goes to `protected-content/` bucket, public content goes to `public-content/` bucket
4. **API Serving**: Protected content is served via the existing authentication API

## Security Considerations

- **Password Hashing**: Passwords are hashed using SHA-256 (consider upgrading to bcrypt in production)
- **Email Storage**: Email addresses are stored in lowercase for case-insensitive comparison
- **Audit Logging**: All access attempts are logged for security monitoring
- **API Key Protection**: All endpoints require valid API key authentication
- **Input Validation**: All inputs are validated and sanitized

## Monitoring and Analytics

The access control system provides:

- **Access Logs**: Complete audit trail of all access attempts
- **Success/Failure Rates**: Track authentication success rates
- **Popular Content**: Identify most accessed protected content
- **Security Monitoring**: Detect suspicious access patterns
- **User Analytics**: Track which users access which content

Use the `/api/access-control/logs` endpoint to retrieve and analyze access patterns.
