# Performance Patterns for AI Tools

This document provides comprehensive performance optimization patterns and best practices for the Web Presence project.

## 🚀 Performance Strategy Overview

### Performance Metrics

**Key performance indicators:**
- **First Contentful Paint (FCP)** - < 1.5s
- **Largest Contentful Paint (LCP)** - < 2.5s
- **Cumulative Layout Shift (CLS)** - < 0.1
- **First Input Delay (FID)** - < 100ms
- **Time to Interactive (TTI)** - < 3.5s

### Performance Budget

**Bundle size limits:**
- **JavaScript** - < 250KB (gzipped)
- **CSS** - < 50KB (gzipped)
- **Images** - < 500KB per image
- **Total page weight** - < 1MB

## ⚡ React Performance Patterns

### Component Optimization

**Use React.memo for expensive components:**

```typescript
import React, { memo } from 'react'

interface ExpensiveComponentProps {
  data: DataItem[]
  onItemClick: (id: string) => void
}

export const ExpensiveComponent = memo(function ExpensiveComponent({ 
  data, 
  onItemClick 
}: ExpensiveComponentProps) {
  return (
    <div>
      {data.map(item => (
        <ComplexItem 
          key={item.id} 
          item={item} 
          onClick={onItemClick}
        />
      ))}
    </div>
  )
})

// Custom comparison function for complex props
export const ComplexComponent = memo(function ComplexComponent({ 
  data, 
  config 
}: ComplexComponentProps) {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison logic
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.config.theme === nextProps.config.theme
  )
})
```

### Hook Optimization

**Use useMemo and useCallback for expensive operations:**

```typescript
import { useMemo, useCallback, useState } from 'react'

export function OptimizedComponent({ items, filter, onItemClick }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  
  // Memoize expensive calculations
  const filteredItems = useMemo(() => {
    return items
      .filter(item => item.category === filter)
      .filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [items, filter, searchTerm])
  
  // Memoize callback functions
  const handleItemClick = useCallback((id: string) => {
    onItemClick(id)
  }, [onItemClick])
  
  // Memoize expensive JSX
  const itemList = useMemo(() => (
    <div className="grid gap-4">
      {filteredItems.map(item => (
        <ItemCard 
          key={item.id} 
          item={item} 
          onClick={handleItemClick}
        />
      ))}
    </div>
  ), [filteredItems, handleItemClick])
  
  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search items..."
      />
      {itemList}
    </div>
  )
}
```

### Lazy Loading Patterns

**Implement lazy loading for components:**

```typescript
import { lazy, Suspense } from 'react'

// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'))
const ChartComponent = lazy(() => import('./ChartComponent'))

export function App() {
  const [showHeavy, setShowHeavy] = useState(false)
  const [showChart, setShowChart] = useState(false)
  
  return (
    <div>
      <button onClick={() => setShowHeavy(true)}>
        Load Heavy Component
      </button>
      
      {showHeavy && (
        <Suspense fallback={<LoadingSpinner />}>
          <HeavyComponent />
        </Suspense>
      )}
      
      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <ChartComponent />
        </Suspense>
      )}
    </div>
  )
}
```

### Virtual Scrolling

**Implement virtual scrolling for large lists:**

```typescript
import { FixedSizeList as List } from 'react-window'

interface VirtualListProps {
  items: DataItem[]
  height: number
  itemHeight: number
}

export function VirtualList({ items, height, itemHeight }: VirtualListProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <ItemCard item={items[index]} />
    </div>
  )
  
  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

## 📦 Bundle Optimization

### Code Splitting

**Implement route-based code splitting:**

```typescript
import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// Lazy load page components
const HomePage = lazy(() => import('./pages/HomePage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const NotesPage = lazy(() => import('./pages/NotesPage'))
const PublicationsPage = lazy(() => import('./pages/PublicationsPage'))

export function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/publications" element={<PublicationsPage />} />
      </Routes>
    </Suspense>
  )
}
```

### Dynamic Imports

**Use dynamic imports for conditional loading:**

```typescript
import { useState, useEffect } from 'react'

export function ConditionalComponent() {
  const [Component, setComponent] = useState<React.ComponentType | null>(null)
  const [loading, setLoading] = useState(false)
  
  const loadComponent = async () => {
    setLoading(true)
    try {
      const { default: DynamicComponent } = await import('./DynamicComponent')
      setComponent(() => DynamicComponent)
    } catch (error) {
      console.error('Failed to load component:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      <button onClick={loadComponent} disabled={loading}>
        {loading ? 'Loading...' : 'Load Component'}
      </button>
      {Component && <Component />}
    </div>
  )
}
```

### Tree Shaking

**Optimize imports for tree shaking:**

```typescript
// Good - specific imports
import { debounce } from 'lodash/debounce'
import { format } from 'date-fns/format'

// Bad - full library imports
import _ from 'lodash'
import * as dateFns from 'date-fns'

// Good - named exports
import { Button, Input, Card } from './components'

// Bad - default exports
import Components from './components'
```

## 🖼️ Image Optimization

### Responsive Images

**Implement responsive image loading:**

```typescript
import { useState, useRef, useEffect } from 'react'

interface ResponsiveImageProps {
  src: string
  alt: string
  sizes: string
  className?: string
}

export function ResponsiveImage({ src, alt, sizes, className }: ResponsiveImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    
    if (imgRef.current) {
      observer.observe(imgRef.current)
    }
    
    return () => observer.disconnect()
  }, [])
  
  return (
    <div ref={imgRef} className={className}>
      {inView && (
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}
```

### Image Lazy Loading

**Implement lazy loading for images:**

```typescript
import { useState, useRef, useEffect } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  placeholder?: string
  className?: string
}

export function LazyImage({ src, alt, placeholder, className }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    
    if (imgRef.current) {
      observer.observe(imgRef.current)
    }
    
    return () => observer.disconnect()
  }, [])
  
  return (
    <div ref={imgRef} className={className}>
      {inView ? (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={`transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        <div className="bg-gray-200 animate-pulse">
          {placeholder && <img src={placeholder} alt="" />}
        </div>
      )}
    </div>
  )
}
```

## 🔄 Data Fetching Optimization

### Request Deduplication

**Implement request deduplication:**

```typescript
class RequestCache {
  private cache = new Map<string, Promise<any>>()
  
  async fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!
    }
    
    const promise = fetcher()
    this.cache.set(key, promise)
    
    try {
      const result = await promise
      return result
    } catch (error) {
      this.cache.delete(key)
      throw error
    }
  }
  
  clear(): void {
    this.cache.clear()
  }
}

const requestCache = new RequestCache()

export function useDataFetching<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await requestCache.fetch(key, fetcher)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [key, fetcher])
  
  return { data, loading, error }
}
```

### Pagination and Infinite Loading

**Implement efficient pagination:**

```typescript
import { useState, useCallback, useMemo } from 'react'

interface UsePaginationProps {
  totalItems: number
  itemsPerPage: number
  initialPage?: number
}

export function usePagination({ 
  totalItems, 
  itemsPerPage, 
  initialPage = 1 
}: UsePaginationProps) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return { startIndex, endIndex }
  }, [currentPage, itemsPerPage])
  
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])
  
  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])
  
  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])
  
  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  }
}
```

### Debounced Search

**Implement debounced search:**

```typescript
import { useState, useEffect, useMemo } from 'react'
import { debounce } from 'lodash/debounce'

export function useDebouncedSearch<T>(
  items: T[],
  searchFn: (items: T[], query: string) => T[],
  delay: number = 300
) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  
  const debouncedSetQuery = useMemo(
    () => debounce((value: string) => setDebouncedQuery(value), delay),
    [delay]
  )
  
  useEffect(() => {
    debouncedSetQuery(query)
    return () => debouncedSetQuery.cancel()
  }, [query, debouncedSetQuery])
  
  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) return items
    return searchFn(items, debouncedQuery)
  }, [items, debouncedQuery, searchFn])
  
  return {
    query,
    setQuery,
    filteredItems,
    isSearching: query !== debouncedQuery
  }
}
```

## 🎨 CSS Performance

### Critical CSS

**Extract critical CSS:**

```typescript
// Extract critical CSS for above-the-fold content
const criticalCSS = `
  .header { display: flex; align-items: center; }
  .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
  .btn-primary { background: #3b82f6; color: white; }
`

// Inject critical CSS
useEffect(() => {
  const style = document.createElement('style')
  style.textContent = criticalCSS
  document.head.appendChild(style)
  
  return () => {
    document.head.removeChild(style)
  }
}, [])
```

### CSS-in-JS Optimization

**Optimize CSS-in-JS performance:**

```typescript
import styled from 'styled-components'
import { memo } from 'react'

// Use styled components with memo
const StyledButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${props => props.variant === 'primary' ? '#3b82f6' : '#6b7280'};
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`

export const OptimizedButton = memo(StyledButton)
```

## 📊 Performance Monitoring

### Performance Metrics Collection

**Collect performance metrics:**

```typescript
class PerformanceMonitor {
  private metrics: Map<string, number> = new Map()
  
  measure(name: string, fn: () => void): void {
    const start = performance.now()
    fn()
    const end = performance.now()
    this.metrics.set(name, end - start)
  }
  
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const end = performance.now()
      this.metrics.set(name, end - start)
      return result
    } catch (error) {
      const end = performance.now()
      this.metrics.set(`${name}_error`, end - start)
      throw error
    }
  }
  
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }
  
  reportMetrics(): void {
    console.log('Performance Metrics:', this.getMetrics())
    
    // Send to analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      Object.entries(this.getMetrics()).forEach(([name, value]) => {
        window.gtag('event', 'timing_complete', {
          name,
          value: Math.round(value)
        })
      })
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()
```

### Bundle Analysis

**Analyze bundle size:**

```typescript
// webpack-bundle-analyzer configuration
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-report.html'
    })
  ]
}
```

## 🧪 Performance Testing

### Performance Testing

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
    const startTime = performance.now()
    for (let i = 0; i < 100; i++) {
      fireEvent.click(button)
    }
    const endTime = performance.now()
    
    expect(handleClick).toHaveBeenCalledTimes(100)
    expect(endTime - startTime).toBeLessThan(1000) // 1s
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
  
  it('cleans up timers on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
    
    const { unmount } = render(<DataComponent />)
    unmount()
    
    expect(clearTimeoutSpy).toHaveBeenCalled()
    
    clearTimeoutSpy.mockRestore()
  })
})
```

## 🚀 Build Optimization

### Vite Configuration

**Optimize Vite build:**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'date-fns']
        }
      }
    }
  }
})
```

### Asset Optimization

**Optimize assets:**

```typescript
// Image optimization
import { optimize } from 'imagemin'
import imageminWebp from 'imagemin-webp'

async function optimizeImages() {
  const files = await imagemin(['src/images/*.{jpg,png}'], {
    destination: 'dist/images',
    plugins: [
      imageminWebp({ quality: 80 })
    ]
  })
  
  console.log('Optimized images:', files)
}
```

---

These performance patterns provide a comprehensive foundation for optimizing the Web Presence project for speed, efficiency, and user experience.
