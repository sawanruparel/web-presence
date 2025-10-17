# Web Presence Documentation

This directory contains comprehensive documentation for the Web Presence project - a modern React-based personal website with AI-powered content management capabilities.

## 📁 Documentation Structure

### Core Documentation
- **[Architecture Overview](./architecture.md)** - System architecture, components, and data flow
- **[Technology Stack](./tech-stack.md)** - Complete technology breakdown
- **[Development Guide](./development.md)** - Setup, development workflow, and debugging
- **[Content Management](./content-management.md)** - Content processing, Rivve integration, and markdown handling
- **[Extension Guide](./extension.md)** - How to extend and customize the system
- **[Common Tasks](./common-tasks.md)** - Frequently performed tasks and procedures
- **[Environment Setup](./environment-setup.md)** - Environment configuration and setup
- **[Build System](./build-system.md)** - Build process and configuration

### API Documentation
- **[API Overview](./api/README.md)** - Backend API documentation
- **[API Architecture](./api/architecture.md)** - System architecture and design
- **[API Endpoints](./api/endpoints.md)** - Complete API endpoint reference
- **[Access Control](./api/access-control.md)** - Content access control system
- **[API Deployment](./api/deployment.md)** - Deployment and configuration guide

### Web Documentation
- **[Web Overview](./web/README.md)** - Frontend application documentation
- **[Web Architecture](./web/architecture.md)** - Frontend system architecture
- **[Components](./web/components.md)** - React component reference
- **[Build System](./web/build-system.md)** - Vite configuration and build process
- **[Web Deployment](./web/deployment.md)** - Frontend deployment guide

### Testing Documentation
- **[Testing Overview](./tests/README.md)** - Test suite documentation
- **[API Testing](./tests/api-testing.md)** - Backend API test suite and procedures
- **[E2E Testing](./tests/e2e-testing.md)** - End-to-end testing with Playwright
- **[Manual Testing](./tests/manual-testing.md)** - Manual testing guide and test cases

### Technical Decision Records
- **[TDR Overview](./tdr/README.md)** - Technical Decision Records index
- **[001 - Access Control Architecture](./tdr/001-access-control-architecture.md)** - Access control system design
- **[002 - Content Folder Structure](./tdr/002-content-folder-structure.md)** - Content organization decisions
- **[003 - Database Implementation](./tdr/003-database-implementation.md)** - Database architecture decisions
- **[004 - Frontend Architecture](./tdr/004-frontend-architecture.md)** - Frontend system design

### AI Development Tools
- **[Prompts Overview](./prompts/README.md)** - AI tool context and coding guidelines
- **[System Context](./prompts/system-context.md)** - Comprehensive system context for AI tools
- **[Component Patterns](./prompts/component-patterns.md)** - React component development patterns
- **[Testing Patterns](./prompts/testing-patterns.md)** - Testing strategies and patterns


## 🚀 Quick Start

1. **Setup**: See [Development Guide](./development.md#setup)
2. **Content**: See [Content Management](./content-management.md#adding-content)
3. **Customization**: See [Extension Guide](./extension.md#customization)

## 🏗️ Project Overview

Web Presence is a hybrid static/dynamic website that combines:
- **React SPA** for interactive pages and navigation
- **Static HTML generation** for SEO-optimized content pages
- **AI-powered content processing** via Rivve integration
- **Markdown-based content management** with frontmatter support

## 🔧 Key Technologies

- **Frontend**: React 18, TypeScript, Tailwind CSS 4.x
- **Build**: Vite with custom plugins
- **Content**: Markdown with YAML frontmatter
- **AI Processing**: OpenAI API via Rivve
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Heroicons, Headless UI components

## 📊 Content Types

- **Notes** (`/content/notes/`) - Personal notes and thoughts
- **Publications** (`/content/publications/`) - Articles and papers
- **Ideas** (`/content/ideas/`) - Creative concepts and proposals
- **Pages** (`/content/pages/`) - Static pages (About, Contact)

## 🔄 Build Process

1. **Content Processing**: Markdown files → HTML with metadata
2. **React Build**: TypeScript → JavaScript bundle
3. **Static Generation**: Content pages → SEO-optimized HTML
4. **Asset Optimization**: CSS, JS, and static assets

## 📝 Contributing

When making changes to this project:
1. Read the relevant documentation sections
2. Follow the development workflow
3. Test both development and production builds
4. Update documentation if needed

---

For specific questions, refer to the individual documentation files or the [API Reference](./api-reference.md).
