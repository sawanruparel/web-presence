# Extension Guide

This document provides comprehensive guidance for extending and customizing the Web Presence project.

## 🎯 Extension Overview

The Web Presence project is designed to be highly extensible. This guide covers:
- Adding new content types
- Creating custom components
- Extending the build system
- Adding new features
- Customizing the design system

## 📝 Adding New Content Types

### 1. Define Content Type

**Add to content processing:**
```javascript
// scripts/fetch-content-from-r2.ts
const contentTypes = ['notes', 'publications', 'ideas', 'pages', 'tutorials'] // Add new type
```

**Create content directory:**
```bash
mkdir content/tutorials
touch content/tutorials/example-tutorial.md
```

### 2. Update TypeScript Types

**Extend ContentItem interface:**
```typescript
// src/utils/content-processor.ts
export interface ContentItem {
  slug: string
  title: string
  date: string
  readTime: string
  type: 'note' | 'publication' | 'idea' | 'page' | 'tutorial' // Add new type
  excerpt: string
  content?: string
  html?: string
}

export interface ContentList {
  notes: ContentItem[]
  publications: ContentItem[]
  ideas: ContentItem[]
  pages: ContentItem[]
  tutorials: ContentItem[] // Add new type
  latest: ContentItem[]
}
```

### 3. Create Page Component

**Create new page component:**
```typescript
// src/pages/TutorialsPage.tsx
import React from 'react'
import { ContentItem } from '../utils/content-processor'

interface TutorialsPageProps {
  tutorials: ContentItem[]
}

export function TutorialsPage({ tutorials }: TutorialsPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tutorials</h1>
      <div className="grid gap-6">
        {tutorials.map((tutorial) => (
          <div key={tutorial.slug} className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">{tutorial.title}</h2>
            <p className="text-gray-600 mb-4">{tutorial.excerpt}</p>
            <div className="flex items-center text-sm text-gray-500">
              <span>{tutorial.date}</span>
              <span className="mx-2">•</span>
              <span>{tutorial.readTime}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 4. Update Routing

**Add to App.tsx:**
```typescript
// src/App.tsx
import { TutorialsPage } from './pages/TutorialsPage'

function renderPage(pageData: PageData) {
  switch (pageData.type) {
    case 'about':
      return <AboutPage />
    case 'contact':
      return <ContactPage />
    case 'notes':
      return <NotesPage notes={pageData.data.notes} />
    case 'publications':
      return <PublicationsPage publications={pageData.data.publications} />
    case 'ideas':
      return <IdeasPage ideas={pageData.data.ideas} />
    case 'tutorials': // Add new case
      return <TutorialsPage tutorials={pageData.data.tutorials} />
    case 'content':
      return <ContentPage content={pageData.data.content} type={pageData.data.type} />
    default:
      return <AboutPage />
  }
}
```

### 5. Update Navigation

**Add to PageNavigation component:**
```typescript
// src/components/page-navigation.tsx
const links = [
  { href: '/', label: 'About', key: 'about' },
  { href: '/notes', label: 'Notes', key: 'notes' },
  { href: '/publications', label: 'Publications', key: 'publications' },
  { href: '/ideas', label: 'Ideas', key: 'ideas' },
  { href: '/tutorials', label: 'Tutorials', key: 'tutorials' }, // Add new item
  { href: '/contact', label: 'Contact', key: 'contact' },
]
```

## 🧩 Creating Custom Components

### Component Structure

**Basic component template:**
```typescript
// src/components/my-component.tsx
import React from 'react'
import { clsx } from 'clsx'

interface MyComponentProps {
  title: string
  description?: string
  className?: string
  children?: React.ReactNode
}

export function MyComponent({ 
  title, 
  description, 
  className,
  children 
}: MyComponentProps) {
  return (
    <div className={clsx('p-4 border rounded-lg', className)}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-4">{description}</p>
      )}
      {children}
    </div>
  )
}
```

### Advanced Component Patterns

**Error Boundary Component:**
```typescript
// src/components/error-boundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          <p className="text-red-600">Please refresh the page and try again.</p>
        </div>
      )
    }

    return this.props.children
  }
}
```

**Custom Hook:**
```typescript
// src/hooks/use-content.ts
import { useState, useEffect } from 'react'
import { ContentItem, getAllContent } from '../utils/content-processor'

export function useContent(type?: 'notes' | 'publications' | 'ideas' | 'pages') {
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
```

## 🔧 Extending the Build System

### Custom Vite Plugin

**Create custom plugin:**
```typescript
// scripts/custom-plugin.ts
import { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

export interface CustomPluginOptions {
  inputDir: string
  outputDir: string
}

export function customPlugin(options: CustomPluginOptions): Plugin {
  const { inputDir, outputDir } = options
  
  return {
    name: 'custom-plugin',
    buildStart() {
      console.log('Custom plugin started')
    },
    generateBundle() {
      // Custom build logic
      this.emitFile({
        type: 'asset',
        fileName: 'custom-data.json',
        source: JSON.stringify({ custom: 'data' })
      })
    }
  }
}
```

**Add to Vite config:**
```typescript
// vite.config.ts
import { customPlugin } from './scripts/custom-plugin'

export default defineConfig({
  plugins: [
    react(),
    htmlPagesPlugin({...}),
    devServerPlugin('./content', './rivve/html-output'),
    customPlugin({
      inputDir: './custom-input',
      outputDir: './dist/custom'
    })
  ]
})
```

### Custom Content Processor

**Extend content processing:**
```typescript
// scripts/custom-content-processor.ts
import { ContentItem } from '../src/utils/content-processor'

export interface CustomContentItem extends ContentItem {
  customField: string
  tags: string[]
  category: string
}

export function processCustomContent(content: ContentItem[]): CustomContentItem[] {
  return content.map(item => ({
    ...item,
    customField: generateCustomField(item),
    tags: extractTags(item.content || ''),
    category: determineCategory(item.type)
  }))
}

function generateCustomField(item: ContentItem): string {
  // Custom processing logic
  return `custom-${item.slug}`
}

function extractTags(content: string): string[] {
  // Extract tags from content
  const tagRegex = /#(\w+)/g
  const matches = content.match(tagRegex)
  return matches ? matches.map(tag => tag.slice(1)) : []
}

function determineCategory(type: string): string {
  const categoryMap: Record<string, string> = {
    'note': 'personal',
    'publication': 'professional',
    'idea': 'creative',
    'page': 'static'
  }
  return categoryMap[type] || 'other'
}
```

## 🎨 Customizing the Design System

### Color Scheme

**Update Tailwind config:**
```typescript
// config.tailwind.ts
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          900: '#0f172a',
        },
        accent: {
          50: '#f0fdf4',
          500: '#22c55e',
          900: '#14532d',
        }
      }
    }
  }
} satisfies Config
```

### Typography

**Custom font configuration:**
```typescript
// config.tailwind.ts
export default {
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'serif': ['Merriweather', 'serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      }
    }
  }
} satisfies Config
```

### Component Variants

**Create component variants:**
```typescript
// src/components/button.tsx
import { clsx } from 'clsx'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className,
  onClick 
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
    outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

## 🚀 Adding New Features

### Search Functionality

**Create search component:**
```typescript
// src/components/search.tsx
import { useState, useMemo } from 'react'
import { ContentItem, getAllContent } from '../utils/content-processor'

export function Search() {
  const [query, setQuery] = useState('')
  const allContent = getAllContent()
  
  const searchResults = useMemo(() => {
    if (!query.trim()) return []
    
    const searchableContent = [
      ...allContent.notes,
      ...allContent.publications,
      ...allContent.ideas,
      ...allContent.pages
    ]
    
    return searchableContent.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.excerpt.toLowerCase().includes(query.toLowerCase()) ||
      item.content?.toLowerCase().includes(query.toLowerCase())
    )
  }, [query, allContent])
  
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search content..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
      />
      
      {query && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {searchResults.length > 0 ? (
            searchResults.map((item) => (
              <div key={`${item.type}-${item.slug}`} className="p-3 hover:bg-gray-50">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.excerpt}</p>
                <span className="text-xs text-gray-400 capitalize">{item.type}</span>
              </div>
            ))
          ) : (
            <div className="p-3 text-gray-500">No results found</div>
          )}
        </div>
      )}
    </div>
  )
}
```

### Dark Mode Support

**Create theme context:**
```typescript
// src/contexts/theme-context.tsx
import React, { createContext, useContext, useState, useEffect } from 'react'

interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])
  
  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
```

**Update Tailwind config for dark mode:**
```typescript
// config.tailwind.ts
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Add dark mode colors
      }
    }
  }
} satisfies Config
```

### Analytics Integration

**Create analytics hook:**
```typescript
// src/hooks/use-analytics.ts
import { useEffect } from 'react'

declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}

export function useAnalytics() {
  const trackPageView = (path: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: path,
      })
    }
  }
  
  const trackEvent = (action: string, category: string, label?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
      })
    }
  }
  
  return { trackPageView, trackEvent }
}
```

## 🔌 Plugin System

### Plugin Architecture

**Create plugin interface:**
```typescript
// src/types/plugin.ts
export interface Plugin {
  name: string
  version: string
  initialize: () => void
  destroy?: () => void
}

export interface PluginManager {
  register: (plugin: Plugin) => void
  unregister: (name: string) => void
  get: (name: string) => Plugin | undefined
  list: () => Plugin[]
}
```

**Implement plugin manager:**
```typescript
// src/utils/plugin-manager.ts
import { Plugin, PluginManager } from '../types/plugin'

class PluginManagerImpl implements PluginManager {
  private plugins = new Map<string, Plugin>()
  
  register(plugin: Plugin) {
    this.plugins.set(plugin.name, plugin)
    plugin.initialize()
  }
  
  unregister(name: string) {
    const plugin = this.plugins.get(name)
    if (plugin?.destroy) {
      plugin.destroy()
    }
    this.plugins.delete(name)
  }
  
  get(name: string) {
    return this.plugins.get(name)
  }
  
  list() {
    return Array.from(this.plugins.values())
  }
}

export const pluginManager = new PluginManagerImpl()
```

## 📊 Performance Monitoring

### Custom Performance Hooks

**Create performance monitoring:**
```typescript
// src/hooks/use-performance.ts
import { useEffect, useState } from 'react'

export function usePerformance() {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0
  })
  
  useEffect(() => {
    const startTime = performance.now()
    
    const measurePerformance = () => {
      const loadTime = performance.now() - startTime
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0
      
      setMetrics({
        loadTime,
        renderTime: performance.now() - startTime,
        memoryUsage: memoryUsage / 1024 / 1024 // Convert to MB
      })
    }
    
    // Measure after component mount
    const timeoutId = setTimeout(measurePerformance, 0)
    
    return () => clearTimeout(timeoutId)
  }, [])
  
  return metrics
}
```

## 🧪 Testing Extensions

### Component Testing

**Create test utilities:**
```typescript
// src/test-utils.tsx
import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from './contexts/theme-context'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      {children}
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

**Example component test:**
```typescript
// src/components/__tests__/button.test.tsx
import { render, screen, fireEvent } from '../../test-utils'
import { Button } from '../button'

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
    expect(button).toHaveClass('bg-secondary-600')
  })
})
```

---

This extension guide provides comprehensive patterns and examples for extending the Web Presence project with new features, components, and functionality.
