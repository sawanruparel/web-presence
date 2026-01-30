import { marked } from 'marked'
import type { MarkedOptions } from 'marked'
import { stripMarkdown } from './utils'

/**
 * Options for markdown conversion
 */
export interface ConverterOptions extends Partial<MarkedOptions> {
  breaks?: boolean
  gfm?: boolean
}

/**
 * Default converter options
 */
const DEFAULT_OPTIONS: ConverterOptions = {
  breaks: false,
  gfm: true
}

/**
 * Convert markdown to HTML
 */
export function convertMarkdownToHtml(markdown: string, options?: ConverterOptions): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Configure marked with options
  marked.setOptions(opts as MarkedOptions)

  return marked.parse(markdown) as string
}

/**
 * Remove title from HTML if it's the first h1 and matches the given title
 */
export function removeTitleFromHtml(html: string, title: string): string {
  // Escape title for regex
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const titleRegex = new RegExp(`<h1[^>]*>${escapedTitle}</h1>`, 'i')
  return html.replace(titleRegex, '').trim()
}

/**
 * Generate excerpt from markdown content
 */
export function generateExcerpt(content: string, maxLength: number = 160): string {
  const plainText = stripMarkdown(content)

  if (plainText.length <= maxLength) {
    return plainText
  }

  // Try to cut at word boundary
  const cut = plainText.substring(0, maxLength - 1)
  const lastSpace = cut.lastIndexOf(' ')

  if (lastSpace > maxLength * 0.6) {
    return cut.substring(0, lastSpace) + '...'
  }

  return cut + '...'
}

