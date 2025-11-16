import type { Frontmatter } from './frontmatter'
import { escapeHtml } from './utils'

/**
 * Options for JSON-LD generation
 */
export interface JsonLdOptions {
  baseUrl?: string
  publisherName?: string
}

/**
 * Generate JSON-LD structured data based on schema_type
 */
export function generateJsonLd(frontmatter: Frontmatter, options?: JsonLdOptions): string {
  const { baseUrl, publisherName = 'Web Presence' } = options || {}
  
  if (!frontmatter) {
    return ''
  }

  const schemaType = frontmatter.schema_type || 'Article'
  const title = frontmatter.title || ''
  const description = frontmatter.description || ''
  const author = Array.isArray(frontmatter.author) 
    ? frontmatter.author.join(', ') 
    : frontmatter.author || 'Unknown Author'

  // Base structured data
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    headline: title,
    description: description,
    author: {
      '@type': 'Person',
      name: author
    },
    publisher: {
      '@type': 'Organization',
      name: publisherName
    }
  }

  // Add dates
  if (frontmatter.date) {
    structuredData.datePublished = frontmatter.date
  }
  if (frontmatter.lastmod) {
    structuredData.dateModified = frontmatter.lastmod
  } else if (frontmatter.date) {
    structuredData.dateModified = frontmatter.date
  }

  // Add URL
  if (frontmatter.canonical_url) {
    structuredData.url = frontmatter.canonical_url
  } else if (baseUrl && frontmatter.slug) {
    structuredData.url = `${baseUrl}/${frontmatter.slug}.html`
  }

  // Add image
  if (frontmatter.image) {
    structuredData.image = frontmatter.image
  }

  // Add keywords
  if (frontmatter.keywords && frontmatter.keywords.length > 0) {
    structuredData.keywords = frontmatter.keywords.join(', ')
  } else if (frontmatter.tags && frontmatter.tags.length > 0) {
    structuredData.keywords = frontmatter.tags.join(', ')
  }

  // Add language
  if (frontmatter.lang) {
    structuredData.inLanguage = frontmatter.lang
  }

  // Schema-type specific fields
  switch (schemaType) {
    case 'Article':
    case 'BlogPosting':
    case 'NewsArticle':
      if (frontmatter.lang) {
        structuredData.inLanguage = frontmatter.lang
      }
      // Could add articleSection, wordCount if available
      break

    case 'FAQPage':
      // Could add mainEntity if provided in frontmatter
      break

    case 'HowTo':
      // Could add steps, totalTime if provided
      break

    case 'Product':
      // Could add offers, brand if provided
      break

    case 'Event':
      // Could add startDate, endDate, location if provided
      break

    case 'VideoObject':
      if (frontmatter.video) {
        if (frontmatter.video.url) {
          structuredData.contentUrl = frontmatter.video.url
        }
        if (frontmatter.video.duration) {
          structuredData.duration = frontmatter.video.duration
        }
        if (frontmatter.video.thumbnail) {
          structuredData.thumbnailUrl = frontmatter.video.thumbnail
        }
        if (frontmatter.video.upload_date) {
          structuredData.uploadDate = frontmatter.video.upload_date
        }
      }
      break
  }

  // Support schema_overrides for custom extensions
  if (frontmatter.schema_overrides) {
    try {
      const overrides = JSON.parse(frontmatter.schema_overrides)
      Object.assign(structuredData, overrides)
    } catch (error) {
      console.warn('Warning: Could not parse schema_overrides JSON:', error)
    }
  }

  // Generate JSON-LD script tag
  const jsonLd = JSON.stringify(structuredData, null, 2)
  
  return `<script type="application/ld+json">
${jsonLd}
</script>`
}

