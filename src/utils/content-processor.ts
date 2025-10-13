export interface ContentItem {
  slug: string
  title: string
  date: string
  readTime: string
  type: 'note' | 'teaching' | 'idea'
  content: string
  html: string
  excerpt: string
}

export interface ContentList {
  notes: ContentItem[]
  teachings: ContentItem[]
  ideas: ContentItem[]
  latest: ContentItem[]
}

// Load content from build-time generated JSON
let contentData: ContentList | null = null

async function loadContent(): Promise<ContentList> {
  if (contentData) {
    return contentData
  }

  try {
    // Try to load from the generated content file
    const response = await fetch('/src/data/content.json')
    if (response.ok) {
      const data = await response.json()
      contentData = data as ContentList
      return contentData
    }
  } catch (error) {
    console.warn('Could not load content from JSON, using fallback')
  }

  // Fallback content if JSON loading fails
  contentData = {
    notes: [
      {
        slug: 'physical-interfaces',
        title: 'A note on physical interfaces',
        date: '2025-07-15',
        readTime: '2 min',
        type: 'note',
        content: 'Why knobs and buttons matter again...',
        html: '<p>Why knobs and buttons matter again...</p>',
        excerpt: 'Why knobs and buttons matter again. In an age where everything is touchscreens and voice commands...'
      }
    ],
    teachings: [
      {
        slug: 'structured-prompts',
        title: 'Teaching: structured data prompts',
        date: '2025-06-20',
        readTime: '6 min',
        type: 'teaching',
        content: 'Slides + exercises for reliable LLM behaviors...',
        html: '<p>Slides + exercises for reliable LLM behaviors...</p>',
        excerpt: 'Slides + exercises for reliable LLM behaviors. This teaching session covers how to use structured prompts...'
      }
    ],
    ideas: [
      {
        slug: 'local-first-ai',
        title: 'Idea: local-first AI systems',
        date: '2025-05-10',
        readTime: '4 min',
        type: 'idea',
        content: 'Edge inference, sync, and privacy by default...',
        html: '<p>Edge inference, sync, and privacy by default...</p>',
        excerpt: 'Edge inference, sync, and privacy by default. Current AI systems are centralized, requiring constant internet...'
      }
    ],
    latest: []
  }

  // Generate latest content
  contentData.latest = [...contentData.notes, ...contentData.teachings, ...contentData.ideas]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  return contentData
}

export async function getAllContent(): Promise<ContentList> {
  return await loadContent()
}

export async function getContentByType(type: 'notes' | 'teachings' | 'ideas'): Promise<ContentItem[]> {
  const content = await loadContent()
  return content[type]
}

export async function getContentBySlug(type: 'notes' | 'teachings' | 'ideas', slug: string): Promise<ContentItem | null> {
  const content = await loadContent()
  const typeContent = content[type]
  return typeContent.find(item => item.slug === slug) || null
}

export async function getLatestContent(limit: number = 3): Promise<ContentItem[]> {
  const content = await loadContent()
  return content.latest.slice(0, limit)
}
