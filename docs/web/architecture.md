# Web Architecture

Frontend system architecture and design patterns.

## 🏗️ Architecture Overview

The frontend is a hybrid static/dynamic website that combines:
- **React SPA** for interactive pages and navigation
- **Static HTML generation** for SEO-optimized content pages
- **AI-powered content processing** via Rivve integration
- **Markdown-based content management** with frontmatter support

## 📁 Project Structure

```
web/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Button.tsx       # Button component
│   │   ├── Container.tsx    # Layout wrapper
│   │   ├── ErrorBoundary.tsx # Error handling
│   │   ├── Link.tsx         # Link component
│   │   ├── PageNavigation.tsx # Navigation
│   │   ├── Footer.tsx       # Site footer
│   │   └── access-modal.tsx # Access control modal
│   ├── pages/               # Page components
│   │   ├── HomePage.tsx     # Landing page
│   │   ├── ContentPage.tsx  # Individual content
│   │   ├── IdeasPage.tsx    # Ideas listing
│   │   ├── NotesPage.tsx    # Notes listing
│   │   ├── PublicationsPage.tsx # Publications listing
│   │   ├── AboutPage.tsx    # About page
│   │   └── ContactPage.tsx  # Contact page
│   ├── hooks/               # Custom React hooks
│   │   ├── useErrorHandler.ts # Error handling
│   │   └── use-protected-content.ts # Content access
│   ├── utils/               # Utility functions
│   │   ├── api-client.ts    # API communication
│   │   ├── content-processor.ts # Content management
│   │   ├── router.ts        # Client-side routing
│   │   └── error-logger.ts  # Error logging
│   ├── config/              # Configuration
│   │   └── environment.ts   # Environment settings
│   └── data/                # Generated content metadata
│       └── content-metadata.json # Content index
├── scripts/                 # Build scripts
│   ├── generate-static-content.js # Content processing
│   ├── html-template.ts     # HTML generation
│   └── vite-plugin-html-pages.ts # Vite plugin
├── dist/                    # Build output
│   ├── assets/              # Optimized assets
│   ├── notes/               # Static HTML for notes
│   ├── publications/        # Static HTML for publications
│   ├── ideas/               # Static HTML for ideas
│   └── content-metadata.json # Content index
└── package.json             # Dependencies
```

## 🔧 Key Technologies

### Frontend Stack
- **React 18** - UI framework with hooks
- **TypeScript** - Type safety and developer experience
- **Vite** - Build tool and dev server
- **Tailwind CSS 4.x** - Utility-first styling
- **Headless UI** - Accessible components
- **Framer Motion** - Animations
- **Heroicons** - Icon library

### Build System
- **Vite** - Fast build tool and dev server
- **PostCSS** - CSS processing
- **Custom Plugins** - HTML generation and content processing
- **TypeScript** - Compilation and type checking

### Content Management
- **Markdown** - Content format with YAML frontmatter
- **Rivve** - AI-powered content processing
- **Static Generation** - SEO-optimized HTML output

## 🎯 Design Patterns

### Component Architecture

**Functional Components with Hooks:**
```typescript
export function Button({ 
  children, 
  variant = 'primary', 
  onClick 
}: ButtonProps) {
  return (
    <button 
      className={getButtonClasses(variant)}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

**Error Boundary Pattern:**
```typescript
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback />
    }

    return this.props.children
  }
}
```

### State Management

**Custom Hooks for State:**
```typescript
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null)

  const handleError = useCallback((error: Error) => {
    setError(error)
    logError(error)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, clearError }
}
```

**Content Access Hook:**
```typescript
export function useProtectedContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [content, setContent] = useState<ProtectedContentResponse | null>(null)

  const checkAccess = useCallback(async (type: string, slug: string) => {
    // Check access requirements
  }, [])

  const verifyCredentials = useCallback(async (credentials: Credentials) => {
    // Verify password or email
  }, [])

  return {
    isLoading,
    error,
    isModalOpen,
    content,
    checkAccess,
    verifyCredentials
  }
}
```

### API Communication

**Centralized API Client:**
```typescript
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async checkAccess(type: string, slug: string): Promise<AccessCheckResponse> {
    const response = await fetch(`${this.baseUrl}/auth/access/${type}/${slug}`)
    return response.json()
  }

  async verifyCredentials(request: VerifyRequest): Promise<VerifyResponse> {
    const response = await fetch(`${this.baseUrl}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
    return response.json()
  }

  async getProtectedContent(type: string, slug: string, token: string): Promise<ContentResponse> {
    const response = await fetch(`${this.baseUrl}/auth/content/${type}/${slug}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return response.json()
  }
}
```

## 🔄 Content Flow

### Content Processing Pipeline

```
Markdown Files
      ↓
Frontmatter Parsing
      ↓
Content Processing
      ↓
HTML Generation
      ↓
Metadata Extraction
      ↓
Static HTML Files
      ↓
React SPA Integration
```

### Access Control Flow

```
User Clicks Content
      ↓
Check Access Requirements
      ↓
Determine Access Mode
      ├─ Open → Load Content
      ├─ Password → Show Password Modal
      └─ Email-List → Show Email Modal
      ↓
User Provides Credentials
      ↓
Verify with Backend
      ↓
Store Token
      ↓
Fetch Protected Content
      ↓
Display Content
```

## 🎨 Styling Architecture

### Tailwind CSS Configuration

**Custom Design System:**
```typescript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
} satisfies Config
```

**Component Styling Pattern:**
```typescript
const buttonVariants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
}

function getButtonClasses(variant: keyof typeof buttonVariants) {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors'
  return `${baseClasses} ${buttonVariants[variant]}`
}
```

## 🚀 Build Process

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
1. **Content Processing** - Parse markdown and generate HTML
2. **TypeScript Compilation** - Type checking and compilation
3. **Vite Build** - Bundle React application and optimize assets
4. **Static Generation** - Generate SEO-optimized HTML files

## 🔒 Security Considerations

### Content Access Control

**Three-Tier Access System:**
- **Open** - Public content, no authentication
- **Password** - Password-protected content
- **Email-List** - Restricted to approved emails

**Token Management:**
- JWT tokens for authenticated access
- 24-hour token expiration
- Secure token storage in sessionStorage

### Input Validation

**Content Sanitization:**
```typescript
export function sanitizeHtml(html: string): string {
  // Sanitize HTML content to prevent XSS
  return DOMPurify.sanitize(html)
}
```

**Form Validation:**
```typescript
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
```

## 📊 Performance Optimization

### Bundle Optimization

**Code Splitting:**
```typescript
const LazyComponent = lazy(() => import('./LazyComponent'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <LazyComponent />
    </Suspense>
  )
}
```

**Asset Optimization:**
- Tree shaking for unused code elimination
- Image optimization and lazy loading
- CSS purging for unused styles
- Gzip compression for assets

### Caching Strategy

**Static Assets:**
- Long-term caching for immutable assets
- Cache busting for updated content
- CDN distribution for global performance

**Content Caching:**
- Client-side caching for content metadata
- Token-based caching for protected content
- Local storage for user preferences

## 🧪 Testing Strategy

### Component Testing

**Unit Tests:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

test('renders button with correct text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})

test('calls onClick when clicked', () => {
  const handleClick = jest.fn()
  render(<Button onClick={handleClick}>Click me</Button>)
  fireEvent.click(screen.getByText('Click me'))
  expect(handleClick).toHaveBeenCalledTimes(1)
})
```

**Integration Tests:**
```typescript
test('access control flow works correctly', async () => {
  render(<ContentPage content={protectedContent} />)
  
  // Should show access modal
  expect(screen.getByText('Password Protected')).toBeInTheDocument()
  
  // Enter password
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'test123' } })
  fireEvent.click(screen.getByText('Access Content'))
  
  // Should load content
  await waitFor(() => {
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
```

## 🔧 Development Workflow

### Local Development

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Content Changes:**
   - Edit markdown files in `/content/`
   - Changes auto-reload in browser
   - No build step required

3. **Code Changes:**
   - Edit React components in `/src/`
   - Hot module replacement
   - Instant feedback

### Content Management

1. **Add New Content:**
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

2. **Process Content:**
   ```bash
   # Generate content metadata
   npm run build:content
   
   # Or full build
   npm run build
   ```

## 🚨 Troubleshooting

### Common Issues

**Build Issues:**
- Check TypeScript errors: `npx tsc --noEmit`
- Verify content files: Check `/content/` structure
- Review plugin logs: Look for Vite plugin output

**Runtime Issues:**
- Use React DevTools
- Check browser console
- Verify content metadata JSON

**Performance Issues:**
- Analyze bundle with `npm run build -- --analyze`
- Check for memory leaks in React DevTools
- Monitor network requests in browser dev tools

### Debug Mode

Enable debug logging by setting environment variable:
```bash
NODE_ENV=development
```

## 📚 Type Definitions

All types are defined in `/types/api.ts` and shared between frontend and backend for type safety.

**Key Types:**
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

interface AccessCheckResponse {
  accessMode: 'open' | 'password' | 'email-list'
  requiresPassword: boolean
  requiresEmail: boolean
  message: string
}

interface VerifyRequest {
  type: string
  slug: string
  password?: string
  email?: string
}
```

## 🔄 Integration with Backend

The frontend communicates with the API through:
- Proxy configuration in Vite (development)
- Direct API calls (production)
- Shared TypeScript types for type safety
- JWT token management in session storage

**API Integration:**
```typescript
// Environment configuration
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787',
  endpoints: {
    accessCheck: '/auth/access',
    verify: '/auth/verify',
    content: '/auth/content',
    health: '/health'
  }
}

// API client usage
const apiClient = new ApiClient(config.apiBaseUrl)
const accessInfo = await apiClient.checkAccess('notes', 'my-note')
```
