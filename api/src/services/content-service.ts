import type { ProtectedContentResponse } from '../../../types/api'
import type { Env } from '../types/env'

export const contentService = {
  async getProtectedContent(
    type: 'notes' | 'publications' | 'ideas' | 'pages',
    slug: string,
    env: Env
  ): Promise<string | null> {
    try {
      const key = `${type}/${slug}.html`
      
      // Fetch HTML content from R2 bucket
      const object = await env.PROTECTED_CONTENT_BUCKET.get(key)
      
      if (!object) {
        console.log(`Protected content not found in R2: ${key}`)
        return null
      }
      
      // Get the HTML content as text
      const htmlContent = await object.text()
      
      console.log(`Successfully fetched protected content from R2: ${key}`)
      return htmlContent
      
    } catch (error) {
      console.error(`Error fetching protected content from R2 (${type}/${slug}):`, error)
      return null
    }
  }
}
