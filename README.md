# Sawan Ruparel - Personal Website

A modern full-stack personal website showcasing expertise in AI, healthcare innovation, and software development. Features a React frontend with a Hono-based API backend, both deployed on Cloudflare.

## Features

### Frontend
- Responsive design with mobile-first approach
- Modern UI components with Headless UI
- Smooth animations with Framer Motion
- Error boundary implementation for robust error handling
- Clean, professional design aesthetic
- SEO-optimized structure with static HTML generation

### Backend API
- Hono-based API server
- Cloudflare Workers deployment
- Per-content password authentication system
- JWT-based token management
- CORS-enabled for frontend communication
- Type-safe API contracts

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS 4.x for styling
- Headless UI for accessible components
- Framer Motion for animations
- Heroicons for icons

### Backend
- Hono web framework
- Cloudflare Workers runtime
- JWT authentication
- TypeScript for type safety

## Project Structure

```
web-presence/
├── web/                   # Frontend (React SPA)
│   ├── src/              # React application
│   ├── scripts/          # Build scripts
│   └── package.json      # Frontend dependencies
├── api/                  # Backend API (Hono + Cloudflare Workers)
│   ├── src/              # API source code
│   └── package.json      # API dependencies
├── content/              # Content files (shared)
├── rivve/                # AI content processing (shared)
├── types/                # Shared TypeScript types
├── docs/                 # Documentation
└── package.json          # Root orchestration scripts
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (for API deployment)

### Development

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start both frontend and backend:**
   ```bash
   npm run dev
   ```

3. **Start only frontend:**
   ```bash
   npm run dev:web
   ```

4. **Start only backend:**
   ```bash
   npm run dev:api
   ```

5. **Generate passwords for protected content:**
   ```bash
   # Get all passwords
   npm run passwords:all
   
   # Get password for specific content
   npm run passwords notes my-secret-note
   ```

### Production Build

```bash
# Build both frontend and backend
npm run build

# Build only frontend
npm run build:web

# Build only backend
npm run build:api
```

## Deployment

### Frontend (Cloudflare Pages)
The frontend deploys to Cloudflare Pages as a static site.

### Backend (Cloudflare Workers)
The backend API deploys to Cloudflare Workers:

1. **Login to Cloudflare:**
   ```bash
   cd api
   npx wrangler login
   ```

2. **Deploy:**
   ```bash
   npm run deploy
   ```

3. **Set environment variables in Cloudflare dashboard:**
   - `JWT_SECRET` - Secret for JWT token signing
   - `CONTENT_PASSWORD` - Password for protected content access

## API Documentation

See [docs/api-backend.md](docs/api-backend.md) for detailed API documentation.

## Architecture

See [docs/architecture.md](docs/architecture.md) for detailed system architecture.
