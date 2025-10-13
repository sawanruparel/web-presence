# Content Management Patterns for AI Tools

This document provides comprehensive patterns and conventions for content management in the Web Presence project.

## 📝 Content Structure Patterns

### Markdown File Structure

**Always follow this structure for content files:**

```markdown
---
# Required fields
title: "Content Title"
date: "2024-01-01"
type: "note"  # note, publication, idea, page

# Optional fields
description: "Brief description for SEO"
author: "Author Name"
tags: ["tag1", "tag2"]
categories: ["category1"]
keywords: ["keyword1", "keyword2"]
readTime: "5 min"
draft: false
featured: false

# SEO fields
canonical_url: "https://yoursite.com/notes/my-note"
og_title: "Social Media Title"
og_description: "Social media description"
og_image: "https://yoursite.com/images/og-image.jpg"
twitter_title: "Twitter Title"
twitter_description: "Twitter description"
twitter_image: "https://yoursite.com/images/twitter-image.jpg"

# Advanced fields
lang: "en"
lastmod: "2024-01-02"
reading_time: 5
status: "published"
---

# Content Title

Your markdown content here...
```

### Content Type Patterns

**Notes (`/content/notes/`):**
- Personal thoughts and observations
- Informal writing style
- Focus on ideas and insights
- Use tags for organization

**Publications (`/content/publications/`):**
- Professional articles and papers
- Formal writing style
- Include author information
- Use categories for classification

**Ideas (`/content/ideas/`):**
- Creative concepts and proposals
- Visual and interactive elements
- Innovation-focused content
- Use tags for discovery

**Pages (`/content/pages/`):**
- Static site information
- About, Contact, etc.
- Professional details
- Contact forms and information

## 🔄 Content Processing Patterns

### Frontmatter Parsing

**Always use this pattern for frontmatter parsing:**

```typescript
function parseFrontmatter(content: string) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  
  if (!frontmatterMatch) {
    return { frontmatter: null, body: content }
  }
  
  const frontmatterYaml = frontmatterMatch[1]
  const body = frontmatterMatch[2]
  
  try {
    const frontmatter = parse(frontmatterYaml)
    return { frontmatter, body }
  } catch (error) {
    console.warn('Warning: Could not parse frontmatter YAML:', error)
    return { frontmatter: null, body: content }
  }
}
```

### Content Processing Pipeline

**Follow this pattern for content processing:**

```typescript
function processContentItem(filePath: string, content: string) {
  // 1. Parse frontmatter
  const { frontmatter, body } = parseFrontmatter(content)
  
  // 2. Generate excerpt
  const excerpt = generateExcerpt(body)
  
  // 3. Convert markdown to HTML
  const html = marked(body)
  
  // 4. Remove title from HTML (displayed separately)
  const htmlWithoutTitle = html.replace(/<h1[^>]*>.*?<\/h1>\s*/i, '')
  
  // 5. Clean title (remove type prefixes)
  const cleanTitle = cleanContentTitle(frontmatter?.title || slug)
  
  // 6. Create content item
  const contentItem = {
    slug: path.basename(filePath, '.md'),
    title: cleanTitle,
    date: frontmatter?.date || new Date().toISOString().split('T')[0],
    readTime: frontmatter?.readTime || '1 min',
    type: frontmatter?.type || determineTypeFromPath(filePath),
    content: body,
    html: htmlWithoutTitle,
    excerpt
  }
  
  return contentItem
}
```

### Content Validation

**Always validate content before processing:**

```typescript
function validateContentItem(item: ContentItem): ValidationResult {
  const errors: string[] = []
  
  // Required fields
  if (!item.title || item.title.trim() === '') {
    errors.push('Title is required')
  }
  
  if (!item.date || !isValidDate(item.date)) {
    errors.push('Valid date is required')
  }
  
  if (!item.type || !isValidType(item.type)) {
    errors.push('Valid type is required')
  }
  
  // Content validation
  if (!item.content || item.content.trim() === '') {
    errors.push('Content body is required')
  }
  
  // Length validation
  if (item.title.length > 100) {
    errors.push('Title too long (max 100 characters)')
  }
  
  if (item.excerpt.length > 200) {
    errors.push('Excerpt too long (max 200 characters)')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

## 🤖 Rivve AI Integration Patterns

### AI Content Enhancement

**Use this pattern for AI-enhanced content processing:**

```typescript
async function enhanceContentWithAI(content: ContentItem): Promise<EnhancedContentItem> {
  try {
    // Generate AI-enhanced metadata
    const aiMetadata = await generateAIMetadata(content)
    
    // Merge with existing metadata
    const enhancedContent = {
      ...content,
      ...aiMetadata,
      // Preserve original values if AI doesn't provide better ones
      title: aiMetadata.title || content.title,
      description: aiMetadata.description || content.description,
      tags: [...(content.tags || []), ...(aiMetadata.tags || [])],
      keywords: [...(content.keywords || []), ...(aiMetadata.keywords || [])]
    }
    
    return enhancedContent
  } catch (error) {
    console.warn('AI enhancement failed, using original content:', error)
    return content
  }
}
```

### SEO Metadata Generation

**Generate comprehensive SEO metadata:**

```typescript
function generateSEOMetadata(content: ContentItem): SEOMetadata {
  return {
    title: content.title,
    description: content.description || content.excerpt,
    canonical_url: content.canonical_url || generateCanonicalURL(content),
    og_title: content.og_title || content.title,
    og_description: content.og_description || content.description || content.excerpt,
    og_image: content.og_image || generateDefaultOGImage(content),
    twitter_title: content.twitter_title || content.og_title || content.title,
    twitter_description: content.twitter_description || content.og_description || content.description,
    twitter_image: content.twitter_image || content.og_image,
    keywords: content.keywords || [],
    tags: content.tags || [],
    author: content.author || 'Default Author',
    published_time: content.date,
    modified_time: content.lastmod || content.date
  }
}
```

## 📊 Content Metadata Patterns

### Content Index Structure

**Always maintain this structure for content metadata:**

```typescript
interface ContentList {
  notes: ContentItem[]
  publications: ContentItem[]
  ideas: ContentItem[]
  pages: ContentItem[]
  latest: ContentItem[]  // Combined recent content
}

// Generate content index
function generateContentIndex(contentByType: Record<string, ContentItem[]>): ContentList {
  const notes = contentByType.notes || []
  const publications = contentByType.publications || []
  const ideas = contentByType.ideas || []
  const pages = contentByType.pages || []
  
  // Combine and sort by date
  const latest = [...notes, ...publications, ...ideas]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)  // Limit to 10 most recent
  
  return {
    notes,
    publications,
    ideas,
    pages,
    latest
  }
}
```

### Content Filtering and Sorting

**Implement consistent filtering and sorting:**

```typescript
function filterContent(
  content: ContentItem[],
  filters: ContentFilters
): ContentItem[] {
  return content
    .filter(item => {
      // Type filter
      if (filters.type && item.type !== filters.type) return false
      
      // Tag filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => 
          item.tags?.includes(tag)
        )
        if (!hasMatchingTag) return false
      }
      
      // Date range filter
      if (filters.dateFrom) {
        const itemDate = new Date(item.date)
        const fromDate = new Date(filters.dateFrom)
        if (itemDate < fromDate) return false
      }
      
      if (filters.dateTo) {
        const itemDate = new Date(item.date)
        const toDate = new Date(filters.dateTo)
        if (itemDate > toDate) return false
      }
      
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchableText = [
          item.title,
          item.excerpt,
          item.content
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchTerm)) return false
      }
      
      return true
    })
    .sort((a, b) => {
      // Sort by date (newest first) by default
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
}
```

## 🎨 Content Display Patterns

### Content Card Component

**Use this pattern for content display:**

```typescript
interface ContentCardProps {
  content: ContentItem
  variant?: 'default' | 'compact' | 'featured'
  showExcerpt?: boolean
  showTags?: boolean
  showDate?: boolean
}

export function ContentCard({ 
  content, 
  variant = 'default',
  showExcerpt = true,
  showTags = true,
  showDate = true
}: ContentCardProps) {
  const cardClasses = {
    default: 'p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow',
    compact: 'p-4 border rounded-lg',
    featured: 'p-8 border-2 border-blue-200 rounded-lg shadow-lg bg-blue-50'
  }
  
  return (
    <div className={cardClasses[variant]}>
      <h3 className="text-xl font-semibold mb-2">
        <Link href={`/${content.type}s/${content.slug}`}>
          {content.title}
        </Link>
      </h3>
      
      {showExcerpt && (
        <p className="text-gray-600 mb-4">{content.excerpt}</p>
      )}
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          {showDate && (
            <span>{formatDate(content.date)}</span>
          )}
          <span>{content.readTime}</span>
        </div>
        
        {showTags && content.tags && content.tags.length > 0 && (
          <div className="flex space-x-2">
            {content.tags.slice(0, 3).map(tag => (
              <span 
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### Content List Component

**Use this pattern for content listing:**

```typescript
interface ContentListProps {
  content: ContentItem[]
  type: ContentType
  filters?: ContentFilters
  pagination?: boolean
  itemsPerPage?: number
}

export function ContentList({ 
  content, 
  type,
  filters,
  pagination = false,
  itemsPerPage = 10
}: ContentListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  
  const filteredContent = useMemo(() => {
    return filterContent(content, filters || {})
  }, [content, filters])
  
  const paginatedContent = useMemo(() => {
    if (!pagination) return filteredContent
    
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredContent.slice(startIndex, endIndex)
  }, [filteredContent, currentPage, itemsPerPage, pagination])
  
  const totalPages = Math.ceil(filteredContent.length / itemsPerPage)
  
  return (
    <div>
      <div className="grid gap-6">
        {paginatedContent.map(item => (
          <ContentCard key={`${item.type}-${item.slug}`} content={item} />
        ))}
      </div>
      
      {pagination && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}
```

## 🔍 Search and Filtering Patterns

### Search Implementation

**Implement content search with this pattern:**

```typescript
function useContentSearch(content: ContentItem[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<ContentItem[]>([])
  
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }
    
    const results = content.filter(item => {
      const searchableText = [
        item.title,
        item.excerpt,
        item.content,
        item.tags?.join(' '),
        item.keywords?.join(' ')
      ].join(' ').toLowerCase()
      
      return searchableText.includes(searchTerm.toLowerCase())
    })
    
    setSearchResults(results)
  }, [content, searchTerm])
  
  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    hasResults: searchResults.length > 0
  }
}
```

### Filter Implementation

**Implement content filtering:**

```typescript
function useContentFilters(content: ContentItem[]) {
  const [filters, setFilters] = useState<ContentFilters>({})
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>(content)
  
  useEffect(() => {
    const filtered = filterContent(content, filters)
    setFilteredContent(filtered)
  }, [content, filters])
  
  const updateFilter = (key: keyof ContentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }
  
  const clearFilters = () => {
    setFilters({})
  }
  
  return {
    filters,
    filteredContent,
    updateFilter,
    clearFilters
  }
}
```

## 📈 Content Analytics Patterns

### Content Statistics

**Track content performance:**

```typescript
function useContentAnalytics(content: ContentItem[]) {
  const [stats, setStats] = useState<ContentStats>({
    totalItems: 0,
    itemsByType: {},
    averageReadTime: 0,
    mostPopularTags: [],
    recentActivity: []
  })
  
  useEffect(() => {
    const totalItems = content.length
    
    const itemsByType = content.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const averageReadTime = content.reduce((sum, item) => {
      const readTime = parseInt(item.readTime) || 1
      return sum + readTime
    }, 0) / content.length
    
    const tagCounts = content.reduce((acc, item) => {
      item.tags?.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)
    
    const mostPopularTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag)
    
    const recentActivity = content
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
    
    setStats({
      totalItems,
      itemsByType,
      averageReadTime,
      mostPopularTags,
      recentActivity
    })
  }, [content])
  
  return stats
}
```

## 🚀 Performance Optimization Patterns

### Content Caching

**Implement content caching:**

```typescript
class ContentCache {
  private cache = new Map<string, ContentItem[]>()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes
  
  get(key: string): ContentItem[] | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    // Check if cache is expired
    const now = Date.now()
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }
  
  set(key: string, data: ContentItem[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
  
  clear(): void {
    this.cache.clear()
  }
}
```

### Lazy Loading

**Implement lazy loading for content:**

```typescript
function useLazyContent(initialContent: ContentItem[], loadMore: () => Promise<ContentItem[]>) {
  const [content, setContent] = useState<ContentItem[]>(initialContent)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  
  const loadMoreContent = async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    try {
      const newContent = await loadMore()
      setContent(prev => [...prev, ...newContent])
      setHasMore(newContent.length > 0)
    } catch (error) {
      console.error('Failed to load more content:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return {
    content,
    loading,
    hasMore,
    loadMoreContent
  }
}
```

---

These content management patterns provide a solid foundation for handling content processing, display, and optimization in the Web Presence project.
