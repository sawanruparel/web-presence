# Architecture Overview

This document describes the system architecture, component structure, and data flow of the Web Presence project.

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Content       │    │   Build System  │    │   Runtime       │
│   Management    │    │                 │    │                 │
│                 │    │                 │    │                 │
│ • Markdown      │───▶│ • Vite          │───▶│ • React SPA     │
│ • Frontmatter   │    │ • Custom Plugins│    │ • Static HTML   │
│ • Rivve AI      │    │ • TypeScript    │    │ • SEO Metadata  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

1. **Content Layer** (`/content/`)
   - Markdown files with YAML frontmatter
   - Organized by content type (notes, publications, ideas, pages)
   - Processed by Rivve for AI-enhanced metadata

2. **Build Layer** (`/scripts/`, `vite.config.ts`)
   - Vite with custom HTML pages plugin
   - Content processing and static generation
   - TypeScript compilation and asset optimization

3. **Application Layer** (`/src/`)
   - React SPA with client-side routing
   - Component-based architecture
   - Error boundaries and loading states

4. **Output Layer** (`/dist/`)
   - Static HTML files for content pages
   - React bundle for interactive features
   - SEO-optimized metadata

## 📁 Directory Structure

```
web-presence/
├── content/                 # Content management
│   ├── notes/              # Personal notes
│   ├── publications/       # Articles and papers
│   ├── ideas/             # Creative concepts
│   └── pages/             # Static pages
├── src/                   # React application
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── data/             # Generated content metadata
├── scripts/              # Build system
│   ├── generate-static-content.js
│   ├── vite-plugin-html-pages.ts
│   └── html-template.ts
├── rivve/                # AI content processing
│   ├── src/             # Rivve core functionality
│   └── html-output/     # Generated HTML files
└── dist/                # Build output
    ├── assets/          # Bundled CSS/JS
    ├── *.html           # Static content pages
    └── content-metadata.json
```

## 🔄 Data Flow

### Content Processing Flow

1. **Markdown Input** → Content files in `/content/`
2. **Frontmatter Parsing** → YAML metadata extraction
3. **AI Enhancement** → Rivve processes content for SEO metadata
4. **HTML Generation** → Markdown → HTML conversion
5. **Metadata Indexing** → Content metadata JSON generation
6. **Static Output** → Individual HTML files + React bundle

### Runtime Data Flow

1. **URL Routing** → Client-side router determines page type
2. **Content Loading** → Load content metadata from JSON
3. **Component Rendering** → React components render content
4. **Error Handling** → Error boundaries catch and display errors

## 🧩 Component Architecture

### Page Components

- **`App.tsx`** - Main application component with routing
- **`HomePage.tsx`** - Landing page with content overview
- **`ContentPage.tsx`** - Individual content item display
- **`IdeasPage.tsx`** - Ideas listing and filtering
- **`NotesPage.tsx`** - Notes listing and filtering
- **`PublicationsPage.tsx`** - Publications listing and filtering
- **`AboutPage.tsx`** - About page content
- **`ContactPage.tsx`** - Contact page content

### UI Components

- **`Container.tsx`** - Layout wrapper component
- **`PageNavigation.tsx`** - Page-level navigation component
- **`Footer.tsx`** - Site footer
- **`Button.tsx`** - Reusable button component
- **`Link.tsx`** - Internal/external link component

### Error Handling

- **`ErrorBoundary.tsx`** - React error boundary wrapper
- **`ErrorFallback.tsx`** - Error display component
- **Error Pages** - Specific error page components

## 🔧 Build System Architecture

### Vite Configuration

- **React Plugin** - JSX/TSX processing
- **HTML Pages Plugin** - Custom static HTML generation
- **Dev Server Plugin** - Development server with content watching
- **TypeScript** - Type checking and compilation

### Content Processing Pipeline

1. **Content Discovery** - Scan `/content/` directories
2. **Frontmatter Parsing** - Extract YAML metadata
3. **AI Processing** - Rivve enhances metadata
4. **HTML Generation** - Markdown → HTML conversion
5. **Template Processing** - Apply HTML templates
6. **Asset Integration** - Link CSS/JS assets
7. **Output Generation** - Write static HTML files

### Development vs Production

**Development:**
- Hot module replacement
- Content file watching
- Live reload on changes
- Source maps enabled

**Production:**
- Optimized bundles
- Static HTML generation
- Asset hashing
- Minification enabled

## 🎨 Styling Architecture

### Tailwind CSS Integration

- **Custom Configuration** - `config.tailwind.ts`
- **Design System** - Consistent spacing, colors, typography
- **Component Classes** - Reusable utility combinations
- **Responsive Design** - Mobile-first approach

### CSS Variables

- **Color System** - CSS custom properties for theming
- **Spacing Scale** - Consistent spacing values
- **Typography** - Font families and sizes

## 🔍 SEO and Metadata

### Static HTML Generation

- **Individual Pages** - Each content item gets its own HTML file
- **SEO Metadata** - Title, description, Open Graph tags
- **Structured Data** - JSON-LD for search engines
- **Social Media** - Twitter, LinkedIn, Facebook optimization

### React SPA Features

- **Client-Side Routing** - Smooth navigation
- **Loading States** - User experience optimization
- **Error Handling** - Graceful error recovery
- **Progressive Enhancement** - Works without JavaScript

## 🚀 Performance Considerations

### Build Optimizations

- **Code Splitting** - Lazy loading of components
- **Asset Optimization** - Image and font optimization
- **Bundle Analysis** - Size monitoring and optimization
- **Tree Shaking** - Unused code elimination

### Runtime Performance

- **Lazy Loading** - Components loaded on demand
- **Memoization** - React.memo for expensive components
- **Error Boundaries** - Prevent cascade failures
- **Loading States** - Perceived performance improvement

## 🔒 Error Handling Strategy

### Build-Time Errors

- **TypeScript Errors** - Compile-time type checking
- **Content Validation** - Frontmatter and content validation
- **Asset Errors** - Missing or invalid assets

### Runtime Errors

- **Error Boundaries** - Component-level error catching
- **Fallback UI** - Graceful error display
- **Error Logging** - Error tracking and reporting
- **Recovery Mechanisms** - Automatic retry and fallback

## 📊 Monitoring and Analytics

### Development Tools

- **Vite DevTools** - Build performance monitoring
- **React DevTools** - Component debugging
- **TypeScript** - Type safety and error prevention

### Production Monitoring

- **Error Tracking** - Runtime error collection
- **Performance Metrics** - Load time and interaction tracking
- **Content Analytics** - Page view and engagement tracking

---

This architecture provides a robust foundation for a modern personal website with excellent SEO, performance, and maintainability characteristics.
