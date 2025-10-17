# API Documentation

Backend API documentation for the Web Presence project.

## Overview

The backend API is built with Hono and Cloudflare Workers, providing content management and access control functionality.

## Documentation

- **[Architecture](./architecture.md)** - System architecture and design
- **[Endpoints](./endpoints.md)** - API endpoint reference
- **[Access Control](./access-control.md)** - Content access control system
- **[Deployment](./deployment.md)** - Deployment and configuration

## Quick Start

### Development

```bash
cd api
npm install
npm run dev
```

### Production

```bash
cd api
npm run deploy
```

## Key Features

- **Content Management** - Serve and manage content files
- **Access Control** - Three-tier access system (open, password, email-list)
- **Authentication** - JWT-based token authentication
- **Database Integration** - Cloudflare D1 database support
- **Rate Limiting** - Built-in rate limiting and security
- **Audit Logging** - Comprehensive access logging

## API Base URL

- **Development**: `http://localhost:8787`
- **Production**: `https://web-presence-api.quoppo.workers.dev`

## Authentication

Most endpoints require API key authentication via `X-API-Key` header:

```bash
X-API-Key: <your-api-key>
```

## Content Access

The API supports three access modes:

- **Open** - Public content, no authentication required
- **Password** - Password-protected content
- **Email-List** - Restricted to approved email addresses

## Getting Help

- Check the [Architecture](./architecture.md) for system overview
- See [Endpoints](./endpoints.md) for detailed API reference
- Review [Access Control](./access-control.md) for content protection
- Read [Deployment](./deployment.md) for setup instructions
