# Component Patterns for AI Tools

This document provides comprehensive patterns and conventions for creating and modifying React components in the Web Presence project.

## 🧩 Component Architecture

### Functional Components with TypeScript

**Always use functional components with proper TypeScript interfaces:**

```typescript
interface ComponentProps {
  title: string
  description?: string
  className?: string
  children?: React.ReactNode
  onClick?: () => void
}

export function Component({ 
  title, 
  description, 
  className,
  children,
  onClick 
}: ComponentProps) {
  return (
    <div className={clsx('base-classes', className)}>
      <h2 className="text-xl font-semibold">{title}</h2>
      {description && (
        <p className="text-gray-600">{description}</p>
      )}
      {children}
      {onClick && (
        <button onClick={onClick} className="btn-primary">
          Action
        </button>
      )}
    </div>
  )
}
```

### Component Naming Conventions

- **PascalCase** for component names
- **Descriptive names** that indicate purpose
- **Consistent suffixes** for similar components
- **File names** match component names

**Examples:**
- `Button.tsx` → `Button` component
- `ContentCard.tsx` → `ContentCard` component
- `ErrorBoundary.tsx` → `ErrorBoundary` component

## 🎨 Styling Patterns

### Tailwind CSS Usage

**Use Tailwind utility classes with consistent patterns:**

```typescript
// Layout and spacing
<div className="container mx-auto px-4 py-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Content */}
  </div>
</div>

// Typography
<h1 className="text-3xl font-bold text-gray-900 mb-4">
  Main Heading
</h1>
<p className="text-lg text-gray-600 leading-relaxed">
  Body text with proper line height
</p>

// Interactive elements
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
  Click me
</button>
```

### Responsive Design Patterns

**Mobile-first responsive design:**

```typescript
// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* Responsive grid items */}
</div>

// Responsive text
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Responsive heading
</h1>

// Responsive spacing
<div className="p-4 sm:p-6 lg:p-8">
  {/* Responsive padding */}
</div>
```

### CSS Custom Properties

**Use CSS custom properties for theming:**

```typescript
// In component
<div 
  className="bg-white border rounded-lg p-4"
  style={{ 
    borderColor: 'var(--color-primary)',
    color: 'var(--color-text)'
  }}
>
  Themed content
</div>
```

## 🔧 State Management Patterns

### useState Hook

**Use useState for local component state:**

```typescript
export function InteractiveComponent() {
  const [isOpen, setIsOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [data, setData] = useState<DataItem[]>([])

  const handleToggle = () => {
    setIsOpen(prev => !prev)
  }

  const handleIncrement = () => {
    setCount(prev => prev + 1)
  }

  return (
    <div>
      <button onClick={handleToggle}>
        {isOpen ? 'Close' : 'Open'}
      </button>
      <span>Count: {count}</span>
    </div>
  )
}
```

### useEffect Hook

**Use useEffect for side effects:**

```typescript
export function DataComponent() {
  const [data, setData] = useState<DataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await fetchDataFromAPI()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, []) // Empty dependency array for mount-only effect

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
```

### Custom Hooks

**Create custom hooks for reusable logic:**

```typescript
// Custom hook for content management
export function useContent(type?: ContentType) {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const allContent = getAllContent()
      const filteredContent = type ? allContent[type] : allContent.latest
      setContent(filteredContent)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [type])

  return { content, loading, error }
}

// Usage in component
export function ContentList() {
  const { content, loading, error } = useContent('notes')
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <div>
      {content.map(item => (
        <ContentCard key={item.slug} content={item} />
      ))}
    </div>
  )
}
```

## 🎯 Component Composition Patterns

### Container Components

**Use container components for layout and data fetching:**

```typescript
// Container component
export function NotesContainer() {
  const { notes, loading, error } = useContent('notes')
  
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  
  return <NotesList notes={notes} />
}

// Presentational component
interface NotesListProps {
  notes: ContentItem[]
}

export function NotesList({ notes }: NotesListProps) {
  return (
    <div className="grid gap-4">
      {notes.map(note => (
        <NoteCard key={note.slug} note={note} />
      ))}
    </div>
  )
}
```

### Compound Components

**Use compound components for complex UI patterns:**

```typescript
// Compound component pattern
export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx('bg-white border rounded-lg shadow-sm', className)}>
      {children}
    </div>
  )
}

Card.Header = function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={clsx('p-4 border-b', className)}>
      {children}
    </div>
  )
}

Card.Body = function CardBody({ children, className }: CardBodyProps) {
  return (
    <div className={clsx('p-4', className)}>
      {children}
    </div>
  )
}

Card.Footer = function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={clsx('p-4 border-t bg-gray-50', className)}>
      {children}
    </div>
  )
}

// Usage
<Card>
  <Card.Header>
    <h3>Card Title</h3>
  </Card.Header>
  <Card.Body>
    <p>Card content</p>
  </Card.Body>
  <Card.Footer>
    <button>Action</button>
  </Card.Footer>
</Card>
```

## 🚨 Error Handling Patterns

### Error Boundaries

**Always wrap components that might error in error boundaries:**

```typescript
export function SafeComponent() {
  return (
    <ErrorBoundary 
      context="SafeComponent"
      fallback={<ErrorFallback />}
    >
      <ComponentThatMightError />
    </ErrorBoundary>
  )
}
```

### Error States in Components

**Handle error states gracefully:**

```typescript
export function DataComponent() {
  const [data, setData] = useState<DataItem[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleError = (err: Error) => {
    setError(err.message)
    logError(err, 'DataComponent')
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Error</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => setError(null)}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Component content */}
    </div>
  )
}
```

## 🎨 Animation Patterns

### Framer Motion Integration

**Use Framer Motion for smooth animations:**

```typescript
import { motion } from 'framer-motion'

export function AnimatedComponent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-4 bg-white rounded-lg"
    >
      Animated content
    </motion.div>
  )
}
```

### CSS Transitions

**Use CSS transitions for simple animations:**

```typescript
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors duration-200">
  Hover me
</button>
```

## 📱 Accessibility Patterns

### ARIA Attributes

**Always include proper ARIA attributes:**

```typescript
export function AccessibleButton() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <button
      onClick={() => setIsExpanded(!isExpanded)}
      aria-expanded={isExpanded}
      aria-controls="content"
      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
    >
      {isExpanded ? 'Collapse' : 'Expand'}
    </button>
  )
}
```

### Keyboard Navigation

**Ensure keyboard accessibility:**

```typescript
export function KeyboardAccessibleComponent() {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      // Handle action
    }
  }

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="focus:ring-2 focus:ring-blue-500 focus:outline-none"
    >
      Keyboard accessible content
    </div>
  )
}
```

## 🔄 Performance Patterns

### React.memo

**Use React.memo for expensive components:**

```typescript
export const ExpensiveComponent = React.memo(function ExpensiveComponent({ 
  data 
}: ExpensiveComponentProps) {
  // Expensive rendering logic
  return (
    <div>
      {data.map(item => (
        <ComplexItem key={item.id} item={item} />
      ))}
    </div>
  )
})
```

### useMemo and useCallback

**Use useMemo and useCallback for expensive calculations:**

```typescript
export function OptimizedComponent({ items, filter }: OptimizedComponentProps) {
  const filteredItems = useMemo(() => {
    return items.filter(item => item.category === filter)
  }, [items, filter])

  const handleClick = useCallback((id: string) => {
    // Handle click
  }, [])

  return (
    <div>
      {filteredItems.map(item => (
        <Item 
          key={item.id} 
          item={item} 
          onClick={handleClick}
        />
      ))}
    </div>
  )
}
```

## 🧪 Testing Patterns

### Component Testing Structure

**Structure tests for maintainability:**

```typescript
describe('Component', () => {
  it('renders with required props', () => {
    render(<Component title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('handles optional props', () => {
    render(<Component title="Test" description="Description" />)
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Component title="Test" onClick={handleClick} />)
    
    fireEvent.click(screen.getByText('Test'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## 📝 Documentation Patterns

### Component Documentation

**Document components with JSDoc:**

```typescript
/**
 * A reusable button component with multiple variants and sizes.
 * 
 * @param variant - The visual style variant
 * @param size - The size of the button
 * @param children - The button content
 * @param onClick - Click handler function
 * @param disabled - Whether the button is disabled
 */
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  onClick,
  disabled = false
}: ButtonProps) {
  // Component implementation
}
```

## 🚀 Common Component Patterns

### Loading States

```typescript
export function LoadingComponent() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Loading...</span>
    </div>
  )
}
```

### Empty States

```typescript
export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-4">
        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {/* Empty state icon */}
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
      <p className="text-gray-500 mb-4">{message}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  )
}
```

### Form Components

```typescript
export function FormField({ 
  label, 
  error, 
  children 
}: FormFieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
```

---

These component patterns provide a solid foundation for creating consistent, maintainable, and performant React components in the Web Presence project.
