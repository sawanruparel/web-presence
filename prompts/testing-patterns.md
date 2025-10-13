# Testing Patterns for AI Tools

This document provides comprehensive testing patterns and best practices for the Web Presence project.

## 🧪 Testing Strategy Overview

### Testing Pyramid

**Follow the testing pyramid approach:**

1. **Unit Tests** (70%) - Individual components and functions
2. **Integration Tests** (20%) - Component interactions and data flow
3. **End-to-End Tests** (10%) - Full user workflows

### Testing Tools

**Primary testing tools:**
- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **MSW** - API mocking
- **Playwright** - End-to-end testing

## 🔧 Unit Testing Patterns

### Component Testing

**Test React components with React Testing Library:**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies correct variant classes', () => {
    render(<Button variant="secondary">Click me</Button>)
    const button = screen.getByText('Click me')
    expect(button).toHaveClass('bg-gray-600')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    const button = screen.getByText('Click me')
    expect(button).toBeDisabled()
  })
})
```

### Custom Hook Testing

**Test custom hooks with renderHook:**

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCounter } from '../useCounter'

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current.count).toBe(0)
  })

  it('initializes with custom value', () => {
    const { result } = renderHook(() => useCounter(5))
    expect(result.current.count).toBe(5)
  })

  it('increments count', () => {
    const { result } = renderHook(() => useCounter())
    
    act(() => {
      result.current.increment()
    })
    
    expect(result.current.count).toBe(1)
  })

  it('decrements count', () => {
    const { result } = renderHook(() => useCounter(5))
    
    act(() => {
      result.current.decrement()
    })
    
    expect(result.current.count).toBe(4)
  })

  it('resets count', () => {
    const { result } = renderHook(() => useCounter(5))
    
    act(() => {
      result.current.increment()
      result.current.reset()
    })
    
    expect(result.current.count).toBe(5)
  })
})
```

### Utility Function Testing

**Test utility functions:**

```typescript
import { formatDate, parseDate, isValidDate } from '../dateUtils'

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-01')
      expect(formatDate(date)).toBe('January 1, 2024')
    })

    it('handles invalid date', () => {
      expect(formatDate(new Date('invalid'))).toBe('Invalid Date')
    })
  })

  describe('parseDate', () => {
    it('parses valid date string', () => {
      const result = parseDate('2024-01-01')
      expect(result).toEqual(new Date('2024-01-01'))
    })

    it('returns null for invalid date string', () => {
      const result = parseDate('invalid-date')
      expect(result).toBeNull()
    })
  })

  describe('isValidDate', () => {
    it('returns true for valid date', () => {
      expect(isValidDate(new Date('2024-01-01'))).toBe(true)
    })

    it('returns false for invalid date', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false)
    })
  })
})
```

## 🔄 Integration Testing Patterns

### Component Integration Testing

**Test component interactions:**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchForm } from '../SearchForm'
import { SearchResults } from '../SearchResults'

describe('Search Integration', () => {
  it('searches and displays results', async () => {
    const mockSearch = jest.fn().mockResolvedValue([
      { id: 1, title: 'Result 1' },
      { id: 2, title: 'Result 2' }
    ])

    render(
      <div>
        <SearchForm onSearch={mockSearch} />
        <SearchResults />
      </div>
    )

    const input = screen.getByPlaceholderText('Search...')
    const button = screen.getByText('Search')

    fireEvent.change(input, { target: { value: 'test query' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith('test query')
      expect(screen.getByText('Result 1')).toBeInTheDocument()
      expect(screen.getByText('Result 2')).toBeInTheDocument()
    })
  })

  it('handles search errors', async () => {
    const mockSearch = jest.fn().mockRejectedValue(new Error('Search failed'))

    render(
      <div>
        <SearchForm onSearch={mockSearch} />
        <SearchResults />
      </div>
    )

    const input = screen.getByPlaceholderText('Search...')
    const button = screen.getByText('Search')

    fireEvent.change(input, { target: { value: 'test query' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Search failed')).toBeInTheDocument()
    })
  })
})
```

### Data Flow Testing

**Test data flow between components:**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ContentProvider } from '../ContentProvider'
import { ContentList } from '../ContentList'
import { ContentFilter } from '../ContentFilter'

describe('Content Data Flow', () => {
  it('filters content when filter changes', async () => {
    const mockContent = [
      { id: 1, title: 'Note 1', type: 'note' },
      { id: 2, title: 'Article 1', type: 'publication' },
      { id: 3, title: 'Idea 1', type: 'idea' }
    ]

    render(
      <ContentProvider initialContent={mockContent}>
        <ContentFilter />
        <ContentList />
      </ContentProvider>
    )

    // Initially shows all content
    expect(screen.getByText('Note 1')).toBeInTheDocument()
    expect(screen.getByText('Article 1')).toBeInTheDocument()
    expect(screen.getByText('Idea 1')).toBeInTheDocument()

    // Filter by type
    const filterSelect = screen.getByLabelText('Filter by type')
    fireEvent.change(filterSelect, { target: { value: 'note' } })

    await waitFor(() => {
      expect(screen.getByText('Note 1')).toBeInTheDocument()
      expect(screen.queryByText('Article 1')).not.toBeInTheDocument()
      expect(screen.queryByText('Idea 1')).not.toBeInTheDocument()
    })
  })
})
```

## 🌐 API Testing Patterns

### Mock Service Worker (MSW)

**Mock API calls with MSW:**

```typescript
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { render, screen, waitFor } from '@testing-library/react'
import { DataComponent } from '../DataComponent'

// Mock API server
const server = setupServer(
  rest.get('/api/content', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, title: 'Mock Content 1' },
        { id: 2, title: 'Mock Content 2' }
      ])
    )
  }),
  rest.get('/api/content/:id', (req, res, ctx) => {
    const { id } = req.params
    return res(
      ctx.json({ id, title: `Mock Content ${id}` })
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('DataComponent', () => {
  it('fetches and displays data', async () => {
    render(<DataComponent />)

    await waitFor(() => {
      expect(screen.getByText('Mock Content 1')).toBeInTheDocument()
      expect(screen.getByText('Mock Content 2')).toBeInTheDocument()
    })
  })

  it('handles API errors', async () => {
    server.use(
      rest.get('/api/content', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }))
      })
    )

    render(<DataComponent />)

    await waitFor(() => {
      expect(screen.getByText('Error loading data')).toBeInTheDocument()
    })
  })
})
```

### API Error Testing

**Test API error handling:**

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { useAsyncOperation } from '../useAsyncOperation'

describe('API Error Handling', () => {
  it('handles network errors', async () => {
    const mockOperation = jest.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useAsyncOperation(mockOperation))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Network error')
    })
  })

  it('handles HTTP errors', async () => {
    const mockOperation = jest.fn().mockRejectedValue(
      new Error('HTTP 404: Not Found')
    )

    const { result } = renderHook(() => useAsyncOperation(mockOperation))

    await waitFor(() => {
      expect(result.current.error?.message).toBe('HTTP 404: Not Found')
    })
  })
})
```

## 🎯 Error Boundary Testing

### Error Boundary Component Testing

**Test error boundary behavior:**

```typescript
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

// Component that throws error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  it('catches errors and displays fallback', () => {
    const onError = jest.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    )
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error'
      }),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })
})
```

### Error Recovery Testing

**Test error recovery mechanisms:**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ErrorFallback } from '../ErrorFallback'

describe('Error Recovery', () => {
  it('retries on retry button click', async () => {
    const onRetry = jest.fn()
    const error = new Error('Test error')

    render(<ErrorFallback error={error} onRetry={onRetry} />)

    const retryButton = screen.getByText('Try again')
    fireEvent.click(retryButton)

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('displays error message', () => {
    const error = new Error('Test error message')

    render(<ErrorFallback error={error} />)

    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })
})
```

## 🎨 UI Testing Patterns

### Visual Regression Testing

**Test component appearance:**

```typescript
import { render } from '@testing-library/react'
import { Button } from '../Button'

describe('Button Visual', () => {
  it('renders primary button correctly', () => {
    const { container } = render(<Button variant="primary">Click me</Button>)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders secondary button correctly', () => {
    const { container } = render(<Button variant="secondary">Click me</Button>)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders disabled button correctly', () => {
    const { container } = render(<Button disabled>Click me</Button>)
    expect(container.firstChild).toMatchSnapshot()
  })
})
```

### Accessibility Testing

**Test accessibility features:**

```typescript
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Button } from '../Button'

expect.extend(toHaveNoViolations)

describe('Button Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('is focusable', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByText('Click me')
    button.focus()
    expect(button).toHaveFocus()
  })

  it('has proper ARIA attributes', () => {
    render(<Button aria-label="Close dialog">×</Button>)
    const button = screen.getByLabelText('Close dialog')
    expect(button).toBeInTheDocument()
  })
})
```

## 🚀 Performance Testing

### Component Performance Testing

**Test component performance:**

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '../Button'

describe('Button Performance', () => {
  it('renders quickly', () => {
    const startTime = performance.now()
    render(<Button>Click me</Button>)
    const endTime = performance.now()
    
    expect(endTime - startTime).toBeLessThan(100) // 100ms
  })

  it('handles rapid clicks efficiently', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByText('Click me')
    
    // Simulate rapid clicks
    for (let i = 0; i < 100; i++) {
      fireEvent.click(button)
    }
    
    expect(handleClick).toHaveBeenCalledTimes(100)
  })
})
```

### Memory Leak Testing

**Test for memory leaks:**

```typescript
import { render, unmount } from '@testing-library/react'
import { DataComponent } from '../DataComponent'

describe('Memory Leaks', () => {
  it('cleans up event listeners on unmount', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    
    const { unmount } = render(<DataComponent />)
    
    expect(addEventListenerSpy).toHaveBeenCalled()
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalled()
    
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })
})
```

## 🔍 Content Testing Patterns

### Content Processing Testing

**Test content processing functions:**

```typescript
import { processContent, validateContent } from '../contentUtils'

describe('Content Processing', () => {
  it('processes valid content correctly', () => {
    const content = {
      title: 'Test Title',
      date: '2024-01-01',
      type: 'note',
      content: 'Test content'
    }

    const result = processContent(content)
    
    expect(result.title).toBe('Test Title')
    expect(result.slug).toBe('test-title')
    expect(result.excerpt).toContain('Test content')
  })

  it('validates content correctly', () => {
    const validContent = {
      title: 'Test Title',
      date: '2024-01-01',
      type: 'note',
      content: 'Test content'
    }

    const invalidContent = {
      title: '',
      date: 'invalid-date',
      type: 'invalid-type',
      content: ''
    }

    expect(validateContent(validContent).isValid).toBe(true)
    expect(validateContent(invalidContent).isValid).toBe(false)
  })
})
```

### Markdown Processing Testing

**Test markdown processing:**

```typescript
import { parseMarkdown, extractFrontmatter } from '../markdownUtils'

describe('Markdown Processing', () => {
  it('parses markdown correctly', () => {
    const markdown = '# Title\n\nThis is **bold** text.'
    const result = parseMarkdown(markdown)
    
    expect(result).toContain('<h1>Title</h1>')
    expect(result).toContain('<strong>bold</strong>')
  })

  it('extracts frontmatter correctly', () => {
    const markdown = `---
title: Test Title
date: 2024-01-01
---

# Content`
    
    const { frontmatter, content } = extractFrontmatter(markdown)
    
    expect(frontmatter.title).toBe('Test Title')
    expect(frontmatter.date).toBe('2024-01-01')
    expect(content).toBe('# Content')
  })
})
```

## 🧪 Test Utilities

### Custom Test Utilities

**Create reusable test utilities:**

```typescript
// test-utils.tsx
import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '../ThemeProvider'
import { ContentProvider } from '../ContentProvider'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <ContentProvider>
        {children}
      </ContentProvider>
    </ThemeProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

### Mock Data Factories

**Create mock data factories:**

```typescript
// test-factories.ts
export const createMockContent = (overrides = {}) => ({
  id: '1',
  title: 'Test Title',
  date: '2024-01-01',
  type: 'note',
  content: 'Test content',
  excerpt: 'Test excerpt',
  ...overrides
})

export const createMockContentList = (count = 3) => 
  Array.from({ length: count }, (_, i) => 
    createMockContent({ id: i.toString() })
  )

export const createMockError = (message = 'Test error') => 
  new Error(message)
```

### Test Helpers

**Create test helper functions:**

```typescript
// test-helpers.ts
export const waitForLoadingToFinish = () => 
  waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

export const expectElementToBeVisible = (text: string) => 
  expect(screen.getByText(text)).toBeVisible()

export const expectElementToBeHidden = (text: string) => 
  expect(screen.queryByText(text)).not.toBeInTheDocument()

export const clickButton = (text: string) => 
  fireEvent.click(screen.getByText(text))

export const typeInInput = (placeholder: string, text: string) => 
  fireEvent.change(screen.getByPlaceholderText(placeholder), { 
    target: { value: text } 
  })
```

## 📊 Test Coverage

### Coverage Configuration

**Configure test coverage:**

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Coverage Reports

**Generate coverage reports:**

```bash
# Run tests with coverage
npm test -- --coverage

# Generate HTML coverage report
npm test -- --coverage --coverageReporters=html

# View coverage report
open coverage/index.html
```

---

These testing patterns provide a comprehensive foundation for testing the Web Presence project effectively and efficiently.
