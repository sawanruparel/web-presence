import type { ProtectedContentResponse } from '../../../types/api'
import type { Env } from '../types/env'

export const contentService = {
  async getProtectedContent(
    type: 'notes' | 'publications' | 'ideas' | 'pages',
    slug: string,
    env: Env
  ): Promise<ProtectedContentResponse | null> {
    try {
      const key = `${type}/${slug}.json`
      
      // Fetch content from R2 bucket
      const object = await env.PROTECTED_CONTENT_BUCKET.get(key)
      
      if (!object) {
        console.log(`Protected content not found in R2: ${key}`)
        return null
      }
      
      // Parse the JSON content
      const contentData = await object.json() as ProtectedContentResponse
      
      console.log(`Successfully fetched protected content from R2: ${key}`)
      return contentData
      
    } catch (error) {
      console.error(`Error fetching protected content from R2 (${type}/${slug}):`, error)
      return null
    }
  }
}
