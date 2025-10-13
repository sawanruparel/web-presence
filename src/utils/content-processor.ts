export interface ContentItem {
  slug: string
  title: string
  date: string
  readTime: string
  type: 'note' | 'teaching' | 'idea'
  excerpt: string
  content?: string
  html?: string
}

export interface ContentList {
  notes: ContentItem[]
  teachings: ContentItem[]
  ideas: ContentItem[]
  latest: ContentItem[]
}

// Import build-time generated metadata
import contentMetadata from '../data/content-metadata.json'

// Content is now available synchronously at build time
const contentData: ContentList = contentMetadata as ContentList

export function getAllContent(): ContentList {
  return contentData
}

export function getContentByType(type: 'notes' | 'teachings' | 'ideas'): ContentItem[] {
  return contentData[type]
}

export function getContentBySlug(type: 'notes' | 'teachings' | 'ideas', slug: string): ContentItem | null {
  const typeContent = contentData[type]
  return typeContent.find(item => item.slug === slug) || null
}

export function getLatestContent(limit: number = 3): ContentItem[] {
  return contentData.latest.slice(0, limit)
}
