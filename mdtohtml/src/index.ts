/**
 * mdtohtml - Shared Markdown to HTML Converter
 * 
 * Provides consistent markdown to HTML conversion, frontmatter parsing,
 * and HTML template generation with JSON-LD structured data support.
 */

// Frontmatter
export type { Frontmatter } from './frontmatter'
export { parseFrontmatter, validateFrontmatter } from './frontmatter'

// Converter
export type { ConverterOptions } from './converter'
export { convertMarkdownToHtml, removeTitleFromHtml, generateExcerpt } from './converter'

// HTML Template
export type { HtmlTemplateOptions } from './html-template'
export { generateHtmlTemplate } from './html-template'

// JSON-LD
export type { JsonLdOptions } from './json-ld'
export { generateJsonLd } from './json-ld'

// Utils
export { escapeHtml, stripMarkdown, wordCount, calculateReadingTime } from './utils'

