# Styling Guidelines for AI Tools

This document provides comprehensive styling patterns and conventions for the Web Presence project using Tailwind CSS.

## 🎨 Design System Overview

### Color Palette

**Primary Colors:**
```css
:root {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;  /* Main primary */
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
}
```

**Secondary Colors:**
```css
:root {
  --color-secondary-50: #f8fafc;
  --color-secondary-100: #f1f5f9;
  --color-secondary-200: #e2e8f0;
  --color-secondary-300: #cbd5e1;
  --color-secondary-400: #94a3b8;
  --color-secondary-500: #64748b;  /* Main secondary */
  --color-secondary-600: #475569;
  --color-secondary-700: #334155;
  --color-secondary-800: #1e293b;
  --color-secondary-900: #0f172a;
}
```

**Semantic Colors:**
```css
:root {
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

### Typography Scale

**Font Families:**
```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-serif: 'Merriweather', Georgia, serif;
  --font-mono: 'JetBrains Mono', 'Monaco', 'Menlo', monospace;
}
```

**Font Sizes:**
```css
:root {
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  --text-5xl: 3rem;        /* 48px */
}
```

**Line Heights:**
```css
:root {
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
}
```

### Spacing Scale

**Base Unit: 4px**
```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

## 🧩 Component Styling Patterns

### Button Components

**Primary Button:**
```typescript
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium">
  Primary Button
</button>
```

**Secondary Button:**
```typescript
<button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 font-medium">
  Secondary Button
</button>
```

**Outline Button:**
```typescript
<button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium">
  Outline Button
</button>
```

**Ghost Button:**
```typescript
<button className="px-4 py-2 text-blue-600 rounded-lg hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium">
  Ghost Button
</button>
```

**Button Sizes:**
```typescript
// Small
<button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg">
  Small Button
</button>

// Medium (default)
<button className="px-4 py-2 text-base bg-blue-600 text-white rounded-lg">
  Medium Button
</button>

// Large
<button className="px-6 py-3 text-lg bg-blue-600 text-white rounded-lg">
  Large Button
</button>
```

### Card Components

**Basic Card:**
```typescript
<div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Card Title</h3>
  <p className="text-gray-600">Card content goes here</p>
</div>
```

**Card with Hover Effect:**
```typescript
<div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Card Title</h3>
  <p className="text-gray-600">Card content goes here</p>
</div>
```

**Card with Header and Footer:**
```typescript
<div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-200">
    <h3 className="text-lg font-semibold text-gray-900">Card Header</h3>
  </div>
  <div className="px-6 py-4">
    <p className="text-gray-600">Card body content</p>
  </div>
  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
    <button className="text-blue-600 hover:text-blue-700 font-medium">
      Action
    </button>
  </div>
</div>
```

### Form Components

**Input Field:**
```typescript
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Label
  </label>
  <input
    type="text"
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
    placeholder="Placeholder text"
  />
</div>
```

**Textarea:**
```typescript
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Message
  </label>
  <textarea
    rows={4}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
    placeholder="Enter your message"
  />
</div>
```

**Select Dropdown:**
```typescript
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Category
  </label>
  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
    <option>Select an option</option>
    <option>Option 1</option>
    <option>Option 2</option>
  </select>
</div>
```

### Navigation Components

**Horizontal Navigation:**
```typescript
<nav className="bg-white border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
      <div className="flex items-center">
        <a href="/" className="text-xl font-bold text-gray-900">
          Logo
        </a>
      </div>
      <div className="flex items-center space-x-8">
        <a href="/about" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
          About
        </a>
        <a href="/contact" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
          Contact
        </a>
      </div>
    </div>
  </div>
</nav>
```

**Mobile Navigation:**
```typescript
<div className="md:hidden">
  <button className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900">
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>
</div>
```

## 📱 Responsive Design Patterns

### Mobile-First Approach

**Always start with mobile styles and enhance for larger screens:**

```typescript
// Mobile first
<div className="grid grid-cols-1 gap-4 p-4">
  {/* Mobile layout */}
</div>

// Tablet and up
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
  {/* Tablet layout */}
</div>

// Desktop and up
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
  {/* Desktop layout */}
</div>
```

### Responsive Typography

**Scale text appropriately across devices:**

```typescript
// Responsive heading
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
  Responsive Heading
</h1>

// Responsive body text
<p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
  Responsive body text that scales with screen size
</p>
```

### Responsive Spacing

**Adjust spacing for different screen sizes:**

```typescript
// Responsive padding
<div className="p-4 sm:p-6 lg:p-8">
  {/* Content with responsive padding */}
</div>

// Responsive margins
<div className="mt-4 sm:mt-6 lg:mt-8">
  {/* Content with responsive margins */}
</div>
```

## 🎯 Layout Patterns

### Container Layout

**Use consistent container patterns:**

```typescript
// Standard container
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>

// Narrow container for content
<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>

// Wide container for full-width content
<div className="w-full px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Grid Layouts

**Use CSS Grid for complex layouts:**

```typescript
// Basic grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>

// Auto-fit grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* Auto-fit grid items */}
</div>

// Grid with different column sizes
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Main content */}
  </div>
  <div className="lg:col-span-1">
    {/* Sidebar */}
  </div>
</div>
```

### Flexbox Layouts

**Use Flexbox for component alignment:**

```typescript
// Horizontal flex
<div className="flex items-center justify-between">
  <div>Left content</div>
  <div>Right content</div>
</div>

// Vertical flex
<div className="flex flex-col space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

// Centered content
<div className="flex items-center justify-center min-h-screen">
  <div>Centered content</div>
</div>
```

## 🎨 Visual Effects

### Shadows and Elevation

**Use consistent shadow patterns:**

```typescript
// Subtle shadow
<div className="shadow-sm">
  {/* Content */}
</div>

// Medium shadow
<div className="shadow-md">
  {/* Content */}
</div>

// Large shadow
<div className="shadow-lg">
  {/* Content */}
</div>

// Custom shadow
<div className="shadow-xl shadow-blue-500/25">
  {/* Content with colored shadow */}
</div>
```

### Transitions and Animations

**Use smooth transitions for interactive elements:**

```typescript
// Hover transition
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
  Hover me
</button>

// Transform transition
<div className="transform hover:scale-105 transition-transform duration-200">
  {/* Content that scales on hover */}
</div>

// Opacity transition
<div className="opacity-0 hover:opacity-100 transition-opacity duration-300">
  {/* Content that fades in on hover */}
</div>
```

### Gradients and Backgrounds

**Use gradients for visual interest:**

```typescript
// Linear gradient
<div className="bg-gradient-to-r from-blue-500 to-purple-600">
  {/* Content with gradient background */}
</div>

// Radial gradient
<div className="bg-gradient-radial from-blue-100 to-blue-200">
  {/* Content with radial gradient */}
</div>

// Pattern background
<div className="bg-pattern">
  {/* Content with pattern background */}
</div>
```

## 🎯 State Styling

### Interactive States

**Style different interaction states:**

```typescript
// Button states
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
  Interactive Button
</button>

// Link states
<a href="#" className="text-blue-600 hover:text-blue-700 focus:text-blue-700 focus:outline-none focus:underline transition-colors duration-200">
  Interactive Link
</a>
```

### Loading States

**Style loading and empty states:**

```typescript
// Loading spinner
<div className="flex items-center justify-center p-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  <span className="ml-2 text-gray-600">Loading...</span>
</div>

// Skeleton loading
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>

// Empty state
<div className="text-center py-12">
  <div className="text-gray-400 mb-4">
    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {/* Empty state icon */}
    </svg>
  </div>
  <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
  <p className="text-gray-500">Try adjusting your search or filters</p>
</div>
```

## 🎨 Dark Mode Support

### Dark Mode Classes

**Use dark mode variants:**

```typescript
// Dark mode text
<p className="text-gray-900 dark:text-gray-100">
  Text that adapts to dark mode
</p>

// Dark mode background
<div className="bg-white dark:bg-gray-900">
  {/* Content that adapts to dark mode */}
</div>

// Dark mode border
<div className="border border-gray-200 dark:border-gray-700">
  {/* Content with dark mode border */}
</div>
```

### Dark Mode Toggle

**Implement dark mode toggle:**

```typescript
function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])
  
  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
```

## 🧪 Testing Styling

### Visual Regression Testing

**Test component styling:**

```typescript
// Test component rendering
it('renders with correct styles', () => {
  render(<Button>Click me</Button>)
  const button = screen.getByText('Click me')
  
  expect(button).toHaveClass('px-4', 'py-2', 'bg-blue-600', 'text-white')
})

// Test responsive behavior
it('applies responsive classes', () => {
  render(<ResponsiveComponent />)
  const element = screen.getByTestId('responsive-element')
  
  expect(element).toHaveClass('text-sm', 'md:text-base', 'lg:text-lg')
})
```

### Accessibility Testing

**Test accessibility attributes:**

```typescript
// Test focus styles
it('applies focus styles', () => {
  render(<Button>Click me</Button>)
  const button = screen.getByText('Click me')
  
  button.focus()
  expect(button).toHaveClass('focus:ring-2', 'focus:ring-blue-500')
})

// Test color contrast
it('has sufficient color contrast', () => {
  render(<Text>Important text</Text>)
  const text = screen.getByText('Important text')
  
  expect(text).toHaveClass('text-gray-900') // High contrast
})
```

## 📊 Performance Considerations

### CSS Optimization

**Optimize CSS for performance:**

```typescript
// Use utility classes instead of custom CSS
<div className="p-4 bg-white rounded-lg shadow-sm">
  {/* Use Tailwind utilities */}
</div>

// Avoid inline styles
<div style={{ padding: '1rem', backgroundColor: 'white' }}>
  {/* Avoid this pattern */}
</div>

// Use CSS custom properties for theming
<div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
  {/* Use CSS variables */}
</div>
```

### Bundle Size Optimization

**Minimize CSS bundle size:**

```typescript
// Use only needed Tailwind classes
<div className="p-4 bg-white rounded-lg">
  {/* Minimal classes */}
</div>

// Avoid unused classes
<div className="p-4 bg-white rounded-lg unused-class">
  {/* Remove unused classes */}
</div>

// Use Tailwind's purge feature
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  // This will purge unused styles
}
```

---

These styling guidelines provide a comprehensive foundation for creating consistent, accessible, and performant styles in the Web Presence project.
