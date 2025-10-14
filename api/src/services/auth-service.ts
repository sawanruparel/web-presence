import { SignJWT } from 'jose'

interface TokenPayload {
  type: string
  slug: string
  verifiedAt: string
  [key: string]: any
}

export const authService = {
  async verifyPassword(password: string, type: string, slug: string): Promise<boolean> {
    // Generate content-specific password based on type and slug
    const expectedPassword = this.generateContentPassword(type, slug)
    return password === expectedPassword
  },

  generateContentPassword(type: string, slug: string): string {
    // Create a predictable but secure password for each content item
    // Format: {type}-{slug}-{hash}
    const baseString = `${type}-${slug}`
    const hash = this.simpleHash(baseString)
    return `${type}-${slug}-${hash}`
  },

  simpleHash(str: string): string {
    // Simple hash function for generating consistent passwords
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 6)
  },

  async generateToken(payload: TokenPayload): Promise<string> {
    // Simple token generation for now
    const tokenData = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }
    
    // Simple base64 encoding using btoa (available in Cloudflare Workers)
    const token = btoa(JSON.stringify(tokenData))
    return token
  }
}
