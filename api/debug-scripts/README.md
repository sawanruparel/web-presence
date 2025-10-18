# Debug Scripts

This folder contains debugging utilities for testing backend functionality via API endpoints. These are permanent debugging tools for development and troubleshooting.

## Scripts

- **`access-control-debug.ts`** - Test access control service and authentication flows
- **`content-processing-debug.ts`** - Test content processing and sync functionality  
- **`database-debug.ts`** - Test database connections and queries
- **`access-control-api.sh`** - Comprehensive bash test suite for access control

## Usage

### TypeScript Scripts
```bash
# Run individual debug scripts
npx tsx debug-scripts/access-control-debug.ts
npx tsx debug-scripts/content-processing-debug.ts
npx tsx debug-scripts/database-debug.ts
```

### Bash Scripts
```bash
# Run bash test suite
chmod +x debug-scripts/access-control-api.sh
./debug-scripts/access-control-api.sh
```

## API Endpoints Tested

### Health & Auth
- `GET /health` - Health check
- `GET /auth/access/:type/:slug` - Access requirements
- `POST /auth/verify` - Verify credentials (password/email/open)

### Content Catalog
- `GET /api/content-catalog` - All access rules
- `GET /api/content-catalog/:type` - Rules by type

### Internal Admin (requires API key)
- `GET /api/internal/access-rules` - All rules
- `GET /api/internal/access-rules/:type/:slug` - Specific rule
- `POST /api/internal/access-rules` - Create rule
- `PUT /api/internal/access-rules/:type/:slug` - Update rule
- `DELETE /api/internal/access-rules/:type/:slug` - Delete rule
- `GET /api/internal/logs` - Access logs
- `GET /api/internal/stats` - Access statistics

### Content Sync (requires API key)
- `POST /api/internal/content-sync/manual` - Manual sync
- `GET /api/internal/content-sync/status` - Sync status

## Environment

Make sure the API server is running on `http://localhost:8787` before running these scripts.

## API Key

Most internal endpoints require an API key. Update the `API_KEY` constant in each script with the correct key from your environment.
