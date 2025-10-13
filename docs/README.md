# Web Presence Documentation

This directory contains comprehensive documentation for the Web Presence project - a modern React-based personal website with AI-powered content management capabilities.

## 📁 Documentation Structure

- **[Architecture Overview](./architecture.md)** - System architecture, components, and data flow
- **[Build System](./build-system.md)** - Vite configuration, build process, and deployment
- **[Content Management](./content-management.md)** - Content processing, Rivve integration, and markdown handling
- **[Development Guide](./development.md)** - Setup, development workflow, and debugging
- **[Extension Guide](./extension.md)** - How to extend and customize the system
- **[API Reference](./api-reference.md)** - Component APIs, utilities, and interfaces

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
