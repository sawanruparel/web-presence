import type { Frontmatter } from './frontmatter'
import { escapeHtml } from './utils'
import { generateJsonLd } from './json-ld'

/**
 * Options for HTML template generation
 */
export interface HtmlTemplateOptions {
  frontmatter: Frontmatter
  htmlContent: string
  baseUrl: string
  jsAsset?: string
  cssAsset?: string
  publisherName?: string
}

/**
 * Generate complete HTML document with SEO optimization
 */
export function generateHtmlTemplate(options: HtmlTemplateOptions): string {
  const { frontmatter, htmlContent, baseUrl, jsAsset, cssAsset, publisherName } = options

  const title = frontmatter.title || 'Untitled'
  const description = frontmatter.description || ''
  const author = Array.isArray(frontmatter.author) 
    ? frontmatter.author.join(', ') 
    : frontmatter.author || 'Unknown Author'
  
  const tags = frontmatter.tags || []
  const keywords = frontmatter.keywords || []
  const canonicalUrl = frontmatter.canonical_url || `${baseUrl}/${frontmatter.slug || 'content'}.html`

  // Generate JSON-LD structured data
  const jsonLd = generateJsonLd(frontmatter, { baseUrl, publisherName })

  return `<!DOCTYPE html>
<html lang="${frontmatter.lang || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="${frontmatter.robots || 'index, follow'}">
    <meta name="author" content="${escapeHtml(author)}">
    <meta name="generator" content="mdtohtml">
    <meta name="theme-color" content="#007bff">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    ${keywords.length > 0 ? `<meta name="keywords" content="${keywords.map(escapeHtml).join(', ')}">` : ''}
    ${frontmatter.reading_time ? `<meta name="reading-time" content="${frontmatter.reading_time}">` : ''}
    <meta name="article:published_time" content="${frontmatter.date || new Date().toISOString().split('T')[0]}">
    <meta name="article:modified_time" content="${frontmatter.lastmod || frontmatter.date || new Date().toISOString().split('T')[0]}">
    ${tags.length > 0 ? tags.map(tag => `    <meta name="article:tag" content="${escapeHtml(tag)}">`).join('\n') : ''}
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${frontmatter.og_type || 'article'}">
    <meta property="og:url" content="${frontmatter.og_url || frontmatter.canonical_url || canonicalUrl}">
    <meta property="og:title" content="${escapeHtml(frontmatter.og_title || title)}">
    <meta property="og:description" content="${escapeHtml(frontmatter.og_description || description)}">
    <meta property="og:site_name" content="${frontmatter.og_site_name || 'Web Presence'}">
    <meta property="og:locale" content="${frontmatter.og_locale || frontmatter.lang || 'en_US'}">
    ${frontmatter.og_image || frontmatter.image ? `<meta property="og:image" content="${escapeHtml(frontmatter.og_image || frontmatter.image || '')}">` : ''}
    ${frontmatter.og_image_alt || frontmatter.image_alt ? `<meta property="og:image:alt" content="${escapeHtml(frontmatter.og_image_alt || frontmatter.image_alt || '')}">` : ''}
    <meta property="article:author" content="${escapeHtml(author)}">
    <meta property="article:published_time" content="${frontmatter.date || new Date().toISOString().split('T')[0]}">
    <meta property="article:modified_time" content="${frontmatter.lastmod || frontmatter.date || new Date().toISOString().split('T')[0]}">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="${frontmatter.twitter_card || 'summary'}">
    <meta name="twitter:url" content="${frontmatter.og_url || frontmatter.canonical_url || canonicalUrl}">
    <meta name="twitter:title" content="${escapeHtml(frontmatter.twitter_title || frontmatter.og_title || title)}">
    <meta name="twitter:description" content="${escapeHtml(frontmatter.twitter_description || frontmatter.og_description || description)}">
    ${frontmatter.twitter_image || frontmatter.image ? `<meta name="twitter:image" content="${escapeHtml(frontmatter.twitter_image || frontmatter.image || '')}">` : ''}
    ${frontmatter.twitter_site ? `<meta name="twitter:site" content="${escapeHtml(frontmatter.twitter_site)}">` : ''}
    ${frontmatter.twitter_creator ? `<meta name="twitter:creator" content="${escapeHtml(frontmatter.twitter_creator)}">` : ''}
    
    <!-- LinkedIn -->
    <meta name="linkedin:title" content="${escapeHtml(frontmatter.linkedin_title || frontmatter.og_title || title)}">
    <meta name="linkedin:description" content="${escapeHtml(frontmatter.linkedin_description || frontmatter.og_description || description)}">
    ${frontmatter.linkedin_image || frontmatter.image ? `<meta name="linkedin:image" content="${escapeHtml(frontmatter.linkedin_image || frontmatter.image || '')}">` : ''}
    ${frontmatter.linkedin_author ? `<meta name="linkedin:author" content="${escapeHtml(frontmatter.linkedin_author)}">` : ''}
    
    ${cssAsset ? `<link rel="stylesheet" href="${cssAsset}">` : ''}
    
    ${jsonLd}
</head>
<body${frontmatter.layout ? ` class="${escapeHtml(frontmatter.layout)}"` : ''}>
    <main>
        <article>
            <header>
                <h1>${escapeHtml(title)}</h1>
                <div class="meta">
                    <time datetime="${frontmatter.date || new Date().toISOString().split('T')[0]}">
                        ${frontmatter.date ? new Date(frontmatter.date).toLocaleDateString() : 'Not specified'}
                    </time>
                    ${frontmatter.reading_time ? `<span class="read-time">${frontmatter.reading_time} min read</span>` : ''}
                </div>
            </header>
            <div class="content">
                ${htmlContent}
            </div>
        </article>
    </main>
    ${jsAsset ? `<script src="${jsAsset}"></script>` : ''}
</body>
</html>`
}

