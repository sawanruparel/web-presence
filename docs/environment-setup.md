# Environment Variables Setup

This document explains the environment variable configuration for the Web Presence project.

## Overview

The project has two main components:
- **API** (Backend): Cloudflare Workers with D1 database
- **Frontend**: React application with Vite

Each component has separate environment files for local development and production.

## Build Process Requirements

The frontend build process requires `BUILD_API_KEY` and `VITE_API_BASE_URL` environment variables to:
- Fetch access control rules from the API during build
- Generate static content with proper access restrictions
- Ensure the build process can authenticate with the backend API

**Important Security Note**: 
- `VITE_API_BASE_URL`: Uses `VITE_` prefix - safe to expose to client (just a URL)
- `BUILD_API_KEY`: **DO NOT use `VITE_` prefix** - sensitive, build-only, should NOT be exposed to client bundle
- `BUILD_API_URL`: **Optional** - if not set, build script falls back to `VITE_API_BASE_URL`. Use this if build-time API URL differs from runtime API URL (e.g., build against staging while runtime uses production)
- Build scripts (Node.js) have access to ALL environment variables via `process.env`, not just `VITE_` prefixed ones
- Only `VITE_` prefixed variables are exposed to client code via `import.meta.env` (Vite's security feature)

## API Key Synchronization

The project uses two API keys that must be identical:

- **`INTERNAL_API_KEY`**: Used by the API server (backend) to validate incoming requests
- **`BUILD_API_KEY`**: Used by the build script (frontend) to authenticate with the API

These keys serve the same purpose but are stored in different locations and used by different components. The `BUILD_API_KEY` does NOT use the `VITE_` prefix to prevent it from being exposed to the client bundle.

### Synchronization Scripts

Use the provided scripts to manage API key synchronization:

```bash
# Check API key synchronization status
npm run sync:api-keys

# Fix mismatches automatically
npm run sync:api-keys:fix

# Sync to Cloudflare services
npm run sync:api-keys:sync

# Fix and sync in one command
npm run sync:api-keys:all
```

### Individual Service Scripts

```bash
# Sync API environment to Cloudflare Workers
cd api && npm run sync:env

# Sync Web environment to Cloudflare Pages
cd web && npm run sync:env
```

The synchronization scripts ensure that `INTERNAL_API_KEY` and `BUILD_API_KEY` are always identical across all environments.

**See [Environment Variables Analysis](./ENVIRONMENT_VARIABLES_ANALYSIS.md) for detailed explanation of why `BUILD_API_KEY` does NOT use the `VITE_` prefix.**

## R2 Storage Setup

The project uses Cloudflare R2 for storing protected content. This requires:

### 1. Create R2 Bucket

Create the R2 bucket using the Cloudflare dashboard or CLI:

```bash
# Using wrangler CLI (recommended)
wrangler r2 bucket create protected-content

# Or create via Cloudflare Dashboard:
# 1. Go to R2 Object Storage in your Cloudflare dashboard
# 2. Click "Create bucket"
# 3. Name it "protected-content"
# 4. Choose your preferred location
```

### 2. Configure Wrangler

The R2 bucket is configured in `api/wrangler.toml`:

```toml
[[r2_buckets]]
binding = "PROTECTED_CONTENT_BUCKET"
bucket_name = "protected-content"
```

### 3. Authentication Requirements

**For Build Process:**
- Must be logged in to wrangler: `wrangler login`
- Uses account ID from `api/wrangler.toml`
- No additional environment variables needed

**For API Runtime:**
- R2 bucket binding provides direct access
- No additional configuration needed

### 4. Environment Separation

The project uses separate R2 buckets for each environment to ensure:
- **Development Safety**: Local testing cannot corrupt production content
- **Isolation**: Each environment has its own content storage
- **Testing**: Can safely test full content sync pipeline locally
- **Consistency**: Matches the database separation pattern (local vs production DB)

### 5. Security

- R2 bucket is private (not publicly accessible)
- Content only accessible via API with proper authentication
- Protected content existence is not leaked through metadata

## CORS Configuration

The API uses environment variables for CORS configuration to support different frontend URLs in different environments:

- **`FRONTEND_URL`**: Primary frontend URL for references and redirects
- **`CORS_ORIGINS`**: Comma-separated list of allowed origins for CORS requests

**⚠️ Security Warning**: The `CORS_ORIGINS` environment variable is **required** in production. If not set, the API will only allow `http://localhost:5173` by default, which is secure for local development but will block all production frontend requests.

**Local Development Example:**
```bash
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

**Production Example:**
```bash
FRONTEND_URL=https://your-actual-frontend-domain.com
CORS_ORIGINS=https://your-actual-frontend-domain.com,https://www.your-actual-frontend-domain.com
```

**Security Best Practices:**
- Never use placeholder domains like `your-frontend-domain.com` in production
- Always set `CORS_ORIGINS` explicitly in production environments
- Use HTTPS URLs in production
- Regularly audit and update allowed origins

## API Environment Files

### Local Development (`.dev.vars`)
Used by Wrangler for local development with `npm run dev` in the `api/` directory.

```bash
# Internal API Key for admin operations (local development)
INTERNAL_API_KEY=API_KEY_tu1ylu2nm7wnebxz05vfe

# Frontend URL for CORS and references (local development)
FRONTEND_URL=http://localhost:5173

# CORS Origins (comma-separated list of allowed origins)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

**Note**: Cloudflare Workers automatically handles:
- `DATABASE_ID`: Configured in `wrangler.toml`
- `NODE_ENV`: Set automatically by Wrangler
- Other system variables: Handled by the Cloudflare Workers runtime

### Production (Cloudflare Workers Secrets)
These values are set as secrets in Cloudflare Workers, not as environment files.

```bash
# Set these via Cloudflare Workers secrets:
npx wrangler secret put INTERNAL_API_KEY
npx wrangler secret put FRONTEND_URL
npx wrangler secret put CORS_ORIGINS

# Database configuration is in wrangler.toml
# Environment is automatically set by Cloudflare Workers
```

## Frontend Environment Files

### Local Development (`web/.env.local`)
Used when running the frontend locally with `npm run dev` in the `web/` directory.

```bash
# API Base URL - points to local API server
VITE_API_BASE_URL=http://localhost:8787

# Development mode flag
VITE_DEV_MODE=true

# Environment indicator
VITE_NODE_ENV=development

# Enable debug logging
VITE_DEBUG=true

# Build API Configuration (required for build process)
BUILD_API_KEY=API_KEY_tu1ylu2nm7wnebxz05vfe
BUILD_API_URL=http://localhost:8787
```

### Production (`web/.env.production`)
Used when building the frontend for production deployment.

```bash
# API Base URL - points to production API server
VITE_API_BASE_URL=https://web-presence-api.quoppo.workers.dev

# Production mode flag
VITE_DEV_MODE=false

# Environment indicator
VITE_NODE_ENV=production

# Disable debug logging
VITE_DEBUG=false

# Build API Configuration (required for build process)
BUILD_API_KEY=d458ab3fede5cfefb6f33b8aa21cc93988052c020e59075b8bdc6d95b9847246
BUILD_API_URL=https://web-presence-api.quoppo.workers.dev
```

## Environment File Priority

### API (Cloudflare Workers)
1. **Local Development**: Uses `api/.dev.vars` (Wrangler's local env file)
2. **Production**: Uses Cloudflare Workers secrets (set via `npx wrangler secret put`)
3. **Database**: Configured in `wrangler.toml` (no env file needed)

### Frontend (Vite)
1. **Local Development**: Uses `web/.env.local`
2. **Production Build**: Uses `web/.env.production`
3. **Fallback**: Uses `web/.env` if others don't exist

## Setup Instructions

### For Local Development

1. **API Setup**:
   ```bash
   cd api
   # Copy .dev.vars.example to .dev.vars and update values
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars with your values
   npm run dev
   ```

2. **Frontend Setup**:
   ```bash
   cd web
   # The .env.local file is already configured
   npm run dev
   ```

3. **Synchronize API Keys**:
   ```bash
   # Check if API keys are synchronized
   npm run sync:api-keys
   
   # Fix any mismatches automatically
   npm run sync:api-keys:fix
   ```

### For Production Deployment

1. **Synchronize API Keys**:
   ```bash
   # Fix any mismatches and sync to Cloudflare services
   npm run sync:api-keys:all
   ```

2. **API Deployment**:
   ```bash
   cd api
   # Deploy (secrets already synced)
   npm run deploy
   ```

3. **Frontend Deployment**:
   ```bash
   cd web
   # Build with production environment
   npm run build
   # Deploy the dist/ folder to your hosting service
   ```

### Syncing Environment Variables to Cloudflare Pages

For Cloudflare Pages deployment, you need to sync your local environment variables to Pages as build-time environment variables (not runtime secrets).

#### Prerequisites

1. **Login to Wrangler**:
   ```bash
   npx wrangler login
   ```

#### Sync Process

1. **Create production environment file** (optional):
   ```bash
   # Create .env.production with production-specific values
   cp web/.env.local web/.env.production
   # Edit web/.env.production to use production URLs
   ```

2. **Run the sync script**:
   ```bash
   cd web
   npm run sync:env
   ```

   This will:
   - Read variables from `web/.env.production` (if it exists) or `web/.env.local`
   - Upload them to Cloudflare Pages as build-time environment variables
   - Use Wrangler's authentication to access the Cloudflare API

#### Variables Synced

The script syncs these variables from your environment file (`.env.production` or `.env.local`):
- `BUILD_API_KEY` - API key for build-time authentication
- `BUILD_API_URL` - API endpoint for build process
- `VITE_API_BASE_URL` - API endpoint for runtime
- `VITE_DEV_MODE` - Development mode flag

#### Environment File Priority

1. **`.env.production`** - Used if it exists (recommended for production deployments)
2. **`.env.local`** - Fallback if `.env.production` doesn't exist

#### After Syncing

1. **Trigger a new deployment** in Cloudflare Pages
2. **Or push a new commit** to trigger automatic deployment
3. **Check build logs** to verify variables are available during build

#### Troubleshooting Sync Issues

- **Not logged in**: Run `npx wrangler login` and follow the authentication flow
- **404 Not Found**: Verify the project name "web-presence" exists in your account
- **Missing variables**: Ensure variables exist in your `.env.local` file

## Environment Variables Reference

### API Variables

| Variable | Local | Production | Purpose |
|----------|-------|------------|---------|
| `INTERNAL_API_KEY` | `.dev.vars` | Cloudflare Secret | Admin API authentication |
| `FRONTEND_URL` | `.dev.vars` | Cloudflare Secret | Frontend URL for CORS and references |
| `CORS_ORIGINS` | `.dev.vars` | Cloudflare Secret | Comma-separated allowed origins |
| `DATABASE_ID` | `wrangler.toml` | `wrangler.toml` | D1 database identifier |
| `NODE_ENV` | Auto (Wrangler) | Auto (Cloudflare) | Environment indicator |

### Frontend Variables

| Variable | Local | Production | Purpose |
|----------|-------|------------|---------|
| `VITE_API_BASE_URL` | `http://localhost:8787` | `https://web-presence-api.quoppo.workers.dev` | API endpoint URL (used at runtime and build-time, safe to expose) |
| `VITE_DEV_MODE` | `true` | `false` | Development mode flag |
| `VITE_NODE_ENV` | `development` | `production` | Environment indicator |
| `VITE_DEBUG` | `true` | `false` | Debug logging flag |
| `BUILD_API_KEY` | `API_KEY_tu1ylu2nm7wnebxz05vfe` | `d458ab3fede5cfefb6f33b8aa21cc93988052c020e59075b8bdc6d95b9847246` | Build-time API authentication (NO VITE_ prefix - sensitive, build-only, not exposed to client) |
| `BUILD_API_URL` | `http://localhost:8787` (optional) | `https://web-presence-api.quoppo.workers.dev` (optional) | Build-time API URL (optional - falls back to VITE_API_BASE_URL if not set) |

## API Key Synchronization Workflow

### Quick Commands

```bash
# Check synchronization status
npm run sync:api-keys

# Fix mismatches and sync to services
npm run sync:api-keys:all
```

### Detailed Workflow

1. **Check Status**:
   ```bash
   npm run sync:api-keys
   ```
   This will show you the current status of both API keys and whether they match.

2. **Fix Mismatches** (if needed):
   ```bash
   npm run sync:api-keys:fix
   ```
   This will automatically synchronize mismatched keys.

3. **Sync to Services**:
   ```bash
   npm run sync:api-keys:sync
   ```
   This will upload the keys to both Cloudflare Workers and Pages.

4. **Complete Workflow**:
   ```bash
   npm run sync:api-keys:all
   ```
   This combines fixing and syncing in one command.

### Validation

After synchronization, verify the keys are working:

```bash
# Test API endpoint
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:8787/api/content-catalog

# Check Cloudflare Workers secrets
cd api && npx wrangler secret list

# Check Cloudflare Pages environment
cd web && npm run sync:env
```

## Troubleshooting

### API Issues
- **Local**: Check `api/.dev.vars` exists and has correct values
- **Production**: Verify secrets are set with `npx wrangler secret list`

### Frontend Issues
- **Local**: Check `web/.env.local` exists and points to local API
- **Production**: Check `web/.env.production` exists and points to production API

### Common Problems
1. **API not accessible**: Check `VITE_API_BASE_URL` in frontend env files
2. **Authentication fails**: Check `INTERNAL_API_KEY` in API
3. **API keys don't match**: Run `npm run sync:api-keys:fix` to synchronize
4. **Database errors**: Check `DATABASE_ID` matches in both env and wrangler.toml
5. **CORS errors in production**: Check `CORS_ORIGINS` is set correctly in Cloudflare Workers secrets
6. **Frontend blocked by CORS**: Verify the frontend domain is included in `CORS_ORIGINS`
7. **Build fails with API key error**: Ensure `BUILD_API_KEY` matches `INTERNAL_API_KEY`

## Security Notes

- **Never commit secrets** to version control
- **Use strong secrets** in production
- **Rotate secrets** regularly
- **Local secrets** are for development only
- **CORS Origins**: Always set `CORS_ORIGINS` explicitly in production - never rely on defaults
- **No Placeholder Domains**: Never use placeholder domains like `your-frontend-domain.com` in production
- **HTTPS in Production**: Always use HTTPS URLs for production CORS origins
