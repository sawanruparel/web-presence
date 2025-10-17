# API Architecture

This document describes the backend API implementation using Hono and Cloudflare Workers.

## 🏗️ Architecture

The backend API is built with:
- **Hono** - Fast, lightweight web framework
- **Cloudflare Workers** - Serverless runtime environment
- **JWT** - Token-based authentication
- **TypeScript** - Type safety and developer experience
- **Cloudflare D1** - SQLite database for data persistence

## 📁 Project Structure

```
api/
├── src/
│   ├── index.ts              # Main Hono application
│   ├── routes/
│   │   ├── health.ts         # Health check endpoint
│   │   ├── protected-content.ts # Protected content routes
│   │   └── internal.ts       # Internal admin routes
│   ├── middleware/
│   │   ├── auth.ts           # JWT authentication middleware
│   │   ├── error-handler.ts  # Error handling middleware
│   │   └── rate-limiter.ts   # Rate limiting middleware
│   ├── services/
│   │   ├── access-control-service.ts # Access control logic
│   │   ├── database-service.ts # Database operations
│   │   └── content-service.ts # Content retrieval logic
│   └── utils/                # Helper functions
├── config/
│   └── access-control.json   # Access control configuration
├── wrangler.toml             # Cloudflare Workers configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

## 🔧 Configuration

### Environment Variables

Create a `.dev.vars` file in the `api/` directory:

```bash
# JWT secret for token signing (use a strong secret in production)
JWT_SECRET=your-super-secret-jwt-key-here

# Database connection (Cloudflare D1)
DB=database-name

# Internal API key for admin endpoints
INTERNAL_API_KEY=your-internal-api-key
```

### Wrangler Configuration

The `wrangler.toml` file configures the Cloudflare Workers deployment:

```toml
name = "web-presence-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "web-presence-db"
database_id = "your-database-id"

[env.development]
name = "web-presence-api-dev"

[env.production]
name = "web-presence-api"
```

## 🔒 Authentication Flow

1. **Password Discovery:**
   - Client requests password for specific content: `GET /auth/password/:type/:slug`
   - Server generates content-specific password using type and slug
   - Password format: `{type}-{slug}-{hash}` (e.g., `notes-my-secret-abc123`)

2. **Password Verification:**
   - Client sends content-specific password to `/auth/verify`
   - Server validates password against stored hash in database
   - If valid, server generates JWT token with content access info

3. **Content Access:**
   - Client includes JWT token in `Authorization` header
   - Server validates token and extracts content access permissions
   - Server returns requested protected content

4. **Token Security:**
   - Tokens expire after 24 hours
   - Tokens contain specific content type and slug for access control
   - Each content item requires its own unique password

## 🛠️ Development

### Adding New Routes

1. Create route file in `src/routes/`
2. Import and register in `src/index.ts`
3. Add middleware as needed

Example:
```typescript
// src/routes/new-route.ts
import { Hono } from 'hono'

export const newRoute = new Hono()

newRoute.get('/', (c) => {
  return c.json({ message: 'Hello from new route' })
})
```

### Adding Middleware

1. Create middleware file in `src/middleware/`
2. Import and use in routes or app

Example:
```typescript
// src/middleware/custom-middleware.ts
import { Context, Next } from 'hono'

export const customMiddleware = async (c: Context, next: Next) => {
  // Your middleware logic
  await next()
}
```

## 🚀 Deployment

### Deploy to Cloudflare Workers

1. **Login to Cloudflare:**
   ```bash
   npx wrangler login
   ```

2. **Deploy:**
   ```bash
   cd api
   npm run deploy
   ```

3. **Set environment variables in Cloudflare dashboard:**
   - Go to Workers & Pages > Your Worker > Settings > Variables
   - Add `JWT_SECRET`, `DB`, and `INTERNAL_API_KEY`

### Environment-Specific Deployments

```bash
# Deploy to development
wrangler deploy --env development

# Deploy to production
wrangler deploy --env production
```

## 🔍 Monitoring

### Logs

View logs in Cloudflare dashboard:
- Workers & Pages > Your Worker > Logs

### Metrics

Monitor performance in Cloudflare dashboard:
- Workers & Pages > Your Worker > Analytics

## 🧪 Testing

### Manual Testing

Use curl or any HTTP client:

```bash
# Health check
curl http://localhost:8787/health

# Verify password
curl -X POST http://localhost:8787/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"type":"notes","slug":"test","password":"dev-password"}'

# Get protected content (with token)
curl http://localhost:8787/auth/content/notes/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Check CORS configuration in `src/index.ts`
   - Ensure frontend domain is whitelisted

2. **Authentication Failures:**
   - Verify JWT_SECRET is set correctly
   - Check token expiration
   - Ensure proper Authorization header format

3. **Content Not Found:**
   - Verify content files exist in `/content` directory
   - Check file paths in content service
   - Ensure proper slug format

### Debug Mode

Enable debug logging by setting environment variable:
```bash
NODE_ENV=development
```

## 📚 Type Definitions

All API types are defined in `/types/api.ts` and shared between frontend and backend for type safety.

## 🔄 Integration with Frontend

The frontend communicates with the API through:
- Proxy configuration in Vite (development)
- Direct API calls (production)
- Shared TypeScript types for type safety
- JWT token management in session storage
