# Backend API Documentation

This document describes the backend API implementation using Hono and Cloudflare Workers.

## 🏗️ Architecture

The backend API is built with:
- **Hono** - Fast, lightweight web framework
- **Cloudflare Workers** - Serverless runtime environment
- **JWT** - Token-based authentication
- **TypeScript** - Type safety and developer experience

## 📁 Project Structure

```
api/
├── src/
│   ├── index.ts              # Main Hono application
│   ├── routes/
│   │   ├── health.ts         # Health check endpoint
│   │   └── protected-content.ts # Protected content routes
│   ├── middleware/
│   │   ├── auth.ts           # JWT authentication middleware
│   │   └── error-handler.ts  # Error handling middleware
│   ├── services/
│   │   ├── auth-service.ts   # Authentication logic
│   │   └── content-service.ts # Content retrieval logic
│   └── utils/                # Helper functions
├── wrangler.toml             # Cloudflare Workers configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Cloudflare account (for deployment)

### Local Development

1. **Install dependencies:**
   ```bash
   cd api
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars with your values
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:8787`

### From Root Directory

```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend
npm run dev

# Start only the API
npm run dev:api
```

## 🔧 Configuration

### Environment Variables

Create a `.dev.vars` file in the `api/` directory:

```bash
# JWT secret for token signing (use a strong secret in production)
JWT_SECRET=your-super-secret-jwt-key-here

# Password for accessing protected content
CONTENT_PASSWORD=your-content-password-here
```

### Wrangler Configuration

The `wrangler.toml` file configures the Cloudflare Workers deployment:

```toml
name = "web-presence-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.development]
name = "web-presence-api-dev"

[env.production]
name = "web-presence-api"
```

## 📡 API Endpoints

### Health Check

**GET** `/api/health`

Returns the API status and version information.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### Authentication

**POST** `/api/auth/verify`

Verifies content-specific password and returns JWT token for protected content access.

**Request Body:**
```json
{
  "type": "notes",
  "slug": "my-protected-note",
  "password": "notes-my-protected-note-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Password Format:**
Each content item has a unique password generated using the format: `{type}-{slug}-{hash}`
- `type`: Content type (notes, publications, ideas, pages)
- `slug`: Content slug/identifier
- `hash`: 6-character hash generated from type and slug

### Password Discovery

**GET** `/api/auth/password/:type/:slug`

Get the password for a specific content item (useful for development and testing).

**Example:**
```bash
curl http://localhost:8787/auth/password/notes/my-secret-note
```

**Response:**
```json
{
  "type": "notes",
  "slug": "my-secret-note",
  "password": "notes-my-secret-note-xyz789",
  "note": "Use this password to access the protected content"
}
```

### Protected Content

**GET** `/api/auth/content/:type/:slug`

Retrieves protected content after authentication.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "slug": "my-protected-note",
  "title": "My Protected Note",
  "date": "2024-01-01",
  "readTime": "5 min",
  "type": "notes",
  "excerpt": "This is a protected note...",
  "content": "# My Protected Note\n\nContent here...",
  "html": "<h1>My Protected Note</h1><p>Content here...</p>"
}
```

## 🔒 Authentication Flow

1. **Password Discovery:**
   - Client requests password for specific content: `GET /api/auth/password/:type/:slug`
   - Server generates content-specific password using type and slug
   - Password format: `{type}-{slug}-{hash}` (e.g., `notes-my-secret-abc123`)

2. **Password Verification:**
   - Client sends content-specific password to `/api/auth/verify`
   - Server validates password against generated content password
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
   - Add `JWT_SECRET` and `CONTENT_PASSWORD`

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
curl http://localhost:8787/api/health

# Verify password
curl -X POST http://localhost:8787/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"type":"notes","slug":"test","password":"dev-password"}'

# Get protected content (with token)
curl http://localhost:8787/api/auth/content/notes/test \
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
