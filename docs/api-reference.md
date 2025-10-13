# API Reference

This document provides comprehensive API reference for all components, utilities, and interfaces in the Web Presence project.

## 📦 Core Types

### ContentItem

```typescript
interface ContentItem {
  slug: string
  title: string
  date: string
  readTime: string
  type: 'note' | 'publication' | 'idea' | 'page'
  excerpt: string
  content?: string
  html?: string
}
```

**Properties:**
- `slug` - URL-friendly identifier
- `title` - Display title
- `date` - Publication date (YYYY-MM-DD)
- `readTime` - Estimated reading time
- `type` - Content type category
- `excerpt` - Brief description
- `content` - Raw markdown content
- `html` - Processed HTML content

### ContentList

```typescript
interface ContentList {
  notes: ContentItem[]
  publications: ContentItem[]
  ideas: ContentItem[]
  pages: ContentItem[]
  latest: ContentItem[]
}
```

**Properties:**
- `notes` - Array of note content items
- `publications` - Array of publication content items
- `ideas` - Array of idea content items
- `pages` - Array of page content items
- `latest` - Combined recent content (all types)

### PageData

```typescript
interface PageData {
  type: 'about' | 'contact' | 'notes' | 'publications' | 'ideas' | 'content'
  data: {
    notes?: ContentItem[]
    publications?: ContentItem[]
    ideas?: ContentItem[]
    content?: ContentItem
    type?: string
  }
}
```

**Properties:**
- `type` - Page type identifier
- `data` - Page-specific data object

## 🧩 Components

### App

**Main application component with routing and error handling.**

```typescript
export default function App(): JSX.Element
```

**Features:**
- Client-side routing
- Error boundary integration
- Loading states
- Page data management

### Button

**Reusable button component with variants.**

```typescript
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function Button(props: ButtonProps): JSX.Element
```

**Variants:**
- `primary` - Blue background, white text
- `secondary` - Gray background, white text
- `outline` - Transparent background, colored border
- `ghost` - Transparent background, colored text

**Sizes:**
- `sm` - Small padding and text
- `md` - Medium padding and text (default)
- `lg` - Large padding and text

### Container

**Layout wrapper component with consistent spacing.**

```typescript
interface ContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export function Container(props: ContainerProps): JSX.Element
```

**Max Width Options:**
- `sm` - 640px
- `md` - 768px
- `lg` - 1024px
- `xl` - 1280px
- `2xl` - 1536px
- `full` - 100%

### ErrorBoundary

**React error boundary for graceful error handling.**

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  context?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State>
```

**Features:**
- Catches JavaScript errors in child components
- Displays fallback UI
- Logs errors for debugging
- Context-aware error reporting

### Link

**Internal and external link component.**

```typescript
interface LinkProps {
  href: string
  children: React.ReactNode
  className?: string
  external?: boolean
  target?: '_blank' | '_self' | '_parent' | '_top'
  rel?: string
}

export function Link(props: LinkProps): JSX.Element
```

**Features:**
- Automatic external link detection
- Security attributes for external links
- Consistent styling
- Accessibility support

### Navbar

**Site navigation component.**

```typescript
interface NavbarProps {
  className?: string
}

export function Navbar(props: NavbarProps): JSX.Element
```

**Features:**
- Responsive navigation
- Active page highlighting
- Mobile menu support
- Logo integration

### Footer

**Site footer component.**

```typescript
interface FooterProps {
  className?: string
}

export function Footer(props: FooterProps): JSX.Element
```

**Features:**
- Social media links
- Copyright information
- Additional navigation
- Contact information

## 📄 Page Components

### HomePage

**Landing page with content overview.**

```typescript
export function HomePage(): JSX.Element
```

**Features:**
- Latest content display
- Content type filtering
- Search functionality
- Call-to-action sections

### ContentPage

**Individual content item display.**

```typescript
interface ContentPageProps {
  content: ContentItem
  type: 'note' | 'publication' | 'idea' | 'page'
}

export function ContentPage(props: ContentPageProps): JSX.Element
```

**Features:**
- Markdown rendering
- SEO metadata
- Social sharing
- Reading time display
- Tag/category display

### IdeasPage

**Ideas listing and filtering.**

```typescript
interface IdeasPageProps {
  ideas: ContentItem[]
}

export function IdeasPage(props: IdeasPageProps): JSX.Element
```

**Features:**
- Ideas grid layout
- Filtering by tags
- Search functionality
- Sort options

### NotesPage

**Notes listing and filtering.**

```typescript
interface NotesPageProps {
  notes: ContentItem[]
}

export function NotesPage(props: NotesPageProps): JSX.Element
```

**Features:**
- Notes list layout
- Date-based sorting
- Tag filtering
- Search functionality

### PublicationsPage

**Publications listing and filtering.**

```typescript
interface PublicationsPageProps {
  publications: ContentItem[]
}

export function PublicationsPage(props: PublicationsPageProps): JSX.Element
```

**Features:**
- Publications grid
- Author information
- Publication date sorting
- Category filtering

### AboutPage

**About page content.**

```typescript
export function AboutPage(): JSX.Element
```

**Features:**
- Personal information
- Skills and experience
- Contact information
- Professional summary

### ContactPage

**Contact page with form and information.**

```typescript
export function ContactPage(): JSX.Element
```

**Features:**
- Contact form
- Contact information
- Social media links
- Location information

## 🎣 Hooks

### useErrorHandler

**Custom hook for error handling.**

```typescript
interface UseErrorHandlerReturn {
  error: Error | null
  handleError: (error: Error) => void
  clearError: () => void
}

export function useErrorHandler(): UseErrorHandlerReturn
```

**Features:**
- Error state management
- Error logging
- Error clearing
- Context-aware error handling

## 🛠️ Utilities

### Content Processor

**Content management utilities.**

```typescript
// Get all content
export function getAllContent(): ContentList

// Get content by type
export function getContentByType(
  type: 'notes' | 'publications' | 'ideas' | 'pages'
): ContentItem[]

// Get content by slug
export function getContentBySlug(
  type: 'notes' | 'publications' | 'ideas' | 'pages',
  slug: string
): ContentItem | null

// Get page by slug
export function getPageBySlug(slug: string): ContentItem | null

// Get latest content
export function getLatestContent(limit?: number): ContentItem[]
```

### Router

**Client-side routing utilities.**

```typescript
// Get current page data
export function getCurrentPage(): PageData

// Navigate to page
export function navigateTo(path: string): void

// Get current path
export function getCurrentPath(): string
```

### Error Logger

**Error logging utilities.**

```typescript
// Log error
export function logError(error: Error, context?: string): void

// Log warning
export function logWarning(message: string, context?: string): void

// Log info
export function logInfo(message: string, context?: string): void
```

## 🔧 Build System APIs

### HTML Pages Plugin

**Vite plugin for static HTML generation.**

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

**Development server plugin for content watching.**

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

### Content Generator

**Content processing and metadata generation.**

```typescript
// Generate content metadata
export function generateContentMetadata(
  contentDir: string,
  rivveOutputDir: string
): ContentList

// Generate Rivve HTML files
export function generateRivveHTMLFiles(
  contentDir: string,
  rivveOutputDir: string
): void
```

## 🎨 Styling APIs

### Tailwind Configuration

**Tailwind CSS configuration.**

```typescript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Custom color palette
      },
      fontFamily: {
        // Custom font families
      },
      spacing: {
        // Custom spacing scale
      }
    }
  },
  plugins: []
} satisfies Config
```

### CSS Variables

**CSS custom properties for theming.**

```css
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-background: #ffffff;
  --color-text: #1f2937;
  --color-text-muted: #6b7280;
}
```

## 🔍 SEO APIs

### Meta Tag Generation

**SEO metadata generation utilities.**

```typescript
interface MetaTag {
  name?: string
  property?: string
  content: string
}

// Generate meta tags for content
export function generateMetaTags(content: ContentItem): MetaTag[]

// Generate Open Graph tags
export function generateOpenGraphTags(content: ContentItem): MetaTag[]

// Generate Twitter Card tags
export function generateTwitterTags(content: ContentItem): MetaTag[]
```

### Structured Data

**JSON-LD structured data generation.**

```typescript
interface StructuredData {
  '@context': string
  '@type': string
  [key: string]: any
}

// Generate article structured data
export function generateArticleStructuredData(
  content: ContentItem
): StructuredData

// Generate website structured data
export function generateWebsiteStructuredData(): StructuredData
```

## 🚀 Performance APIs

### Performance Monitoring

**Performance measurement utilities.**

```typescript
interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage: number
}

// Measure component performance
export function measurePerformance(
  componentName: string
): PerformanceMetrics

// Track page load time
export function trackPageLoad(path: string): void
```

### Bundle Analysis

**Bundle size and performance analysis.**

```typescript
// Analyze bundle size
export function analyzeBundle(): BundleAnalysis

// Get asset sizes
export function getAssetSizes(): AssetSizes
```

## 🔒 Security APIs

### Input Validation

**Content and input validation utilities.**

```typescript
// Validate frontmatter
export function validateFrontmatter(
  frontmatter: any
): ValidationResult

// Sanitize HTML content
export function sanitizeHtml(html: string): string

// Validate file paths
export function validateFilePath(path: string): boolean
```

### Content Security

**Content security utilities.**

```typescript
// Check content permissions
export function checkContentPermissions(
  content: ContentItem
): boolean

// Validate external links
export function validateExternalLink(url: string): boolean
```

## 📊 Analytics APIs

### Event Tracking

**Analytics event tracking.**

```typescript
// Track page view
export function trackPageView(path: string): void

// Track custom event
export function trackEvent(
  action: string,
  category: string,
  label?: string
): void

// Track content engagement
export function trackContentEngagement(
  content: ContentItem,
  action: string
): void
```

### Content Analytics

**Content performance analytics.**

```typescript
// Get content statistics
export function getContentStats(): ContentStats

// Track content views
export function trackContentView(content: ContentItem): void

// Get popular content
export function getPopularContent(limit?: number): ContentItem[]
```

---

This API reference provides comprehensive documentation for all public APIs, components, and utilities in the Web Presence project.
