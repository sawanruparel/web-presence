# Web Components

React component reference and usage guide.

## 📦 Core Components

### Button

Reusable button component with variants and sizes.

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

**Usage:**
```tsx
<Button variant="primary" size="lg" onClick={handleClick}>
  Click me
</Button>
```

### Container

Layout wrapper component with consistent spacing.

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

**Usage:**
```tsx
<Container maxWidth="lg">
  <h1>Page Content</h1>
</Container>
```

### ErrorBoundary

React error boundary for graceful error handling.

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

**Usage:**
```tsx
<ErrorBoundary 
  fallback={<ErrorFallback />}
  onError={(error, errorInfo) => logError(error, errorInfo)}
  context="ContentPage"
>
  <ContentPage content={content} />
</ErrorBoundary>
```

### Link

Internal and external link component.

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

**Usage:**
```tsx
<Link href="/notes/my-note">Internal Link</Link>
<Link href="https://example.com" external>External Link</Link>
```

### PageNavigation

Page-level navigation component.

```typescript
interface PageNavigationProps {
  currentPage?: string
}

export function PageNavigation(props: PageNavigationProps): JSX.Element
```

**Features:**
- Active page highlighting
- Consistent navigation across pages
- Reusable component
- Clean, minimal design

**Usage:**
```tsx
<PageNavigation currentPage="notes" />
```

### Footer

Site footer component.

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

**Usage:**
```tsx
<Footer />
```

## 🔐 Access Control Components

### AccessModal

Unified modal for all access control modes.

```typescript
interface AccessModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (credentials: { password?: string; email?: string }) => Promise<void>
  title: string
  accessMode: 'open' | 'password' | 'email-list'
  description?: string
  isLoading?: boolean
  error?: string
}

export function AccessModal(props: AccessModalProps): JSX.Element
```

**Features:**
- Supports all three access modes
- Adaptive UI based on access mode
- Password input for password mode
- Email input for email-list mode
- Open access button for open mode
- Error handling and loading states

**Usage:**
```tsx
<AccessModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSubmit={handleCredentials}
  title="My Article"
  accessMode="password"
  description="This content is password protected"
  isLoading={isLoading}
  error={error}
/>
```

### PasswordModal (Legacy)

Legacy password-only modal component.

```typescript
interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (password: string) => Promise<void>
  title: string
  isLoading?: boolean
  error?: string
}

export function PasswordModal(props: PasswordModalProps): JSX.Element
```

**Note:** This component is deprecated in favor of `AccessModal`.

## 📄 Page Components

### HomePage

Landing page with content overview.

```typescript
export function HomePage(): JSX.Element
```

**Features:**
- Latest content display
- Content type filtering
- Search functionality
- Call-to-action sections

### ContentPage

Individual content item display.

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
- Access control integration

### IdeasPage

Ideas listing and filtering.

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

Notes listing and filtering.

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

Publications listing and filtering.

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

About page content.

```typescript
export function AboutPage(): JSX.Element
```

**Features:**
- Personal information
- Skills and experience
- Contact information
- Professional summary

### ContactPage

Contact page with form and information.

```typescript
export function ContactPage(): JSX.Element
```

**Features:**
- Contact form
- Contact information
- Social media links
- Location information

## 🎣 Custom Hooks

### useErrorHandler

Custom hook for error handling.

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

**Usage:**
```tsx
function MyComponent() {
  const { error, handleError, clearError } = useErrorHandler()

  const handleAsyncOperation = async () => {
    try {
      await someAsyncOperation()
    } catch (err) {
      handleError(err)
    }
  }

  if (error) {
    return <ErrorDisplay error={error} onClear={clearError} />
  }

  return <div>Content</div>
}
```

### useProtectedContent

Custom hook for protected content access.

```typescript
interface UseProtectedContentState {
  isLoading: boolean
  error: string | null
  isModalOpen: boolean
  content: ProtectedContentResponse | null
  accessMode: 'open' | 'password' | 'email-list' | null
  description: string | null
}

interface UseProtectedContentReturn extends UseProtectedContentState {
  checkAccess: (type: string, slug: string) => Promise<boolean>
  verifyCredentials: (credentials: { password?: string; email?: string }) => Promise<void>
  fetchContent: (type: string, slug: string) => Promise<void>
  openModal: () => void
  closeModal: () => void
}

export function useProtectedContent(): UseProtectedContentReturn
```

**Features:**
- Access mode checking
- Credential verification
- Content fetching
- Modal state management
- Token management
- Error handling

**Usage:**
```tsx
function ContentPage({ content, type }) {
  const {
    isLoading,
    error,
    isModalOpen,
    accessMode,
    description,
    checkAccess,
    verifyCredentials,
    fetchContent,
    openModal,
    closeModal
  } = useProtectedContent()

  useEffect(() => {
    const loadContent = async () => {
      const hasAccess = await checkAccess(type, content.slug)
      if (hasAccess) {
        await fetchContent(type, content.slug)
      }
    }
    loadContent()
  }, [type, content.slug])

  return (
    <div>
      {isModalOpen && (
        <AccessModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSubmit={verifyCredentials}
          title={content.title}
          accessMode={accessMode}
          description={description}
          isLoading={isLoading}
          error={error}
        />
      )}
      {/* Content display */}
    </div>
  )
}
```

## 🛠️ Utility Components

### LoadingSpinner

Loading indicator component.

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner(props: LoadingSpinnerProps): JSX.Element
```

### ErrorDisplay

Error display component.

```typescript
interface ErrorDisplayProps {
  error: Error | string
  onRetry?: () => void
  onClear?: () => void
  className?: string
}

export function ErrorDisplay(props: ErrorDisplayProps): JSX.Element
```

### ContentCard

Content item card component.

```typescript
interface ContentCardProps {
  content: ContentItem
  type: 'note' | 'publication' | 'idea' | 'page'
  onClick?: () => void
  className?: string
}

export function ContentCard(props: ContentCardProps): JSX.Element
```

## 🎨 Styling Patterns

### Component Styling

**Tailwind CSS Classes:**
```tsx
const buttonVariants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-blue-500'
}

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
}

function getButtonClasses(variant: string, size: string) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  return `${baseClasses} ${buttonVariants[variant]} ${buttonSizes[size]}`
}
```

**Responsive Design:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <ContentCard key={item.slug} content={item} />
  ))}
</div>
```

**Dark Mode Support:**
```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <h1 className="text-2xl font-bold">Title</h1>
</div>
```

## 🧪 Testing Components

### Testing Utilities

**Render Helper:**
```typescript
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from './ThemeProvider'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ThemeProvider>
  )
}

const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

**Mock Components:**
```typescript
jest.mock('./AccessModal', () => ({
  AccessModal: ({ isOpen, onClose, onSubmit }: any) => (
    isOpen ? (
      <div data-testid="access-modal">
        <button onClick={() => onSubmit({ password: 'test123' })}>
          Submit
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  )
}))
```

### Component Tests

**Button Component Test:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  test('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  test('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('applies correct variant classes', () => {
    render(<Button variant="primary">Click me</Button>)
    const button = screen.getByText('Click me')
    expect(button).toHaveClass('bg-blue-600', 'text-white')
  })

  test('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    const button = screen.getByText('Click me')
    expect(button).toBeDisabled()
  })
})
```

**AccessModal Component Test:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AccessModal } from './AccessModal'

describe('AccessModal', () => {
  test('renders password input for password mode', () => {
    render(
      <AccessModal
        isOpen={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        title="Test Content"
        accessMode="password"
      />
    )
    
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByText('Password Protected')).toBeInTheDocument()
  })

  test('renders email input for email-list mode', () => {
    render(
      <AccessModal
        isOpen={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        title="Test Content"
        accessMode="email-list"
      />
    )
    
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByText('Email Verification Required')).toBeInTheDocument()
  })

  test('calls onSubmit with correct credentials', async () => {
    const handleSubmit = jest.fn()
    render(
      <AccessModal
        isOpen={true}
        onClose={jest.fn()}
        onSubmit={handleSubmit}
        title="Test Content"
        accessMode="password"
      />
    )
    
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'test123' } })
    fireEvent.click(screen.getByText('Access Content'))
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({ password: 'test123' })
    })
  })
})
```

## 📚 Component Library

### Installation

```bash
npm install @headlessui/react @heroicons/react
```

### Dependencies

**Required:**
- React 18+
- TypeScript 4.9+
- Tailwind CSS 4.x

**Optional:**
- Framer Motion (for animations)
- React Hook Form (for forms)
- React Query (for data fetching)

### Usage Guidelines

1. **Import Components:**
   ```tsx
   import { Button, Container, ErrorBoundary } from '@/components'
   ```

2. **Use TypeScript:**
   ```tsx
   interface MyComponentProps {
     title: string
     onClick: () => void
   }
   
   export function MyComponent({ title, onClick }: MyComponentProps) {
     return <Button onClick={onClick}>{title}</Button>
   }
   ```

3. **Follow Accessibility Guidelines:**
   - Use semantic HTML elements
   - Provide proper ARIA labels
   - Ensure keyboard navigation
   - Test with screen readers

4. **Test Components:**
   ```bash
   npm test -- --testPathPattern=components
   ```

## 🔧 Customization

### Theme Customization

**Tailwind Configuration:**
```typescript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a'
        }
      }
    }
  }
}
```

**CSS Variables:**
```css
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --spacing-unit: 0.25rem;
}
```

### Component Customization

**Extending Components:**
```tsx
interface CustomButtonProps extends ButtonProps {
  icon?: React.ReactNode
  loading?: boolean
}

export function CustomButton({ icon, loading, children, ...props }: CustomButtonProps) {
  return (
    <Button {...props} disabled={loading || props.disabled}>
      {loading ? <LoadingSpinner size="sm" /> : icon}
      {children}
    </Button>
  )
}
```

**Creating New Components:**
```tsx
interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'outlined' | 'elevated'
  className?: string
}

export function Card({ children, variant = 'default', className }: CardProps) {
  const baseClasses = 'rounded-lg p-6'
  const variantClasses = {
    default: 'bg-white border border-gray-200',
    outlined: 'bg-white border-2 border-gray-300',
    elevated: 'bg-white shadow-lg'
  }
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  )
}
```
