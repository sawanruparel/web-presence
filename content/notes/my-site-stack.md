---
title: "The stack for this website"
date: "2025-07-15"
readTime: "2 min"
type: "note"
---


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
