# Environment Variables Analysis

## Current Situation

We're considering whether to use `VITE_` prefix for all environment variables, including the build API key.

## Key Questions

1. **Should the build API key be exposed to client code?** ❌ NO - Security risk
2. **Do build scripts need VITE_ prefix?** ⚠️ DEPENDS - See analysis below
3. **What's the best practice?** ✅ See recommendations below

## Vite Environment Variable Behavior

### Client-Side Code (`import.meta.env`)
- **Only `VITE_` prefixed variables** are exposed to client code
- This is a security feature to prevent accidentally leaking sensitive variables
- Example: `import.meta.env.VITE_API_BASE_URL` ✅ works
- Example: `import.meta.env.BUILD_API_KEY` ❌ undefined (not exposed)

### Build Scripts (Node.js via `tsx`)
- **ALL environment variables** are available via `process.env`
- Build scripts run as standalone Node.js processes, not through Vite
- Example: `process.env.BUILD_API_KEY` ✅ works
- Example: `process.env.VITE_API_BASE_URL` ✅ also works

### Vite Build Process
- Vite can access all environment variables during build
- Only `VITE_` prefixed variables are statically replaced in client code
- Build scripts have full access to all env vars via `process.env`

## Security Analysis

### Current Client-Side Usage
✅ **Good**: The API key is NOT used in client-side code
- Checked `web/src/` - no references to `BUILD_API_KEY` or `VITE_BUILD_API_KEY`
- Only `VITE_API_BASE_URL` is used in client code (safe - just a URL)

### Risk Assessment

| Variable | Current Usage | Should Use VITE_? | Risk if VITE_ |
|----------|--------------|-------------------|---------------|
| `VITE_API_BASE_URL` | Client + Build | ✅ YES | ✅ Safe (just URL) |
| `BUILD_API_KEY` | Build only | ❌ NO | ❌ HIGH - Would expose API key to client bundle |

## Build Script Analysis

### Current Build Script (`fetch-content-from-r2.ts`)
```typescript
// Runs as: tsx scripts/fetch-content-from-r2.ts
const apiUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8787'
const apiKey = process.env.VITE_BUILD_API_KEY || process.env.BUILD_API_KEY || 'dev-api-key'
```

**Question**: Does this script need `VITE_` prefix?

**Answer**: 
- ❌ **NO** - Build scripts have access to ALL env vars via `process.env`
- ✅ **BUT** - Using `VITE_` prefix for `VITE_API_BASE_URL` is fine (safe to expose)
- ❌ **DANGEROUS** - Using `VITE_` prefix for API key would expose it to client

## Cloudflare Pages Build Environment

### How Cloudflare Pages Works
1. Cloudflare Pages runs build commands in a Node.js environment
2. Environment variables are available via `process.env`
3. Vite processes the code and exposes `VITE_` prefixed vars to client

### Current Setup
- Variables are synced via `sync-env-to-pages.js`
- All variables are available during build
- Only `VITE_` prefixed vars are exposed to client bundle

## Recommendations

### ✅ RECOMMENDED APPROACH

**Use a hybrid approach:**

1. **`VITE_API_BASE_URL`** ✅
   - Use `VITE_` prefix
   - Safe to expose to client (just a URL)
   - Available in both build scripts and client code

2. **`BUILD_API_KEY`** ❌ (NOT `VITE_BUILD_API_KEY`)
   - Do NOT use `VITE_` prefix
   - Security: Prevents API key from being exposed to client bundle
   - Available in build scripts via `process.env.BUILD_API_KEY`
   - NOT available in client code (by design - security feature)

### Code Changes Needed

```typescript
// ✅ CORRECT - fetch-content-from-r2.ts
const apiUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8787'
const apiKey = process.env.BUILD_API_KEY || 'dev-api-key'  // NO VITE_ prefix
```

### Environment Files

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8787  # ✅ VITE_ prefix (safe to expose)
BUILD_API_KEY=your-secret-key            # ❌ NO VITE_ prefix (sensitive)
```

## Verification Checklist

- [ ] API key is NOT used in client-side code (`web/src/`)
- [ ] Build script uses `process.env.BUILD_API_KEY` (no VITE_ prefix)
- [ ] Client code only uses `VITE_API_BASE_URL` (safe URL)
- [ ] Documentation updated to reflect correct approach
- [ ] Sync scripts updated to handle `BUILD_API_KEY` (not `VITE_BUILD_API_KEY`)

## Conclusion

**DO NOT use `VITE_BUILD_API_KEY`** - it would expose the API key to the client bundle, which is a security risk.

**Use:**
- `VITE_API_BASE_URL` ✅ (safe to expose)
- `BUILD_API_KEY` ✅ (build-only, not exposed to client)

This follows Vite's security model: only expose what's safe to expose.
