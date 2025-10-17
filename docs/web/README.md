# Web Documentation

Frontend documentation for the Web Presence project.

## Overview

The frontend is a React-based single-page application with static HTML generation for content pages.

## Documentation

- **[Architecture](./architecture.md)** - System architecture and design
- **[Components](./components.md)** - React component reference
- **[Build System](./build-system.md)** - Vite configuration and build process
- **[Deployment](./deployment.md)** - Deployment and configuration

## Quick Start

### Development

```bash
cd web
npm install
npm run dev
```

### Production

```bash
cd web
npm run build
```

## Key Features

- **React SPA** - Interactive pages and navigation
- **Static HTML Generation** - SEO-optimized content pages
- **Content Management** - Markdown-based content with frontmatter
- **Access Control** - Three-tier content protection system
- **Modern UI** - Tailwind CSS with Headless UI components
- **TypeScript** - Full type safety and developer experience

## Project Structure

```
web/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   └── data/          # Generated content metadata
├── scripts/           # Build scripts
├── dist/              # Build output
└── package.json       # Dependencies
```

## Content Types

- **Notes** (`/content/notes/`) - Personal notes and thoughts
- **Publications** (`/content/publications/`) - Articles and papers
- **Ideas** (`/content/ideas/`) - Creative concepts and proposals
- **Pages** (`/content/pages/`) - Static pages (About, Contact)

## Getting Help

- Check the [Architecture](./architecture.md) for system overview
- See [Components](./components.md) for component reference
- Review [Build System](./build-system.md) for build process
- Read [Deployment](./deployment.md) for setup instructions
