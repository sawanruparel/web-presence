# Web Build System

Vite configuration, build process, and deployment guide.

## 🏗️ Build System Overview

The project uses Vite as the primary build tool with custom plugins for content processing and static HTML generation.

### Build Tools

- **Vite** - Main build tool and dev server
- **TypeScript** - Type checking and compilation
- **PostCSS** - CSS processing with Tailwind
- **Custom Plugins** - HTML generation and content processing

## ⚙️ Vite Configuration

### Main Configuration (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [
    react(),                                    // React support
    htmlPagesPlugin({                          // Custom HTML generation
      contentDir: './content',
      outputDir: './dist',
      rivveOutputDir: './rivve/html-output'
    }),
    devServerPlugin('./content', './rivve/html-output')  // Dev server
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'                   // Entry point
      }
    }
  }
})
```

### Plugin Configuration

#### HTML Pages Plugin
- **Purpose**: Generate static HTML files for content pages
- **Input**: Markdown files from `/content/`
- **Output**: SEO-optimized HTML files in `/dist/`
- **Features**: Metadata extraction, template processing

#### Dev Server Plugin
- **Purpose**: Watch content files and serve static HTML
- **Features**: Live reload, content file watching
- **Integration**: Works with Vite dev server

## 📦 Build Process

### Development Build

```bash
npm run dev
```

**Process:**
1. Start Vite dev server
2. Watch content files for changes
3. Serve React app with hot reload
4. Serve static HTML files for content

### Production Build

```bash
npm run build
```

**Process:**
1. **Content Processing** (`npm run build:content`)
   - Scan `/content/` directories
   - Parse markdown and frontmatter
   - Generate content metadata JSON
   - Create Rivve HTML files

2. **TypeScript Compilation** (`tsc`)
   - Type checking
   - Compile TypeScript to JavaScript

3. **Vite Build** (`vite build`)
   - Bundle React application
   - Optimize assets
   - Generate static HTML files
   - Copy static assets

## 🔧 Content Processing Pipeline

### Static Content Generation (`scripts/generate-static-content.js`)

**Input:** Markdown files in `/content/`
**Output:** Processed content and metadata

**Steps:**
1. **File Discovery**
   ```javascript
   const contentTypes = ['notes', 'publications', 'ideas', 'pages']
   // Scan each content type directory
   ```

2. **Frontmatter Parsing**
   ```javascript
   const { frontmatter, body } = parseFrontmatter(fileContents)
   // Extract YAML metadata and markdown body
   ```

3. **Content Processing**
   ```javascript
   const html = marked(body)  // Markdown → HTML
   const excerpt = generateExcerpt(body)  // Auto-generate excerpt
   ```

4. **Metadata Generation**
   ```javascript
   const contentItem = {
     slug, title, date, readTime, type,
     content: body, html: htmlWithoutTitle, excerpt
   }
   ```

5. **Rivve HTML Generation**
   ```javascript
   const rivveHtml = generateRivveHTML(frontmatter, body, slug)
   // Generate SEO-optimized HTML with metadata
   ```

6. **Output Writing**
   ```javascript
   // Write content metadata JSON
   fs.writeFileSync(metadataPath, JSON.stringify(contentIndex, null, 2))
   // Write individual HTML files
   fs.writeFileSync(htmlFile, rivveHtml, 'utf8')
   ```

### HTML Template Processing (`scripts/html-template.ts`)

**Purpose:** Generate final HTML files with React integration

**Features:**
- SEO metadata injection
- Asset path resolution
- Template variable substitution
- Social media optimization

## 📁 Output Structure

### Development Output

```
dist/
├── assets/
│   ├── main-[hash].js      # React bundle
│   └── main-[hash].css     # Tailwind CSS
├── content-metadata.json   # Content index
└── index.html             # Main React app
```

### Production Output

```
dist/
├── assets/
│   ├── main-[hash].js      # Optimized React bundle
│   └── main-[hash].css     # Optimized CSS
├── notes/                  # Static HTML for notes
│   └── *.html
├── publications/           # Static HTML for publications
│   └── *.html
├── ideas/                  # Static HTML for ideas
│   └── *.html
├── content-metadata.json   # Content index
└── index.html             # Main React app
```

## 🚀 Deployment Process

### Static Hosting (Recommended)

**Compatible with:**
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting service

**Deployment Steps:**
1. Build the project: `npm run build`
2. Upload `/dist` contents to hosting service
3. Configure redirects for SPA routing

### Server-Side Rendering (Optional)

**For advanced use cases:**
- Node.js server with Express
- Custom routing for content pages
- Server-side content processing

## 🔍 Build Optimization

### Asset Optimization

**JavaScript:**
- Tree shaking (unused code elimination)
- Code splitting (lazy loading)
- Minification and compression
- Source map generation

**CSS:**
- Tailwind purging (unused styles removal)
- PostCSS optimization
- Critical CSS extraction

**Images:**
- Format optimization (WebP, AVIF)
- Responsive image generation
- Lazy loading implementation

### Performance Monitoring

**Build Metrics:**
- Bundle size analysis
- Asset count and sizes
- Build time measurement
- Dependency analysis

**Runtime Metrics:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)

## 🛠️ Development Workflow

### Local Development

1. **Start Dev Server**
   ```bash
   npm run dev
   ```

2. **Content Changes**
   - Edit markdown files in `/content/`
   - Changes auto-reload in browser
   - No build step required

3. **Code Changes**
   - Edit React components in `/src/`
   - Hot module replacement
   - Instant feedback

### Content Management

1. **Add New Content**
   ```bash
   # Create new markdown file
   touch content/notes/my-new-note.md
   
   # Add frontmatter
   ---
   title: "My New Note"
   date: "2024-01-01"
   type: "note"
   ---
   
   # Content here...
   ```

2. **Process Content**
   ```bash
   # Generate content metadata
   npm run build:content
   
   # Or full build
   npm run build
   ```

### Debugging

**Build Issues:**
- Check TypeScript errors: `npx tsc --noEmit`
- Verify content files: Check `/content/` structure
- Review plugin logs: Look for Vite plugin output

**Runtime Issues:**
- Use React DevTools
- Check browser console
- Verify content metadata JSON

## 🔧 Configuration Files

### TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
```

### PostCSS (`postcss.config.js`)

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Tailwind (`config.tailwind.ts`)

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
```

## 🚨 Troubleshooting

### Common Build Issues

**TypeScript Errors:**
- Check import paths
- Verify type definitions
- Update dependencies

**Content Processing Errors:**
- Validate frontmatter YAML
- Check file permissions
- Verify content directory structure

**Asset Loading Issues:**
- Check asset paths in generated HTML
- Verify public directory contents
- Review Vite asset handling

### Performance Issues

**Large Bundle Size:**
- Analyze bundle with `npm run build -- --analyze`
- Implement code splitting
- Remove unused dependencies

**Slow Build Times:**
- Check file watching configuration
- Optimize content processing
- Use build caching

## 🔧 Custom Plugins

### HTML Pages Plugin

**Purpose:** Generate static HTML files for content pages

**Configuration:**
```typescript
interface HTMLPagesPluginOptions {
  contentDir: string
  outputDir: string
  rivveOutputDir: string
}

export function htmlPagesPlugin(
  options: HTMLPagesPluginOptions
): Plugin
```

**Features:**
- Static HTML generation
- Content metadata processing
- Asset integration
- SEO optimization

### Dev Server Plugin

**Purpose:** Development server plugin for content watching

**Configuration:**
```typescript
export function devServerPlugin(
  contentDir: string,
  rivveOutputDir: string
): Plugin
```

**Features:**
- Content file watching
- Live reload
- Static file serving
- Development optimization

## 📊 Build Analysis

### Bundle Analysis

**Analyze Bundle Size:**
```bash
npm run build -- --analyze
```

**Check Dependencies:**
```bash
npm run build -- --report
```

### Performance Budget

**Set Performance Budget:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@headlessui/react', '@heroicons/react']
        }
      }
    }
  }
})
```

## 🔄 CI/CD Integration

### GitHub Actions

**Build and Deploy:**
```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
```

### Vercel Deployment

**Configuration:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Netlify Deployment

**Configuration:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 📚 Advanced Configuration

### Environment Variables

**Development:**
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8787
VITE_DEV_MODE=true
```

**Production:**
```bash
# .env.production
VITE_API_BASE_URL=https://api.example.com
VITE_DEV_MODE=false
```

### Custom Vite Plugins

**Creating Custom Plugins:**
```typescript
export function customPlugin(): Plugin {
  return {
    name: 'custom-plugin',
    buildStart() {
      console.log('Custom plugin started')
    },
    generateBundle(options, bundle) {
      // Custom bundle processing
    }
  }
}
```

### Build Hooks

**Pre-build:**
```bash
# package.json
{
  "scripts": {
    "prebuild": "npm run build:content",
    "build": "vite build"
  }
}
```

**Post-build:**
```bash
# package.json
{
  "scripts": {
    "build": "vite build",
    "postbuild": "npm run analyze"
  }
}
```

## 🔧 Maintenance

### Dependency Updates

**Update Dependencies:**
```bash
npm update
npm audit fix
```

**Check for Outdated:**
```bash
npm outdated
```

### Build Cache

**Clear Build Cache:**
```bash
rm -rf node_modules/.vite
rm -rf dist
npm run build
```

### Performance Monitoring

**Monitor Build Performance:**
```bash
npm run build -- --profile
```

**Analyze Bundle:**
```bash
npm run build -- --analyze
```

---

This build system provides a robust foundation for both development and production deployment of the Web Presence project.
