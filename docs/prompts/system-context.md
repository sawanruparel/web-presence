# System Context for AI Tools

This document provides comprehensive system context for AI tools working with the Web Presence project.

## 🏗️ Project Overview

**Web Presence** is a modern React-based personal website with AI-powered content management capabilities. It combines a React SPA with static HTML generation for optimal SEO and performance.

### Core Architecture
- **Frontend**: React 18 + TypeScript + Tailwind CSS 4.x
- **Build System**: Vite with custom plugins
- **Content Management**: Markdown with YAML frontmatter + Rivve AI processing
- **Deployment**: Static hosting (Vercel, Netlify, etc.)

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
│   ├── fetch-content-from-r2.ts
│   ├── vite-plugin-html-pages.ts
│   └── html-template.ts
├── rivve/                # AI content processing
│   ├── src/             # Rivve core functionality
│   └── html-output/     # Generated HTML files
└── dist/                # Build output
```

## 🎯 Key Principles

### 1. Type Safety
- Use TypeScript for all new code
- Define proper interfaces and types
- Avoid `any` types when possible
- Use strict type checking

### 2. Component Architecture
- Functional components with hooks
- Props interfaces for all components
- Consistent naming conventions
- Reusable and composable design

### 3. Error Handling
- Error boundaries for component isolation
- Graceful error recovery
- User-friendly error messages
- Comprehensive error logging

### 4. Performance
- Lazy loading for large components
- Memoization for expensive operations
- Optimized bundle sizes
- Efficient content processing

### 5. SEO Optimization
- Static HTML generation for content
- Comprehensive meta tags
- Structured data (JSON-LD)
- Social media optimization

## 🔧 Technology Stack

### Frontend
- **React 18** - UI library with hooks
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS 4.x** - Utility-first CSS framework
- **Headless UI** - Accessible component primitives
- **Heroicons** - Icon library
- **Framer Motion** - Animation library

### Build System
- **Vite** - Fast build tool and dev server
- **PostCSS** - CSS processing
- **Custom Plugins** - HTML generation and content processing

### Content Processing
- **Marked** - Markdown parsing
- **Gray Matter** - Frontmatter parsing
- **YAML** - Frontmatter processing
- **Rivve** - AI-powered content enhancement

## 📊 Content Types

### Notes (`/content/notes/`)
- Personal notes and thoughts
- Markdown files with frontmatter
- Processed for web display
- Searchable and filterable

### Publications (`/content/publications/`)
- Articles and papers
- Professional content
- Enhanced with AI metadata
- SEO-optimized

### Ideas (`/content/ideas/`)
- Creative concepts and proposals
- Brainstorming content
- Visual and interactive elements
- Innovation-focused

### Pages (`/content/pages/`)
- Static pages (About, Contact)
- Site information
- Contact forms
- Professional details

## 🔄 Data Flow

### Content Processing
1. **Markdown Input** → Content files in `/content/`
2. **Frontmatter Parsing** → YAML metadata extraction
3. **AI Enhancement** → Rivve processes content
4. **HTML Generation** → Markdown → HTML conversion
5. **Metadata Indexing** → Content metadata JSON
6. **Static Output** → Individual HTML files

### Runtime Flow
1. **URL Routing** → Client-side router
2. **Content Loading** → Load from metadata JSON
3. **Component Rendering** → React components
4. **Error Handling** → Error boundaries

## 🎨 Design System

### Colors
- **Primary**: Blue (#3b82f6)
- **Secondary**: Gray (#64748b)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)

### Typography
- **Headings**: Inter font family
- **Body**: System font stack
- **Code**: Monaco, Menlo, monospace

### Spacing
- **Base Unit**: 4px
- **Scale**: Tailwind spacing scale
- **Responsive**: Mobile-first approach

## 🧩 Component Patterns

### Functional Components
```typescript
interface ComponentProps {
  // Define props interface
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Component logic
  return (
    <div className="tailwind-classes">
      {/* JSX content */}
    </div>
  )
}
```

### Error Boundaries
```typescript
<ErrorBoundary context="ComponentName">
  <ComponentThatMightError />
</ErrorBoundary>
```

### Custom Hooks
```typescript
export function useCustomHook() {
  const [state, setState] = useState()
  
  useEffect(() => {
    // Effect logic
  }, [])
  
  return { state, setState }
}
```

## 🔧 Build System Patterns

### Vite Plugin Structure
```typescript
export function customPlugin(options: PluginOptions): Plugin {
  return {
    name: 'plugin-name',
    buildStart() {
      // Plugin initialization
    },
    generateBundle() {
      // Build-time processing
    }
  }
}
```

### Content Processing
```typescript
function processContent(content: string) {
  const { frontmatter, body } = parseFrontmatter(content)
  const html = marked(body)
  return { frontmatter, body, html }
}
```

## 🚀 Performance Considerations

### Bundle Optimization
- Tree shaking for unused code
- Code splitting for large components
- Asset optimization
- Lazy loading

### Runtime Performance
- React.memo for expensive components
- useMemo for expensive calculations
- useCallback for stable references
- Efficient re-renders

### Content Performance
- Static HTML generation
- Optimized metadata
- Efficient content processing
- Caching strategies

## 🔒 Security Patterns

### Input Validation
- Validate all user inputs
- Sanitize HTML content
- Validate file paths
- Check content permissions

### Content Security
- XSS prevention
- CSRF protection
- Secure file handling
- API key protection

## 📱 Responsive Design

### Mobile-First Approach
- Design for mobile first
- Progressive enhancement
- Touch-friendly interfaces
- Optimized performance

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## 🧪 Testing Strategy

### Component Testing
- Unit tests for components
- Integration tests for features
- Error boundary testing
- Accessibility testing

### Content Testing
- Frontmatter validation
- Content processing tests
- Build system tests
- Performance tests

## 📈 Monitoring and Analytics

### Error Tracking
- Error boundary integration
- Error logging
- Performance monitoring
- User feedback

### Content Analytics
- Page view tracking
- Content engagement
- Search performance
- Social media metrics

## 🔄 Development Workflow

### Code Changes
1. Follow TypeScript conventions
2. Use existing patterns
3. Add proper error handling
4. Update documentation
5. Test thoroughly

### Content Changes
1. Add markdown files to `/content/`
2. Include proper frontmatter
3. Process with Rivve (optional)
4. Test in development
5. Deploy to production

### Build Changes
1. Modify build scripts carefully
2. Test both dev and production builds
3. Verify static HTML generation
4. Check asset optimization
5. Monitor performance

## 🚨 Common Pitfalls

### Avoid These Patterns
- Using `any` types unnecessarily
- Missing error boundaries
- Inefficient re-renders
- Hardcoded values
- Missing accessibility attributes

### Best Practices
- Always define prop interfaces
- Use error boundaries appropriately
- Optimize for performance
- Follow naming conventions
- Test thoroughly

## 📚 Key Files to Understand

### Core Application
- `src/App.tsx` - Main application component
- `src/main.tsx` - Application entry point
- `src/utils/router.ts` - Client-side routing
- `src/utils/content-processor.ts` - Content management

### Build System
- `vite.config.ts` - Vite configuration
- `scripts/fetch-content-from-r2.ts` - Content fetching
- `scripts/vite-plugin-html-pages.ts` - HTML generation plugin

### Content Management
- `content/` - Content files
- `rivve/` - AI content processing
- `src/data/content-metadata.json` - Generated metadata

---

This system context provides the foundation for AI tools to understand and work effectively with the Web Presence project.
