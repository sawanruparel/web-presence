# API Backend

Backend API for the Web Presence project.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Deploy to production
npm run deploy
```

## Documentation

For detailed documentation, see:
- **[API Documentation](../docs/api/README.md)** - Complete API reference
- **[Architecture](../docs/api/architecture.md)** - System architecture
- **[Endpoints](../docs/api/endpoints.md)** - API endpoint reference
- **[Access Control](../docs/api/access-control.md)** - Content access control system
- **[Deployment](../docs/api/deployment.md)** - Deployment guide

## Key Features

- **Content Management** - Serve and manage content files
- **Access Control** - Three-tier access system (open, password, email-list)
- **Authentication** - JWT-based token authentication
- **Database Integration** - Cloudflare D1 database support
- **Rate Limiting** - Built-in rate limiting and security
- **Audit Logging** - Comprehensive access logging

## Tech Stack

- **Hono** - Fast, lightweight web framework
- **Cloudflare Workers** - Serverless runtime environment
- **TypeScript** - Type safety and developer experience
- **Cloudflare D1** - SQLite database for data persistence
