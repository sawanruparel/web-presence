import { getAllContent, getContentBySlug } from './content-processor'

export type PageType = 'about' | 'notes' | 'teachings' | 'ideas' | 'content' | 'contact' | '404'

export interface PageData {
  type: PageType
  data?: any
}

export function getCurrentPage(): PageData {
  const path = window.location.pathname
  const allContent = getAllContent()

  // About page (default/home)
  if (path === '/' || path === '' || path === '/about') {
    return { type: 'about', data: {} }
  }

  // Contact page
  if (path === '/contact') {
    return { type: 'contact', data: {} }
  }

  // Section pages
  if (path === '/notes') {
    return { type: 'notes', data: { notes: allContent.notes } }
  }

  if (path === '/teachings') {
    return { type: 'teachings', data: { teachings: allContent.teachings } }
  }

  if (path === '/ideas') {
    return { type: 'ideas', data: { ideas: allContent.ideas } }
  }

  // Individual content pages
  const contentMatch = path.match(/^\/(notes|teachings|ideas)\/(.+)$/)
  if (contentMatch) {
    const [, type, slug] = contentMatch
    const content = getContentBySlug(type as 'notes' | 'teachings' | 'ideas', slug)
    
    if (content) {
      return { type: 'content', data: { content, type: type as 'notes' | 'teachings' | 'ideas' } }
    }
  }

  // 404 - return about for now
  return { type: 'about', data: {} }
}

export function navigateTo(path: string) {
  window.history.pushState({}, '', path)
  // Trigger a re-render by dispatching a custom event
  window.dispatchEvent(new PopStateEvent('popstate'))
}
