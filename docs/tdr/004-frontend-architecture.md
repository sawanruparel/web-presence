# TDR-004: Frontend Architecture

**Date**: 2025-10-16
**Status**: Accepted
**Author**: Development Team
**Stakeholders**: Product Owner, Technical Lead, Frontend Developers

## Context

The Web Presence project needed a frontend architecture that could:
- Serve both interactive pages and static content
- Provide excellent SEO for content pages
- Support a modern development experience
- Handle content access control
- Generate static HTML for content pages
- Integrate with AI-powered content processing (Rivve)

## Decision

We decided to implement a **hybrid static/dynamic architecture** using:

- **React SPA** for interactive pages and navigation
- **Static HTML generation** for SEO-optimized content pages
- **Vite** as the build tool and development server
- **TypeScript** for type safety and developer experience
- **Tailwind CSS** for styling
- **Headless UI** for accessible components
- **Custom Vite plugins** for content processing and HTML generation

## Consequences

### Positive
- **Excellent SEO** - Static HTML pages are fully crawlable
- **Fast Performance** - Static pages load instantly
- **Modern DX** - Hot reload, TypeScript, component-based architecture
- **Flexible Content** - Support for both dynamic and static content
- **Access Control** - Seamless integration with authentication system
- **AI Integration** - Easy integration with Rivve for content processing

### Negative
- **Build Complexity** - More complex build process with custom plugins
- **Dual Architecture** - Need to maintain both SPA and static generation
- **Content Sync** - Need to keep content metadata in sync
- **Deployment Complexity** - Need to handle both static and dynamic assets

### Neutral
- **Learning Curve** - Developers need to understand both patterns
- **Bundle Size** - React bundle only loaded for interactive pages

## Alternatives Considered

### Option 1: Pure SPA
- **Pros**: Simple architecture, single codebase, easy development
- **Cons**: Poor SEO, slower initial load, requires JavaScript for content
- **Why not chosen**: SEO requirements were critical for content pages

### Option 2: Pure Static Site Generator (Next.js)
- **Pros**: Excellent SEO, fast performance, mature ecosystem
- **Cons**: More opinionated, harder to customize, overkill for simple content
- **Why not chosen**: Too complex for the project requirements

### Option 3: Server-Side Rendering (SSR)
- **Pros**: Good SEO, dynamic content, server-side processing
- **Cons**: Requires server infrastructure, more complex deployment
- **Why not chosen**: Wanted to keep deployment simple with static hosting

### Option 4: Hybrid with Next.js
- **Pros**: Mature framework, good SEO, hybrid approach
- **Cons**: More opinionated, harder to customize build process
- **Why not chosen**: Vite provided more flexibility for custom content processing

## Implementation Notes

### Build Process
1. **Content Processing** - Scan markdown files, parse frontmatter, generate metadata
2. **Static HTML Generation** - Create SEO-optimized HTML files for content
3. **React Build** - Bundle React application with Vite
4. **Asset Optimization** - Optimize images, CSS, and JavaScript

### Custom Vite Plugins
- **HTML Pages Plugin** - Generates static HTML files from content
- **Dev Server Plugin** - Watches content files and serves static HTML
- **Content Processor** - Handles markdown parsing and metadata extraction

### Content Flow
```
Markdown Files → Frontmatter Parsing → Content Processing → HTML Generation → Static Files
                                                           ↓
React SPA ← Content Metadata ← Content Index ← Metadata Generation
```

### Access Control Integration
- **Check Access** - Call API to determine access requirements
- **Show Modal** - Display appropriate authentication modal
- **Verify Credentials** - Handle password/email verification
- **Store Token** - Manage authentication state
- **Fetch Content** - Retrieve protected content

## References

- [Web Architecture Documentation](../web/architecture.md)
- [Build System Documentation](../web/build-system.md)
- [Component Documentation](../web/components.md)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
