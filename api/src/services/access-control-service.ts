import type { AccessControlConfig, AccessControlRule, AccessMode } from '../../../types/api'

// Configuration will be loaded synchronously when the module is imported
// In Cloudflare Workers, this will be bundled at build time
const accessControlConfig: AccessControlConfig = {
  contentAccessRules: {
    notes: {
      'physical-interfaces': {
        mode: 'open',
        description: 'Physical interfaces concepts'
      },
      'sample-protected-idea': {
        mode: 'password',
        description: 'Sample protected note'
      }
    },
    publications: {
      'decisionrecord-io': {
        mode: 'email-list',
        description: 'Decision Record IO publication',
        allowedEmails: [
          'admin@example.com',
          'reviewer@example.com'
        ]
      }
    },
    ideas: {
      'extending-carplay': {
        mode: 'open',
        description: 'CarPlay extension concepts'
      },
      'local-first-ai': {
        mode: 'password',
        description: 'Local-first AI implementation'
      }
    },
    pages: {
      about: {
        mode: 'open',
        description: 'About page'
      },
      contact: {
        mode: 'open',
        description: 'Contact page'
      }
    }
  }
}

export interface TokenPayload {
  type: string
  slug: string
  email?: string
  verifiedAt: string
  [key: string]: any
}

export const accessControlService = {
  /**
   * Get access control rule for a specific content item
   */
  getAccessRule(type: string, slug: string): AccessControlRule | null {
    const typeRules = accessControlConfig.contentAccessRules[type as keyof typeof accessControlConfig.contentAccessRules]
    
    if (!typeRules) {
      return null
    }
    
    return typeRules[slug] || null
  },

  /**
   * Check if content is accessible (mode is 'open')
   */
  isPubliclyAccessible(type: string, slug: string): boolean {
    const rule = this.getAccessRule(type, slug)
    return rule?.mode === 'open'
  },

  /**
   * Verify password for password-protected content
   */
  async verifyPassword(password: string, type: string, slug: string): Promise<boolean> {
    const rule = this.getAccessRule(type, slug)
    
    if (!rule || rule.mode !== 'password') {
      return false
    }

    // Generate content-specific password based on type and slug
    const expectedPassword = this.generateContentPassword(type, slug)
    return password === expectedPassword
  },

  /**
   * Verify email is in allowed list for email-list protected content
   */
  verifyEmail(email: string, type: string, slug: string): boolean {
    const rule = this.getAccessRule(type, slug)
    
    if (!rule || rule.mode !== 'email-list') {
      return false
    }

    if (!rule.allowedEmails) {
      return false
    }

    // Normalize email to lowercase for comparison
    const normalizedEmail = email.toLowerCase().trim()
    return rule.allowedEmails.some(allowed => 
      allowed.toLowerCase().trim() === normalizedEmail
    )
  },

  /**
   * Generate content-specific password (same logic as before)
   */
  generateContentPassword(type: string, slug: string): string {
    const baseString = `${type}-${slug}`
    const hash = this.simpleHash(baseString)
    return `${type}-${slug}-${hash}`
  },

  /**
   * Simple hash function for generating consistent passwords
   */
  simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 6)
  },

  /**
   * Generate JWT token for verified access
   */
  async generateToken(payload: TokenPayload): Promise<string> {
    const tokenData = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }
    
    // Simple base64 encoding using btoa (available in Cloudflare Workers)
    const token = btoa(JSON.stringify(tokenData))
    return token
  },

  /**
   * Get access mode for content
   */
  getAccessMode(type: string, slug: string): AccessMode {
    const rule = this.getAccessRule(type, slug)
    return rule?.mode || 'open'
  }
}
