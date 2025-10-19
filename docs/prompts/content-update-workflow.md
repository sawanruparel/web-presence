# Content Update Workflow

## Overview

This prompt provides a complete workflow for updating content and ensuring the frontend reflects the changes. It covers the content sync process, frontend build, and troubleshooting steps.

## Prerequisites

- API server running on localhost:8787
- Frontend development server available
- Correct API key from `.dev.vars` file

## Complete Workflow

### 1. Trigger Content Sync

Sync all content from source files to R2:

```bash
# Sync all content from source files to R2
curl -X POST -H "Content-Type: application/json" -H "X-API-Key: API_KEY_tu1ylu2nm7wnebxz05vfe" -d '{"full_sync": true}' http://localhost:8787/api/internal/content-sync/manual
```

**Expected Response:**
```json
{
  "message": "Manual sync completed",
  "filesProcessed": 7,
  "result": {
    "success": true,
    "processed": 7,
    "uploaded": 8,
    "deleted": 0,
    "errors": [],
    "metadata": {
      "public": 3,
      "protected": 2
    }
  }
}
```

### 2. Verify Content Upload

Check what content was uploaded to R2:

```bash
# Check R2 bucket status
curl -s -H "X-API-Key: API_KEY_tu1ylu2nm7wnebxz05vfe" http://localhost:8787/api/internal/content-sync/status | jq '.buckets'

# Check content catalog
curl -s -H "X-API-Key: API_KEY_tu1ylu2nm7wnebxz05vfe" http://localhost:8787/api/content/catalog | jq '.metadata | {note: (.note | length), idea: (.idea | length), page: (.page | length), publications: (.publications | length)}'
```

### 3. Update Frontend Content

Fetch latest content from API and update metadata:

```bash
# Navigate to frontend directory
cd /path/to/web-presence/web

# Fetch latest content from API and update metadata
npm run build:content

# Start development server
npm run dev
```

### 4. Verify Content in Frontend

Check if content metadata is updated:

```bash
# Check content counts in frontend metadata
curl -s http://localhost:5173/src/data/content-metadata.json | jq '. | {notes: (.notes | length), ideas: (.ideas | length), publications: (.publications | length), pages: (.pages | length)}'

# Check if about page is available
curl -s http://localhost:5173/src/data/content-metadata.json | jq '.pages[] | select(.slug == "about")'
```

## Expected Results

- Content sync should process 7+ files and upload them to R2
- Frontend should show updated content counts
- Home page should load without "Page not found" errors
- All content types (notes, ideas, publications, pages) should be available

## Troubleshooting

### API Key Issues
```bash
# Check correct API key from .dev.vars
grep INTERNAL_API_KEY /path/to/web-presence/api/.dev.vars
```

### Content Count Still Low
```bash
# Check source content files
ls -la /path/to/web-presence/content/ideas/
ls -la /path/to/web-presence/content/notes/
ls -la /path/to/web-presence/content/publications/
ls -la /path/to/web-presence/content/pages/
```

### Frontend Shows Old Content
```bash
# Restart dev server after content update
pkill -f "vite"
cd /path/to/web-presence/web
npm run dev
```

### Build Failures
```bash
# Check if content-metadata.json exists
ls -la /path/to/web-presence/web/src/data/content-metadata.json

# Rebuild content if missing
cd /path/to/web-presence/web
npm run build:content
```

## Technical Details

### API Endpoints Used

- `POST /api/internal/content-sync/manual` - Triggers content sync
- `GET /api/internal/content-sync/status` - Checks R2 bucket status
- `GET /api/content/catalog` - Fetches content metadata for frontend

### File Locations

- Source content: `/content/` directory
- R2 buckets: `web-presence-dev-protected` and `web-presence-dev-public`
- Frontend metadata: `web/src/data/content-metadata.json`
- Build output: `web/dist/content-metadata.json`

### Data Flow

1. Source markdown files in `/content/` → 
2. Content processing service → 
3. R2 buckets (protected/public) → 
4. API `/content/catalog` endpoint → 
5. Frontend build script → 
6. `src/data/content-metadata.json` → 
7. TypeScript imports in frontend

## Environment Variables

Required for Cloudflare Pages builds:
- `VITE_API_BASE_URL` - API URL
- `BUILD_API_KEY` - API key for authentication
- `INTERNAL_API_KEY` - Internal API key for sync operations

## Notes

- The content sync process uploads both HTML files and metadata to R2
- The frontend build script fetches metadata from the API, not directly from R2
- Content is categorized as public or protected based on access rules
- The build process is resilient to API failures and creates fallback content
