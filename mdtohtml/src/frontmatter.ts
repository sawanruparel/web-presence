import matter from 'gray-matter'

/**
 * Comprehensive frontmatter interface supporting all content file fields
 */
export interface Frontmatter {
  // Required/Common fields
  title?: string
  description?: string
  slug?: string
  date?: string
  lastmod?: string
  draft?: boolean
  canonical_url?: string
  robots?: string
  author?: string | string[]
  tags?: string[]
  categories?: string[]
  series?: string
  reading_time?: number
  keywords?: string[]

  // Images
  image?: string
  image_alt?: string

  // Open Graph fields
  og_title?: string
  og_description?: string
  og_type?: 'website' | 'article' | 'product' | 'video' | 'profile'
  og_url?: string
  og_site_name?: string
  og_locale?: string
  og_image?: string
  og_image_alt?: string

  // Twitter fields (using twitter:* format per X's documentation)
  twitter_card?: 'summary' | 'summary_large_image'
  twitter_title?: string
  twitter_description?: string
  twitter_image?: string
  twitter_site?: string
  twitter_creator?: string

  // LinkedIn fields
  linkedin_title?: string
  linkedin_description?: string
  linkedin_image?: string
  linkedin_author?: string

  // Language and localization
  lang?: string
  hreflang?: { lang: string; url: string }[]

  // Schema.org structured data
  schema_type?: 'Article' | 'BlogPosting' | 'NewsArticle' | 'FAQPage' | 'HowTo' | 'Product' | 'Event' | 'VideoObject'
  schema_overrides?: string

  // SEO
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number

  // Layout and styling
  layout?: string
  cssclass?: string
  toc?: boolean

  // URL Management
  redirect_from?: string[]
  canonical_variants?: string[]

  // Build/Publish flags
  noindex_reason?: string
  stage?: string
  expires?: string

  // Media/Video
  video?: {
    url?: string
    duration?: string
    thumbnail?: string
    upload_date?: string
  }

  // Additional fields (catch-all for any other frontmatter)
  [key: string]: any
}

/**
 * Parse frontmatter from markdown content
 */
export function parseFrontmatter(content: string): { frontmatter: Frontmatter | null; body: string } {
  try {
    const { data, content: body } = matter(content)
    return {
      frontmatter: data as Frontmatter,
      body: body.trim()
    }
  } catch (error) {
    console.warn('Warning: Could not parse frontmatter YAML:', error)
    return {
      frontmatter: null,
      body: content
    }
  }
}

/**
 * Validate frontmatter structure
 */
export function validateFrontmatter(frontmatter: any): Frontmatter | null {
  if (!frontmatter || typeof frontmatter !== 'object') {
    return null
  }
  return frontmatter as Frontmatter
}

