# Environment Setup Guide

This guide covers the complete environment setup for the Web Presence API, including all required environment variables, R2 buckets, D1 database, and GitHub integration.

## Required Environment Variables

### Local Development (`.dev.vars`)

```bash
# Internal API Key for admin operations
INTERNAL_API_KEY=API_KEY_tu1ylu2nm7wnebxz05vfe

# Frontend URL for CORS and references
FRONTEND_URL=http://localhost:5173

# CORS Origins (comma-separated list)
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174

# GitHub Integration
GITHUB_TOKEN=your_github_token_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
GITHUB_REPO=your-username/your-repo
GITHUB_BRANCH=main

# R2 Bucket Names (for reference)
PROTECTED_CONTENT_BUCKET_NAME=protected-content
PUBLIC_CONTENT_BUCKET_NAME=public-content
```

### Production (Cloudflare Workers Secrets)

Set these using the Wrangler CLI:

```bash
# Set each secret individually
npx wrangler secret put INTERNAL_API_KEY
npx wrangler secret put FRONTEND_URL
npx wrangler secret put CORS_ORIGINS
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put GITHUB_WEBHOOK_SECRET
npx wrangler secret put GITHUB_REPO
npx wrangler secret put GITHUB_BRANCH
```

## GitHub Integration Setup

### 1. Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
4. Copy the generated token

### 2. Configure Webhook Secret

1. Go to your repository Settings → Webhooks
2. Add webhook with URL: `https://your-api.workers.dev/api/internal/content-sync/webhook`
3. Select "Just the push event"
4. Generate a webhook secret and copy it

### 3. Update Environment Variables

```bash
# In .dev.vars or via wrangler secrets
GITHUB_TOKEN=ghp_your_token_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
GITHUB_REPO=your-username/web-presence
GITHUB_BRANCH=main
```

## R2 Bucket Setup

### 1. Create R2 Buckets

The project uses separate R2 buckets for development and production environments to ensure local testing cannot affect production content.

**Option A: Automated Setup (Recommended)**
```bash
# Run the setup script to create all required buckets
./api/scripts/setup-r2-buckets.sh
```

**Option B: Manual Setup**
```bash
# Development buckets
npx wrangler r2 bucket create web-presence-dev-protected
npx wrangler r2 bucket create web-presence-dev-public

# Production buckets
npx wrangler r2 bucket create protected-content
npx wrangler r2 bucket create public-content
```

### 2. Verify Bucket Configuration

The `wrangler.toml` file is configured with environment-specific bucket bindings:

**Development Environment (default):**
```toml
[[r2_buckets]]
binding = "PROTECTED_CONTENT_BUCKET"
bucket_name = "web-presence-dev-protected"

[[r2_buckets]]
binding = "PUBLIC_CONTENT_BUCKET"
bucket_name = "web-presence-dev-public"
```

**Production Environment:**
```toml
[env.production]
[[env.production.r2_buckets]]
binding = "PROTECTED_CONTENT_BUCKET"
bucket_name = "protected-content"

[[env.production.r2_buckets]]
binding = "PUBLIC_CONTENT_BUCKET"
bucket_name = "public-content"
```

### 3. Test Bucket Access

```bash
# List all buckets
npx wrangler r2 bucket list

# Test development bucket access
npx wrangler r2 object list --bucket web-presence-dev-protected
npx wrangler r2 object list --bucket web-presence-dev-public

# Test production bucket access
npx wrangler r2 object list --bucket protected-content
npx wrangler r2 object list --bucket public-content
```

### 4. Environment Separation

**Development Environment:**
- Uses `web-presence-dev-*` buckets
- Safe for testing content sync and access rules
- Cannot affect production content
- Accessed via `npm run dev` or `wrangler dev`

**Production Environment:**
- Uses `protected-content` and `public-content` buckets
- Contains live production content
- Accessed via `npm run deploy` or `wrangler deploy --env production`

## D1 Database Setup

### 1. Create D1 Database

```bash
# Create local development database
npx wrangler d1 create web-presence-db-local

# Create production database
npx wrangler d1 create web-presence-db
```

### 2. Run Database Migrations

This project uses a **custom migration system** with `wrangler d1 execute` (not Cloudflare's built-in `wrangler d1 migrations apply`). The custom system tracks migrations in the `schema_migrations` table with rich metadata.

**Recommended: Use the migration runner**

```bash
cd api

# Run migrations for local database
npm run migrate:local

# Run migrations for production database
npm run migrate:remote
```

**Alternative: Manual migration**

```bash
# Run migrations for local database (in order)
npx wrangler d1 execute web-presence-db-local --local --file=./migrations/0000_migrations_table.sql
npx wrangler d1 execute web-presence-db-local --local --file=./migrations/0001_initial_schema.sql
npx wrangler d1 execute web-presence-db-local --local --file=./migrations/0002_build_logs.sql

# Run migrations for production database (in order)
npx wrangler d1 execute web-presence-db --remote --file=./migrations/0000_migrations_table.sql
npx wrangler d1 execute web-presence-db --remote --file=./migrations/0001_initial_schema.sql
npx wrangler d1 execute web-presence-db --remote --file=./migrations/0002_build_logs.sql
```

**Verify migrations:**

```bash
# Check migration status
npm run migrate:verify:local   # Local database
npm run migrate:verify:remote   # Production database

# Or diagnose database state
npm run diagnose:db:local
npm run diagnose:db:remote
```

**Note:** This project uses `schema_migrations` (custom tracking table) as the single source of truth. Cloudflare's `d1_migrations` table is not used and has been removed.

### 3. Migrate Access Control Data

```bash
# Migrate existing access control data to database
npm run migrate:access-control
```

## Environment-Specific Configuration

### Development Environment

```bash
# .dev.vars
INTERNAL_API_KEY=API_KEY_tu1ylu2nm7wnebxz05vfe
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000
GITHUB_TOKEN=your_dev_token
GITHUB_WEBHOOK_SECRET=your_dev_webhook_secret
GITHUB_REPO=your-username/web-presence
GITHUB_BRANCH=main
```

### Staging Environment

```bash
# Set via wrangler secrets
npx wrangler secret put INTERNAL_API_KEY --env staging
npx wrangler secret put FRONTEND_URL --env staging
npx wrangler secret put CORS_ORIGINS --env staging
npx wrangler secret put GITHUB_TOKEN --env staging
npx wrangler secret put GITHUB_WEBHOOK_SECRET --env staging
npx wrangler secret put GITHUB_REPO --env staging
npx wrangler secret put GITHUB_BRANCH --env staging
```

### Production Environment

```bash
# Set via wrangler secrets
npx wrangler secret put INTERNAL_API_KEY --env production
npx wrangler secret put FRONTEND_URL --env production
npx wrangler secret put CORS_ORIGINS --env production
npx wrangler secret put GITHUB_TOKEN --env production
npx wrangler secret put GITHUB_WEBHOOK_SECRET --env production
npx wrangler secret put GITHUB_REPO --env production
npx wrangler secret put GITHUB_BRANCH --env production
```

## Verification Steps

### 1. Test Local Development

```bash
# Start local development server
npm run dev

# Test health endpoint
curl http://localhost:8787/health

# Test content sync status (requires API key)
curl -H "X-API-Key: API_KEY_tu1ylu2nm7wnebxz05vfe" \
  http://localhost:8787/api/internal/content-sync/status
```

### 2. Test GitHub Integration

```bash
# Test manual content sync
curl -X POST http://localhost:8787/api/internal/content-sync/manual \
  -H "X-API-Key: API_KEY_tu1ylu2nm7wnebxz05vfe" \
  -H "Content-Type: application/json" \
  -d '{"full_sync": true}'
```

### 3. Test R2 Bucket Access

```bash
# List objects in protected bucket
npx wrangler r2 object list --bucket protected-content

# List objects in public bucket
npx wrangler r2 object list --bucket public-content
```

### 4. Test Database Access

```bash
# Query access control rules
npx wrangler d1 execute web-presence-db-local \
  --command="SELECT * FROM content_access_rules LIMIT 5"
```

## Troubleshooting

### Common Issues

#### 1. GitHub API Errors
```bash
# Check token permissions
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user

# Verify repository access
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO
```

#### 2. R2 Bucket Access Issues
```bash
# Check bucket exists
npx wrangler r2 bucket list

# Test bucket access
npx wrangler r2 object list --bucket protected-content
```

#### 3. Database Connection Issues
```bash
# Check database exists
npx wrangler d1 list

# Test database connection
npx wrangler d1 execute web-presence-db-local \
  --command="SELECT 1 as test"
```

#### 4. Environment Variable Issues
```bash
# Check local variables
cat .dev.vars

# Check production secrets
npx wrangler secret list
```

### Debug Mode

Enable debug logging by setting:

```bash
# In .dev.vars
DEBUG=true

# Or via wrangler secret
npx wrangler secret put DEBUG
```

## Security Considerations

### 1. API Key Security
- Use strong, unique API keys
- Rotate keys regularly
- Never commit keys to version control
- Use different keys for different environments

### 2. GitHub Token Security
- Use minimal required scopes
- Set expiration dates
- Monitor token usage
- Revoke unused tokens

### 3. Webhook Security
- Use strong webhook secrets
- Validate webhook signatures
- Monitor webhook delivery
- Implement rate limiting

### 4. Database Security
- Use least privilege access
- Enable audit logging
- Regular security updates
- Backup data regularly

## Monitoring and Alerts

### 1. API Monitoring
- Monitor response times
- Track error rates
- Set up alerts for failures
- Monitor external service dependencies

### 2. GitHub Integration Monitoring
- Monitor webhook delivery
- Track API rate limits
- Monitor repository access
- Alert on authentication failures

### 3. R2 Storage Monitoring
- Monitor storage usage
- Track request patterns
- Monitor costs
- Alert on unusual activity

### 4. Database Monitoring
- Monitor query performance
- Track connection usage
- Monitor storage growth
- Alert on errors

## Backup and Recovery

### 1. Database Backups
```bash
# Create database backup
npx wrangler d1 export web-presence-db --output=backup.sql

# Restore from backup
npx wrangler d1 execute web-presence-db --file=backup.sql
```

### 2. R2 Bucket Backups
```bash
# List all objects
npx wrangler r2 object list --bucket protected-content > protected-backup.txt
npx wrangler r2 object list --bucket public-content > public-backup.txt
```

### 3. Configuration Backups
- Backup `wrangler.toml`
- Backup environment variable documentation
- Backup migration scripts
- Document all custom configurations
