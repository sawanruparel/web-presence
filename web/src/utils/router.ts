import { getAllContent, getContentBySlug } from './content-processor'

export type PageType = 'about' | 'notes' | 'publications' | 'ideas' | 'content' | 'contact' | 'admin-content' | 'admin-build-logs' | '404'

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

  if (path === '/publications') {
    return { type: 'publications', data: { publications: allContent.publications } }
  }

  if (path === '/ideas') {
    return { type: 'ideas', data: { ideas: allContent.ideas } }
  }

  // Admin content page
  if (path === '/admin/content') {
    return { type: 'admin-content', data: {} }
  }

  // Admin build logs page
  if (path === '/admin/build-logs') {
    return { type: 'admin-build-logs', data: {} }
  }

  // Individual content pages
  const contentMatch = path.match(/^\/(notes|publications|ideas)\/(.+)$/)
  if (contentMatch) {
    const [, type, slug] = contentMatch
    const content = getContentBySlug(type as 'notes' | 'publications' | 'ideas', slug)
    
    // Always return content page, even if content is null (for protected content)
    return { 
      type: 'content', 
      data: { 
        content, 
        type: type as 'notes' | 'publications' | 'ideas',
        slug 
      } 
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
