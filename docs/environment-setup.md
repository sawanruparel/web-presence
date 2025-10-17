# Environment Variables Setup

This document explains the environment variable configuration for the Web Presence project.

## Overview

The project has two main components:
- **API** (Backend): Cloudflare Workers with D1 database
- **Frontend**: React application with Vite

Each component has separate environment files for local development and production.

## Build Process Requirements

The frontend build process requires `BUILD_API_KEY` and `BUILD_API_URL` environment variables to:
- Fetch access control rules from the API during build
- Generate static content with proper access restrictions
- Ensure the build process can authenticate with the backend API

**Note**: `BUILD_API_URL` can be the same as `VITE_API_BASE_URL` in most cases, but they serve different purposes:
- `VITE_API_BASE_URL`: Used by the frontend application at runtime
- `BUILD_API_URL`: Used by the build process to fetch content metadata

## API Environment Files

### Local Development (`api/.env.local`)
Used when running the API locally with `npm run dev` in the `api/` directory.

```bash
# JWT Secret for signing tokens
JWT_SECRET=dev-jwt-secret-key-change-in-production-12345

# Internal API Key for admin operations
INTERNAL_API_KEY=d458ab3fede5cfefb6f33b8aa21cc93988052c020e59075b8bdc6d95b9847246


# Database ID for local D1 database
DATABASE_ID=22aaa0c4-8060-4417-9649-9cc8cafa7e06

# Environment indicator
NODE_ENV=development
```

### Production (`api/.env.production`)
These values are set as secrets in Cloudflare Workers, not as environment files.

```bash
# Set these via Cloudflare Workers secrets:
npx wrangler secret put JWT_SECRET
npx wrangler secret put INTERNAL_API_KEY
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
2. **Production**: Uses Cloudflare Workers secrets

### Frontend (Vite)
1. **Local Development**: Uses `web/.env.local`
2. **Production Build**: Uses `web/.env.production`
3. **Fallback**: Uses `web/.env` if others don't exist

## Setup Instructions

### For Local Development

1. **API Setup**:
   ```bash
   cd api
   # The .dev.vars file is already configured
   npm run dev
   ```

2. **Frontend Setup**:
   ```bash
   cd web
   # The .env.local file is already configured
   npm run dev
   ```

### For Production Deployment

1. **API Deployment**:
   ```bash
   cd api
   # Set secrets in Cloudflare Workers
   npx wrangler secret put JWT_SECRET
   npx wrangler secret put INTERNAL_API_KEY
   
   # Deploy
   npm run deploy
   ```

2. **Frontend Deployment**:
   ```bash
   cd web
   # Build with production environment
   npm run build
   # Deploy the dist/ folder to your hosting service
   ```

## Environment Variables Reference

### API Variables

| Variable | Local | Production | Purpose |
|----------|-------|------------|---------|
| `JWT_SECRET` | `.dev.vars` | Cloudflare Secret | JWT token signing |
| `INTERNAL_API_KEY` | `.dev.vars` | Cloudflare Secret | Admin API authentication |
| `DATABASE_ID` | `.dev.vars` | `wrangler.toml` | D1 database identifier |

### Frontend Variables

| Variable | Local | Production | Purpose |
|----------|-------|------------|---------|
| `VITE_API_BASE_URL` | `http://localhost:8787` | `https://web-presence-api.quoppo.workers.dev` | API endpoint URL |
| `VITE_DEV_MODE` | `true` | `false` | Development mode flag |
| `VITE_NODE_ENV` | `development` | `production` | Environment indicator |
| `VITE_DEBUG` | `true` | `false` | Debug logging flag |
| `BUILD_API_KEY` | `API_KEY_tu1ylu2nm7wnebxz05vfe` | `d458ab3fede5cfefb6f33b8aa21cc93988052c020e59075b8bdc6d95b9847246` | Build-time API authentication |
| `BUILD_API_URL` | `http://localhost:8787` | `https://web-presence-api.quoppo.workers.dev` | Build-time API endpoint |

## Troubleshooting

### API Issues
- **Local**: Check `api/.dev.vars` exists and has correct values
- **Production**: Verify secrets are set with `npx wrangler secret list`

### Frontend Issues
- **Local**: Check `web/.env.local` exists and points to local API
- **Production**: Check `web/.env.production` exists and points to production API

### Common Problems
1. **API not accessible**: Check `VITE_API_BASE_URL` in frontend env files
2. **Authentication fails**: Check `JWT_SECRET` and `INTERNAL_API_KEY` in API
3. **Database errors**: Check `DATABASE_ID` matches in both env and wrangler.toml

## Security Notes

- **Never commit secrets** to version control
- **Use strong secrets** in production
- **Rotate secrets** regularly
- **Local secrets** are for development only
