/**
 * Utility functions for markdown and HTML processing
 */

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Remove markdown formatting and extract plain text
 */
export function stripMarkdown(content: string): string {
  return content
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, ' ') // Remove code blocks
    .replace(/!\[.*?\]\(.*?\)/g, ' ') // Remove images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/^#{1,6}\s+/gm, '') // Remove headers
    .replace(/[*_~>`#>-]/g, ' ') // Remove markdown syntax
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Calculate word count from text
 */
export function wordCount(text: string): number {
  return (text.match(/\S+/g) || []).length
}

/**
 * Calculate reading time in minutes
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
  const words = wordCount(content)
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

