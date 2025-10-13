# Development Guide

This document provides comprehensive guidance for setting up, developing, and maintaining the Web Presence project.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (recommended: latest LTS)
- **npm** 9+ (comes with Node.js)
- **Git** (for version control)

### Initial Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd web-presence
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Create .env file for Rivve (optional)
   echo "OPENAI_API_KEY=your-api-key-here" > .env
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Open Browser**
   - Navigate to `http://localhost:5173`
   - The site should load with sample content

## 🛠️ Development Workflow

### Daily Development

1. **Start Dev Server**
   ```bash
   npm run dev
   ```

2. **Make Changes**
   - Edit React components in `/src/`
   - Add content in `/content/`
   - Modify styles in `src/style.css`

3. **Preview Changes**
   - Browser auto-reloads on changes
   - Check console for errors
   - Test different screen sizes

### Content Development

1. **Add New Content**
   ```bash
   # Create new markdown file
   touch content/notes/my-note.md
   ```

2. **Edit Content**
   ```markdown
   ---
   title: "My Note"
   date: "2024-01-01"
   type: "note"
   ---
   
   # My Note
   
   Content here...
   ```

3. **Process with AI** (Optional)
   ```bash
   cd rivve
   npm run generate-frontmatter "../content/notes/my-note.md"
   ```

4. **Preview Content**
   - Content appears automatically in dev server
   - Check individual content pages
   - Verify metadata and styling

### Code Development

1. **Component Development**
   ```bash
   # Edit components in /src/components/
   # Use TypeScript for type safety
   # Follow existing patterns
   ```

2. **Page Development**
   ```bash
   # Edit pages in /src/pages/
   # Follow routing patterns
   # Test error boundaries
   ```

3. **Styling**
   ```bash
   # Use Tailwind CSS classes
   # Edit src/style.css for custom styles
   # Follow design system patterns
   ```

## 🔧 Development Tools

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build:content    # Process content only
npm run copy:content     # Copy content files

# Building
npm run build           # Full production build
npm run preview         # Preview production build

# Rivve (AI Content Processing)
cd rivve
npm run auto-scan       # Process all content with AI
npm run dev-server      # Start Rivve dev server
npm run test-api        # Test OpenAI API key
```

### Development Server Features

**Hot Module Replacement:**
- Instant updates for React components
- CSS changes apply immediately
- State preservation during updates

**Content Watching:**
- Auto-reload on content file changes
- Metadata regeneration
- Static HTML updates

**Error Overlay:**
- TypeScript errors displayed
- Runtime errors highlighted
- Source map integration

## 📁 Project Structure

### Source Code (`/src/`)

```
src/
├── components/          # Reusable UI components
│   ├── button.tsx      # Button component
│   ├── container.tsx   # Layout wrapper
│   ├── page-navigation.tsx # Page navigation
│   └── ...
├── pages/              # Page components
│   ├── HomePage.tsx    # Landing page
│   ├── ContentPage.tsx # Individual content
│   └── ...
├── hooks/              # Custom React hooks
│   └── use-error-handler.ts
├── utils/              # Utility functions
│   ├── content-processor.ts
│   ├── router.ts
│   └── ...
├── data/               # Generated content metadata
│   └── content-metadata.json
├── App.tsx             # Main app component
├── main.tsx            # Application entry point
└── style.css           # Global styles
```

### Content (`/content/`)

```
content/
├── notes/              # Personal notes
├── publications/       # Articles and papers
├── ideas/             # Creative concepts
└── pages/             # Static pages
```

### Build System (`/scripts/`)

```
scripts/
├── generate-static-content.js    # Content processing
├── vite-plugin-html-pages.ts    # Vite plugin
├── html-template.ts             # HTML templates
└── dev-server-plugin.ts         # Dev server plugin
```

## 🎨 Styling Guidelines

### Tailwind CSS Usage

**Utility Classes:**
```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Click me
  </button>
</div>
```

**Responsive Design:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

**Custom CSS:**
```css
/* src/style.css */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
}

.custom-component {
  @apply bg-white p-4 rounded-lg;
  border: 1px solid var(--color-primary);
}
```

### Design System

**Colors:**
- Primary: Blue (#3b82f6)
- Secondary: Gray (#64748b)
- Success: Green (#10b981)
- Warning: Yellow (#f59e0b)
- Error: Red (#ef4444)

**Typography:**
- Headings: Inter font family
- Body: System font stack
- Code: Monaco, Menlo, monospace

**Spacing:**
- Consistent 4px base unit
- Tailwind spacing scale
- Responsive spacing utilities

## 🧪 Testing

### Manual Testing

**Content Testing:**
1. Add new content files
2. Verify content appears correctly
3. Test different content types
4. Check metadata display

**Component Testing:**
1. Test all interactive elements
2. Verify responsive behavior
3. Check error states
4. Test navigation

**Build Testing:**
1. Run production build
2. Test static HTML generation
3. Verify asset loading
4. Check SEO metadata

### Error Testing

**Error Boundaries:**
```tsx
// Test error boundary behavior
<ErrorBoundary context="TestComponent">
  <ComponentThatThrows />
</ErrorBoundary>
```

**Content Errors:**
- Invalid frontmatter
- Missing required fields
- Malformed markdown
- File permission issues

## 🐛 Debugging

### Common Issues

**Build Errors:**
```bash
# TypeScript errors
npx tsc --noEmit

# Check content files
ls -la content/*/

# Verify dependencies
npm ls
```

**Runtime Errors:**
- Check browser console
- Use React DevTools
- Verify content metadata
- Check network requests

**Content Issues:**
- Validate frontmatter YAML
- Check file permissions
- Verify content structure
- Review build logs

### Debug Tools

**Browser DevTools:**
- React DevTools extension
- Network tab for asset loading
- Console for error messages
- Elements tab for DOM inspection

**Build Debugging:**
```bash
# Verbose build output
npm run build -- --debug

# Check generated files
ls -la dist/
cat dist/content-metadata.json
```

## 🔄 Git Workflow

### Branch Strategy

**Main Branch:**
- `main` - Production-ready code
- Protected branch
- Requires pull request reviews

**Development Branches:**
- `feature/description` - New features
- `fix/description` - Bug fixes
- `content/description` - Content updates

### Commit Guidelines

**Commit Messages:**
```
feat: add new content type support
fix: resolve navigation issue
docs: update development guide
style: improve button styling
refactor: simplify content processing
```

**Content Commits:**
```
content: add new note about AI
content: update about page
content: fix typo in publication
```

## 📦 Dependencies

### Core Dependencies

**React Ecosystem:**
- `react` - UI library
- `react-dom` - DOM rendering
- `@headlessui/react` - Accessible components
- `@heroicons/react` - Icon library

**Build Tools:**
- `vite` - Build tool and dev server
- `typescript` - Type checking
- `tailwindcss` - CSS framework
- `postcss` - CSS processing

**Content Processing:**
- `marked` - Markdown parsing
- `gray-matter` - Frontmatter parsing
- `yaml` - YAML processing

### Development Dependencies

**Type Definitions:**
- `@types/react` - React types
- `@types/react-dom` - React DOM types
- `@types/node` - Node.js types
- `@types/marked` - Marked types

**Build Tools:**
- `@vitejs/plugin-react` - React plugin
- `autoprefixer` - CSS vendor prefixes
- `@tailwindcss/postcss` - Tailwind PostCSS plugin

## 🚀 Performance Optimization

### Build Performance

**Optimization Strategies:**
- Use `npm ci` for faster installs
- Enable build caching
- Optimize content processing
- Minimize bundle size

**Monitoring:**
```bash
# Analyze bundle size
npm run build -- --analyze

# Check build time
time npm run build
```

### Runtime Performance

**React Optimizations:**
- Use `React.memo` for expensive components
- Implement lazy loading
- Optimize re-renders
- Use proper key props

**Asset Optimization:**
- Optimize images
- Use appropriate formats
- Implement lazy loading
- Minimize HTTP requests

## 🔒 Security Considerations

### Content Security

**Input Validation:**
- Validate frontmatter data
- Sanitize HTML content
- Check file permissions
- Validate file paths

**Build Security:**
- Use HTTPS in production
- Implement CSP headers
- Validate dependencies
- Regular security updates

### Development Security

**API Keys:**
- Never commit API keys
- Use environment variables
- Rotate keys regularly
- Monitor usage

**Dependencies:**
- Regular security audits
- Update dependencies
- Use trusted packages
- Review package sources

## 📚 Additional Resources

### Documentation
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

### Tools
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [TypeScript Hero](https://marketplace.visualstudio.com/items?itemName=rbbit.typescript-hero)

---

This development guide provides everything needed to effectively develop and maintain the Web Presence project.
