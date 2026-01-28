# Build System Documentation

This document describes the build system, Vite configuration, and deployment process for the Web Presence project.

## 🏗️ Build System Overview

The project uses Vite as the primary build tool with custom plugins for content processing and static HTML generation.

### Build Tools (Node.js)

- **Vite** - Main build tool and dev server (Node.js)
- **TypeScript** - Type checking and compilation (Node.js)
- **PostCSS** - CSS processing with Tailwind (Node.js)
- **Custom Plugins** - HTML generation and content processing (Node.js)
- **Content Scripts** - Markdown processing and metadata generation (Node.js)

### Runtime Environments

- **Frontend**: React SPA running in browsers
- **Backend**: Hono framework on Cloudflare Workers

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

### When content updates reach the site

Two things must happen for **about** and **contact** (and other content) to show updates on the server:

1. **Content sync** (GitHub webhook or admin content-sync) must run for the changed files.  
   - The webhook includes any `content/**/*.md`, so `content/pages/about.md` and `content/pages/contact.md` already trigger sync.  
   - Admin content-sync uses `getAllContentFiles()`, which includes the `pages` directory.

2. **Frontend build** (e.g. Cloudflare Pages) must run so the site pulls fresh data from R2.  
   - If you use **Build watch paths** in Cloudflare Pages, include `content/` (or at least `content/pages/`) in the “include” paths. Otherwise pushes that only change content will skip the build and the live site will keep serving the previous build.

## 🔧 Content Processing Pipeline

### Content Fetching (`scripts/fetch-content-from-r2.ts`)

**Runtime:** Node.js script (build-time only)
**Input:** Markdown files in `/content/`
**Output:** Processed content and metadata

**Steps:**
1. **File Discovery** (Node.js)  
   The build script fetches from the API catalog; the API’s content metadata includes `notes`, `ideas`, `publications`, and **`pages`** (about, contact, etc.).
   ```javascript
   const contentTypes = ['notes', 'publications', 'ideas', 'pages']
   // Catalog includes pages; fetch-content-from-r2 uses catalogData.metadata?.pages
   ```

2. **Frontmatter Parsing** (Node.js)
   ```javascript
   const { frontmatter, body } = parseFrontmatter(fileContents)
   // Extract YAML metadata and markdown body using Node.js libraries
   ```

3. **Content Processing** (Node.js)
   ```javascript
   const html = marked(body)  // Markdown → HTML using Node.js marked library
   const excerpt = generateExcerpt(body)  // Auto-generate excerpt
   ```

4. **Metadata Generation** (Node.js)
   ```javascript
   const contentItem = {
     slug, title, date, readTime, type,
     content: body, html: htmlWithoutTitle, excerpt
   }
   ```

5. **Rivve HTML Generation** (Node.js)
   ```javascript
   const rivveHtml = generateRivveHTML(frontmatter, body, slug)
   // Generate SEO-optimized HTML with metadata using Node.js
   ```

6. **Output Writing** (Node.js)
   ```javascript
   // Write content metadata JSON using Node.js fs module
   fs.writeFileSync(metadataPath, JSON.stringify(contentIndex, null, 2))
   // Write individual HTML files using Node.js fs module
   fs.writeFileSync(htmlFile, rivveHtml, 'utf8')
   ```

### HTML Template Processing (`scripts/html-template.ts`)

**Runtime:** TypeScript compiled to Node.js (build-time only)
**Purpose:** Generate final HTML files with React integration

**Features:**
- SEO metadata injection (Node.js)
- Asset path resolution (Node.js)
- Template variable substitution (Node.js)
- Social media optimization (Node.js)

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
- Node.js server with Express (would require separate Node.js runtime)
- Custom routing for content pages
- Server-side content processing

**Note:** This project currently uses static hosting and Cloudflare Workers, avoiding the need for a Node.js runtime server.

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

---

This build system provides a robust foundation for both development and production deployment of the Web Presence project.
