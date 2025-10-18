# Content Management System

This document describes the server-side content management system built with TypeScript and Hono.

## Architecture Overview

The content management system consists of:

1. **Content Sync Worker** - Processes GitHub webhooks and syncs content to R2
2. **Content Management API** - CRUD operations for content files via GitHub API
3. **R2 Storage** - Two buckets for public HTML and protected content
4. **Frontend Build** - Fetches pre-generated content from R2

## API Endpoints

### Content Sync

#### Webhook Endpoint
```
POST /api/internal/content-sync/webhook
```
- Handles GitHub webhook for automatic content sync
- Validates webhook signature
- Processes changed files and updates R2

#### Manual Sync
```
POST /api/internal/content-sync/manual
Headers: X-API-Key: your-api-key
Body: { "full_sync": true } or { "files": ["content/notes/file.md"] }
```

#### Status Check
```
GET /api/internal/content-sync/status
Headers: X-API-Key: your-api-key
```

### Content Management

#### List Content
```
GET /api/content-management/list/:type
Headers: X-API-Key: your-api-key
```

#### Get File
```
GET /api/content-management/file/:type/:slug
Headers: X-API-Key: your-api-key
```

#### Create File
```
POST /api/content-management/file
Headers: X-API-Key: your-api-key
Body: {
  "type": "notes",
  "slug": "my-note",
  "markdown": "# My Note\n\nContent here...",
  "frontmatter": { "title": "My Note", "date": "2024-01-15" },
  "commitMessage": "Add new note"
}
```

#### Update File
```
PUT /api/content-management/file/:type/:slug
Headers: X-API-Key: your-api-key
Body: {
  "markdown": "# Updated Note\n\nNew content...",
  "frontmatter": { "title": "Updated Note" },
  "sha": "abc123...",
  "commitMessage": "Update note"
}
```

#### Delete File
```
DELETE /api/content-management/file/:type/:slug
Headers: X-API-Key: your-api-key
Body: {
  "sha": "abc123...",
  "commitMessage": "Delete note"
}
```

## Environment Variables

### Required for API
- `GITHUB_TOKEN` - Personal access token for GitHub API
- `GITHUB_WEBHOOK_SECRET` - Secret for webhook validation
- `GITHUB_REPO` - Repository in format `owner/repo`
- `GITHUB_BRANCH` - Branch name (default: `main`)
- `INTERNAL_API_KEY` - API key for authentication

### R2 Buckets
- `PROTECTED_CONTENT_BUCKET` - For protected content JSON files
- `PUBLIC_CONTENT_BUCKET` - For public HTML files and metadata

## Setup Instructions

### 1. Create R2 Buckets
```bash
# Create buckets
# Development buckets
wrangler r2 bucket create web-presence-dev-protected
wrangler r2 bucket create web-presence-dev-public

# Production buckets
wrangler r2 bucket create protected-content
wrangler r2 bucket create public-content

# Update wrangler.toml (already done)
```

### 2. Set Environment Variables
```bash
# Set secrets in Cloudflare Workers
wrangler secret put GITHUB_TOKEN
wrangler secret put GITHUB_WEBHOOK_SECRET
wrangler secret put INTERNAL_API_KEY

# Set in wrangler.toml or dashboard
GITHUB_REPO=sawanruparel/web-presence
GITHUB_BRANCH=main
```

### 3. Configure GitHub Webhook
1. Go to repository Settings → Webhooks
2. Add webhook with URL: `https://your-api.workers.dev/api/internal/content-sync/webhook`
3. Content type: `application/json`
4. Secret: Use same value as `GITHUB_WEBHOOK_SECRET`
5. Events: "Just the push event"

### 4. Initial Content Sync
```bash
# Run manual sync to populate R2
curl -X POST https://your-api.workers.dev/api/internal/content-sync/manual \
  -H "X-API-Key: your-api-key" \
  -d '{"full_sync": true}'
```

## Content Flow

1. **Content Creation/Update**:
   - Use CMS API to create/update files in GitHub
   - GitHub webhook triggers content sync
   - Worker processes markdown → HTML
   - Content uploaded to R2 buckets

2. **Frontend Build**:
   - Frontend build fetches content from R2
   - Bundles HTML files into static site
   - No markdown processing in frontend

3. **Protected Content**:
   - Served via existing API endpoints
   - Requires authentication
   - Stored as JSON in R2

## File Structure

```
api/src/
├── routes/
│   ├── content-sync.ts          # Webhook and sync endpoints
│   └── content-management.ts    # CMS CRUD endpoints
├── services/
│   ├── github-service.ts        # GitHub API client
│   ├── content-processing-service.ts  # Markdown processing
│   └── r2-sync-service.ts       # R2 operations
└── types/
    └── env.ts                   # Environment types

web/scripts/
└── fetch-content-from-r2.ts     # Frontend content fetcher
```

## Benefits

✅ **Centralized Processing** - All content logic in one place
✅ **Git-Backed** - All changes tracked in version control
✅ **Automatic Sync** - Webhook-driven updates
✅ **No Stale Content** - Automatic cleanup of deleted files
✅ **TypeScript** - Full type safety
✅ **Scalable** - Cloudflare Workers auto-scale
✅ **Simple Frontend** - Just fetch pre-generated HTML

## Troubleshooting

### Webhook Not Firing
- Check webhook URL is correct
- Verify webhook secret matches
- Check GitHub webhook delivery logs

### Content Not Syncing
- Verify GitHub token has repo access
- Check Worker logs for errors
- Test manual sync endpoint

### R2 Upload Failures
- Verify R2 bucket bindings in wrangler.toml
- Check bucket permissions
- Monitor R2 usage limits

### Frontend Build Issues
- Ensure API is running during build
- Check BUILD_API_KEY environment variable
- Verify content exists in R2
