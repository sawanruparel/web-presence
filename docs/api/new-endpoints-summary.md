# New API Endpoints Summary

This document provides a comprehensive overview of the new API endpoints implemented for content sync, content management, and access control.

## Content Sync API

### Overview
The Content Sync API handles automatic content synchronization from GitHub to Cloudflare R2 storage, triggered by webhooks or manual requests.

### Endpoints

#### 1. GitHub Webhook Handler
```
POST /api/internal/content-sync/webhook
```
- **Purpose**: Process GitHub webhook events for automatic content sync
- **Authentication**: Webhook signature validation
- **Triggers**: Git pushes to main branch with content file changes
- **Response**: Sync status and processed file count

#### 2. Manual Content Sync
```
POST /api/internal/content-sync/manual
```
- **Purpose**: Manually trigger content synchronization
- **Authentication**: API key required
- **Parameters**: 
  - `full_sync` (boolean): Sync all content files
  - `files` (array): Specific files to sync
- **Response**: Sync results and processed files

#### 3. Sync Status
```
GET /api/internal/content-sync/status
```
- **Purpose**: Get current sync status and bucket information
- **Authentication**: API key required
- **Response**: Bucket counts, object listings, sync status

### Integration Points
- **GitHub API**: Fetches content files and commits changes
- **Cloudflare R2**: Stores processed content (protected/public buckets)
- **D1 Database**: Tracks access control rules for content processing

## Content Management API

### Overview
The Content Management API provides a Git-driven content management system, allowing direct manipulation of markdown files in the GitHub repository.

### Endpoints

#### 1. Content Types
```
GET /api/content-management/types
```
- **Purpose**: List available content types
- **Authentication**: API key required
- **Response**: Array of content type definitions

#### 2. List Content by Type
```
GET /api/content-management/list/:type
```
- **Purpose**: List all content files of a specific type
- **Authentication**: API key required
- **Parameters**: `type` - Content type (notes, ideas, publications, pages)
- **Response**: File list with metadata

#### 3. Get Content File
```
GET /api/content-management/file/:type/:slug
```
- **Purpose**: Get content file for editing
- **Authentication**: API key required
- **Parameters**: 
  - `type` - Content type
  - `slug` - File identifier
- **Response**: File content, frontmatter, and GitHub SHA

#### 4. Create Content File
```
POST /api/content-management/file
```
- **Purpose**: Create new content file
- **Authentication**: API key required
- **Body**: File content, frontmatter, commit message
- **Response**: Created file information

#### 5. Update Content File
```
PUT /api/content-management/file/:type/:slug
```
- **Purpose**: Update existing content file
- **Authentication**: API key required
- **Parameters**: 
  - `type` - Content type
  - `slug` - File identifier
- **Body**: Updated content, frontmatter, SHA, commit message
- **Response**: Updated file information

#### 6. Delete Content File
```
DELETE /api/content-management/file/:type/:slug
```
- **Purpose**: Delete content file
- **Authentication**: API key required
- **Parameters**: 
  - `type` - Content type
  - `slug` - File identifier
- **Body**: GitHub SHA, commit message
- **Response**: Deletion confirmation

### Integration Points
- **GitHub API**: Direct file operations (create, read, update, delete)
- **Content Processing**: Markdown to HTML conversion
- **Access Control**: Integration with access control rules

## Access Control API

### Overview
The Access Control API manages content access rules and permissions, replacing the previous JSON-based configuration with a database-backed system.

### Endpoints

#### 1. List Access Rules
```
GET /api/access-control/rules
```
- **Purpose**: List all access control rules
- **Authentication**: API key required
- **Response**: Array of access rules with pagination

#### 2. Get Access Rule
```
GET /api/access-control/rules/:type/:slug
```
- **Purpose**: Get specific access rule
- **Authentication**: API key required
- **Parameters**: 
  - `type` - Content type
  - `slug` - Content identifier
- **Response**: Access rule details

#### 3. Create/Update Access Rule
```
POST /api/access-control/rules
```
- **Purpose**: Create or update access rule
- **Authentication**: API key required
- **Body**: Rule configuration (type, slug, access mode, etc.)
- **Response**: Created/updated rule information

#### 4. Update Access Rule
```
PUT /api/access-control/rules/:type/:slug
```
- **Purpose**: Update existing access rule
- **Authentication**: API key required
- **Parameters**: 
  - `type` - Content type
  - `slug` - Content identifier
- **Body**: Updated rule configuration
- **Response**: Updated rule information

#### 5. Delete Access Rule
```
DELETE /api/access-control/rules/:type/:slug
```
- **Purpose**: Delete access rule
- **Authentication**: API key required
- **Parameters**: 
  - `type` - Content type
  - `slug` - Content identifier
- **Response**: Deletion confirmation

#### 6. Access Logs
```
GET /api/access-control/logs
```
- **Purpose**: Get access logs with pagination
- **Authentication**: API key required
- **Parameters**: 
  - `page` - Page number (default: 1)
  - `limit` - Items per page (default: 50)
- **Response**: Access logs with pagination metadata

### Access Modes

#### 1. Open Access
- Content is publicly accessible
- No authentication required
- No password or email verification

#### 2. Password Access
- Content requires a password
- Password is hashed and stored in database
- Users must provide correct password

#### 3. Email List Access
- Content requires email verification
- Email addresses stored in allowlist
- Users must provide allowed email address

### Integration Points
- **D1 Database**: Stores access rules and email allowlists
- **Content Processing**: Determines content protection level
- **R2 Storage**: Routes content to protected/public buckets
- **Authentication API**: Validates access credentials

## Database Schema

### Access Control Tables

#### content_access_rules
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

#### email_allowlist
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

#### access_logs
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

## Migration from Legacy System

### Access Control Migration
The new access control API replaces the previous JSON-based configuration:

1. **Migration Script**: `api/scripts/migrate-access-control-to-db.js`
2. **Command**: `npm run migrate:access-control`
3. **Process**: 
   - Reads existing `config/access-control.json`
   - Clears existing database data
   - Inserts all access rules
   - Sets up email allowlists
   - Verifies migration

### Content Processing Updates
- Content processing now uses database for access control
- Falls back to provided rules if database unavailable
- Maintains backward compatibility

## Security Considerations

### Authentication
- All endpoints require API key authentication
- Webhook endpoints use signature validation
- GitHub API uses token-based authentication

### Data Protection
- Passwords are hashed using SHA-256 (consider upgrading to bcrypt)
- Email addresses stored in lowercase for case-insensitive comparison
- Access attempts are logged for security monitoring

### Input Validation
- All inputs are validated and sanitized
- Required fields are enforced
- Access modes are validated against allowed values

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "Missing required fields: type, slug, accessMode"
}
```

#### 401 Unauthorized
```json
{
  "error": "Invalid API key"
}
```

#### 404 Not Found
```json
{
  "error": "Access rule not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Failed to get access rules",
  "details": "Database connection failed"
}
```

## Usage Examples

### Content Sync
```bash
# Manual full sync
curl -X POST https://your-api.workers.dev/api/internal/content-sync/manual \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"full_sync": true}'

# Sync specific files
curl -X POST https://your-api.workers.dev/api/internal/content-sync/manual \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"files": ["content/notes/test-note.md"]}'
```

### Content Management
```bash
# List content types
curl -H "X-API-Key: your-api-key" \
  https://your-api.workers.dev/api/content-management/types

# Get content file
curl -H "X-API-Key: your-api-key" \
  https://your-api.workers.dev/api/content-management/file/notes/test-note
```

### Access Control
```bash
# Create password rule
curl -X POST https://your-api.workers.dev/api/access-control/rules \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "notes",
    "slug": "secret-note",
    "accessMode": "password",
    "description": "Secret note",
    "passwordHash": "hashed-password"
  }'

# Get access logs
curl -H "X-API-Key: your-api-key" \
  "https://your-api.workers.dev/api/access-control/logs?page=1&limit=10"
```

## Testing

### Test Coverage
- **Functional Tests**: Endpoint availability and behavior
- **Data Validation Tests**: CRUD operations and data integrity
- **Integration Tests**: External service integrations
- **Error Handling**: Comprehensive error scenario testing

### Test Files
- `test_content_sync.py` - Content sync endpoint tests
- `test_content_management.py` - Content management CRUD tests
- `test_access_control_api.py` - Access control API tests
- Integration test files for external service testing

### Running Tests
```bash
cd tests/api
python scripts/run_new_tests.py
```

## Monitoring and Analytics

### Access Control Monitoring
- Complete audit trail of all access attempts
- Success/failure rates for authentication
- Popular content identification
- Security monitoring for suspicious patterns

### Content Sync Monitoring
- Sync status and bucket information
- File processing counts and errors
- GitHub API usage and rate limits
- R2 storage utilization

### Performance Metrics
- API response times
- Database query performance
- External service latency
- Error rates and types
