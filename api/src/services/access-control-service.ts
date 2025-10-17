import type { AccessMode } from '../../../types/api'
import type { D1Database } from '../types/env'
import { createDatabaseService, type DatabaseService } from './database-service'
import { verifyPassword as verifyPasswordHash } from '../utils/password'

/**
 * Access Control Service
 * 
 * Provides access control logic using database as source of truth.
 * This service wraps DatabaseService to provide domain-specific access control operations.
 */

export interface TokenPayload {
  type: string
  slug: string
  email?: string
  verifiedAt: string
  [key: string]: any
}

/**
 * Create access control service instance with database connection
 */
export function createAccessControlService(db: D1Database) {
  const dbService = createDatabaseService(db)
  
  return {
    /**
     * Get access control rule for a specific content item
     */
    async getAccessRule(type: string, slug: string) {
      const rule = await dbService.getAccessRule(type, slug)
      
      if (!rule) {
        return null
      }
      
      // Return in legacy format for compatibility
      return {
        mode: rule.access_mode,
        description: rule.description || undefined,
        allowedEmails: rule.access_mode === 'email-list' 
          ? await dbService.getEmailsForRule(rule.id)
          : undefined
      }
    },

    /**
     * Check if content is accessible (mode is 'open')
     */
    async isPubliclyAccessible(type: string, slug: string): Promise<boolean> {
      const rule = await dbService.getAccessRule(type, slug)
      
      // If no rule exists, default to open access
      if (!rule) {
        return true
      }
      
      return rule.access_mode === 'open'
    },

    /**
     * Verify password for password-protected content
     * Logs access attempts to database
     */
    async verifyPassword(
      password: string, 
      type: string, 
      slug: string,
      ipAddress?: string,
      userAgent?: string
    ): Promise<boolean> {
      const rule = await dbService.getAccessRule(type, slug)
      
      if (!rule) {
        // Log failed attempt - no rule found
        await dbService.logAccess({
          type,
          slug,
          access_granted: false,
          credential_type: 'password',
          ip_address: ipAddress,
          user_agent: userAgent
        })
        return false
      }
      
      if (rule.access_mode !== 'password') {
        // Log failed attempt - wrong access mode
        await dbService.logAccess({
          access_rule_id: rule.id,
          type,
          slug,
          access_granted: false,
          credential_type: 'password',
          ip_address: ipAddress,
          user_agent: userAgent
        })
        return false
      }

      if (!rule.password_hash) {
        // Log failed attempt - no password set
        await dbService.logAccess({
          access_rule_id: rule.id,
          type,
          slug,
          access_granted: false,
          credential_type: 'password',
          ip_address: ipAddress,
          user_agent: userAgent
        })
        return false
      }

      // Verify password hash
      const isValid = await verifyPasswordHash(password, rule.password_hash)
      
      // Log access attempt
      await dbService.logAccess({
        access_rule_id: rule.id,
        type,
        slug,
        access_granted: isValid,
        credential_type: 'password',
        ip_address: ipAddress,
        user_agent: userAgent
      })
      
      return isValid
    },

    /**
     * Verify email is in allowed list for email-list protected content
     * Logs access attempts to database
     */
    async verifyEmail(
      email: string, 
      type: string, 
      slug: string,
      ipAddress?: string,
      userAgent?: string
    ): Promise<boolean> {
      const rule = await dbService.getAccessRule(type, slug)
      
      if (!rule) {
        // Log failed attempt - no rule found
        await dbService.logAccess({
          type,
          slug,
          access_granted: false,
          credential_type: 'email',
          credential_value: email,
          ip_address: ipAddress,
          user_agent: userAgent
        })
        return false
      }
      
      if (rule.access_mode !== 'email-list') {
        // Log failed attempt - wrong access mode
        await dbService.logAccess({
          access_rule_id: rule.id,
          type,
          slug,
          access_granted: false,
          credential_type: 'email',
          credential_value: email,
          ip_address: ipAddress,
          user_agent: userAgent
        })
        return false
      }

      // Check if email is in allowlist
      const isAllowed = await dbService.isEmailAllowed(rule.id, email)
      
      // Log access attempt
      await dbService.logAccess({
        access_rule_id: rule.id,
        type,
        slug,
        access_granted: isAllowed,
        credential_type: 'email',
        credential_value: email,
        ip_address: ipAddress,
        user_agent: userAgent
      })
      
      return isAllowed
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
    async getAccessMode(type: string, slug: string): Promise<AccessMode> {
      const rule = await dbService.getAccessRule(type, slug)
      return rule?.access_mode || 'open'
    },

    /**
     * Log successful open access
     */
    async logOpenAccess(
      type: string, 
      slug: string, 
      ipAddress?: string,
      userAgent?: string
    ) {
      const rule = await dbService.getAccessRule(type, slug)
      
      await dbService.logAccess({
        access_rule_id: rule?.id,
        type,
        slug,
        access_granted: true,
        credential_type: 'none',
        ip_address: ipAddress,
        user_agent: userAgent
      })
    }
  }
}

// Export type for the service
export type AccessControlService = ReturnType<typeof createAccessControlService>
