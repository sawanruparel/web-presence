# Technology Stack Clarification

This document provides a clear breakdown of the technologies used in the Web Presence project.

## 🏗️ Architecture Overview

The Web Presence project uses a **hybrid architecture** that combines:
- **Static Frontend**: React SPA with static HTML generation
- **Serverless Backend**: Hono framework on Cloudflare Workers
- **Build Tools**: Node.js-based development and build tooling

## 🔧 Technology Stack by Layer

### Frontend Layer
**Runtime Environment:** Browsers

**Technologies:**
- **React 18** - UI library and component framework
- **TypeScript** - Type safety and development experience
- **Tailwind CSS 4.x** - Utility-first CSS framework
- **Headless UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **Heroicons** - Icon library

**Build Tools (Node.js):**
- **Vite** - Build tool and development server
- **PostCSS** - CSS processing and optimization
- **Custom Vite Plugins** - Content processing and HTML generation

### Backend Layer
**Runtime Environment:** Cloudflare Workers (not Node.js)

**Technologies:**
- **Hono** - Web framework optimized for edge computing
- **Cloudflare Workers** - Serverless runtime environment
- **JWT** - Authentication and authorization
- **TypeScript** - Type safety

**Build Tools (Node.js):**
- **Wrangler** - Cloudflare Workers deployment tool
- **TypeScript** - Type checking and compilation

### Content Processing Layer
**Runtime Environment:** Node.js (build-time only)

**Technologies:**
- **Markdown** - Content authoring format
- **YAML Frontmatter** - Content metadata
- **Rivve** - AI-powered content enhancement
- **Custom Scripts** - Content processing and generation

**Node.js Dependencies:**
- **marked** - Markdown to HTML conversion
- **gray-matter** - Frontmatter parsing
- **yaml** - YAML processing
- **fs** - File system operations
- **path** - File path utilities

### Development & Testing Layer
**Runtime Environment:** Node.js (development only)

**Technologies:**
- **Playwright** - End-to-end testing framework
- **TypeScript** - Type checking across all components
- **Custom Scripts** - Development automation

**Node.js Scripts:**
- **Password Generation** - Content access control
- **Environment Validation** - Configuration checking
- **E2E Test Orchestration** - Test execution management
- **Content Processing** - Markdown to static HTML conversion

## 📦 Package.json Breakdown

### Root Level (`/package.json`)
**Purpose:** Project orchestration and testing
**Node.js Usage:** Scripts and testing framework only

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:web\" \"npm run dev:api\"",
    "test:e2e": "playwright test",
    "passwords": "node scripts/generate-passwords.js"
  },
  "devDependencies": {
    "@playwright/test": "^1.56.1",
    "concurrently": "^8.0.0"
  }
}
```

### Frontend (`/web/package.json`)
**Purpose:** React application and build tools
**Node.js Usage:** Build tools and development server only

```json
{
  "scripts": {
    "dev": "npm run build:content && vite",
    "build": "npm run build:content && tsc && vite build",
    "build:content": "tsx scripts/fetch-content-from-r2.ts"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^7.1.6",
    "typescript": "~5.8.3",
    "tailwindcss": "^4.1.13"
  }
}
```

### Backend (`/api/package.json`)
**Purpose:** Hono API server
**Node.js Usage:** Build tools and deployment only

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "build": "tsc --noEmit"
  },
  "dependencies": {
    "hono": "^4.0.0"
  },
  "devDependencies": {
    "wrangler": "^4.43.0",
    "typescript": "^5.0.0"
  }
}
```

### Rivve (`/rivve/package.json`)
**Purpose:** AI content processing
**Node.js Usage:** CLI tools and content processing

```json
{
  "scripts": {
    "generate-frontmatter": "tsx src/cli/generate-frontmatter.ts",
    "convert-html": "tsx src/cli/convert-to-html.ts"
  },
  "dependencies": {
    "openai": "^5.22.0",
    "tsx": "^4.20.5",
    "marked": "^12.0.0"
  }
}
```

## 🔄 Node.js Usage Patterns

### Build-Time Only
**When Node.js is used:**
- Content processing and markdown conversion
- TypeScript compilation and type checking
- Vite development server and build process
- Testing framework execution
- Development script automation
- Package management (npm)

**When Node.js is NOT used:**
- Frontend runtime (runs in browsers)
- Backend runtime (runs on Cloudflare Workers)
- Production deployment (static files + serverless functions)

### Development Workflow
1. **Start Development** - Node.js runs Vite dev server
2. **Content Changes** - Node.js processes markdown files
3. **Code Changes** - Node.js compiles TypeScript
4. **Testing** - Node.js runs Playwright tests
5. **Build** - Node.js generates static files
6. **Deploy** - Static files deployed, no Node.js runtime needed

## 🚀 Deployment Architecture

### Frontend Deployment
- **Build Process:** Node.js (Vite + custom scripts)
- **Runtime:** Static files served by CDN

### Backend Deployment
- **Build Process:** Node.js (Wrangler + TypeScript)
- **Runtime:** Cloudflare Workers (Hono framework)
- **No Node.js Required:** After deployment

### Content Processing
- **Build Process:** Node.js (custom scripts)
- **Runtime:** Static HTML files
- **No Node.js Required:** After content generation

## 🔍 Key Takeaways

1. **Node.js is a Build Tool**: Used exclusively for development, building, and content processing
2. **No Node.js Runtime**: Neither frontend nor backend requires Node.js at runtime
3. **Serverless Architecture**: Backend runs on Cloudflare Workers
4. **Static Frontend**: React app is built to static files, no server required

## 📚 Related Documentation

- [Architecture Overview](./architecture.md) - System architecture details
- [Development Guide](./development.md) - Development workflow
- [Build System](./build-system.md) - Build process documentation
- [API Documentation](./api/README.md) - Backend API details
