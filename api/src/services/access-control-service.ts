import type { Env } from '../types/env'

export interface AccessRule {
  id: number
  type: string
  slug: string
  accessMode: 'open' | 'password' | 'email-list'
  description?: string
  passwordHash?: string
  allowedEmails: string[]
  createdAt: string
  updatedAt: string
}

export class AccessControlService {
  private db: Env['DB']

  constructor(env: Env) {
    this.db = env.DB
  }

  /**
   * Get access rule for specific content
   */
  async getAccessRule(type: string, slug: string): Promise<AccessRule | null> {
    try {
      const query = `
        SELECT 
          id,
          type,
          slug,
          access_mode as accessMode,
          description,
          password_hash as passwordHash,
          created_at as createdAt,
          updated_at as updatedAt
        FROM content_access_rules
        WHERE type = ? AND slug = ?
      `

      const result = await this.db.prepare(query).bind(type, slug).first() as any

      console.log(`🔍 AccessControlService query result for ${type}/${slug}:`, result)

      if (!result) {
        console.log(`🔍 AccessControlService: No result found for ${type}/${slug}`)
        return null
      }

      return {
        id: result.id as number,
        type: result.type as string,
        slug: result.slug as string,
        accessMode: result.accessMode as 'open' | 'password' | 'email-list',
        description: result.description as string | undefined,
        passwordHash: result.passwordHash as string | undefined,
        allowedEmails: [], // Will be populated separately if needed
        createdAt: result.createdAt as string,
        updatedAt: result.updatedAt as string
      }
    } catch (error) {
      console.error(`Error getting access rule for ${type}/${slug}:`, error)
      return null
    }
  }

  /**
   * Get all access rules
   */
  async getAllAccessRules(): Promise<AccessRule[]> {
    try {
      const query = `
        SELECT 
          car.id,
          car.type,
          car.slug,
          car.access_mode as accessMode,
          car.description,
          car.password_hash as passwordHash,
          car.created_at as createdAt,
          car.updated_at as updatedAt,
          GROUP_CONCAT(ea.email) as allowedEmails
        FROM content_access_rules car
        LEFT JOIN email_allowlist ea ON car.id = ea.access_rule_id
        GROUP BY car.id, car.type, car.slug, car.access_mode, car.description, car.password_hash, car.created_at, car.updated_at
        ORDER BY car.type, car.slug
      `

      const result = await this.db.prepare(query).all() as any

      return result.results.map((rule: any) => ({
        id: rule.id as number,
        type: rule.type as string,
        slug: rule.slug as string,
        accessMode: rule.accessMode as 'open' | 'password' | 'email-list',
        description: rule.description as string | undefined,
        passwordHash: rule.passwordHash as string | undefined,
        allowedEmails: rule.allowedEmails ? (rule.allowedEmails as string).split(',') : [],
        createdAt: rule.createdAt as string,
        updatedAt: rule.updatedAt as string
      }))
    } catch (error) {
      console.error('Error getting all access rules:', error)
      return []
    }
  }

  /**
   * Create or update access rule
   */
  async setAccessRule(
    type: string,
    slug: string,
    accessMode: 'open' | 'password' | 'email-list',
    options: {
      description?: string
      passwordHash?: string
      allowedEmails?: string[]
    } = {}
  ): Promise<boolean> {
    try {
      // Start transaction
      const insertRuleQuery = `
        INSERT OR REPLACE INTO content_access_rules 
        (type, slug, access_mode, description, password_hash, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `

      const result = await this.db.prepare(insertRuleQuery)
        .bind(type, slug, accessMode, options.description || null, options.passwordHash || null)
        .run()

      const ruleId = result.meta.last_row_id

      // Update email allowlist if provided
      if (options.allowedEmails !== undefined) {
        // Clear existing allowlist
        await this.db.prepare('DELETE FROM email_allowlist WHERE access_rule_id = ?')
          .bind(ruleId)
          .run()

        // Insert new allowlist entries
        for (const email of options.allowedEmails) {
          await this.db.prepare(
            'INSERT INTO email_allowlist (access_rule_id, email) VALUES (?, ?)'
          ).bind(ruleId, email.toLowerCase().trim()).run()
        }
      }

      return true
    } catch (error) {
      console.error(`Error setting access rule for ${type}/${slug}:`, error)
      return false
    }
  }

  /**
   * Delete access rule
   */
  async deleteAccessRule(type: string, slug: string): Promise<boolean> {
    try {
      const result = await this.db.prepare(
        'DELETE FROM content_access_rules WHERE type = ? AND slug = ?'
      ).bind(type, slug).run()

      return result.meta.changes > 0
    } catch (error) {
      console.error(`Error deleting access rule for ${type}/${slug}:`, error)
      return false
    }
  }

  /**
   * Log access attempt
   */
  async logAccessAttempt(
    type: string,
    slug: string,
    accessGranted: boolean,
    credentialType?: string,
    credentialValue?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Get access rule ID
      const ruleResult = await this.db.prepare(
        'SELECT id FROM content_access_rules WHERE type = ? AND slug = ?'
      ).bind(type, slug).first() as any

      const accessRuleId = ruleResult?.id || null

      // Log the access attempt
      await this.db.prepare(`
        INSERT INTO access_logs 
        (access_rule_id, type, slug, access_granted, credential_type, credential_value, ip_address, user_agent, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        accessRuleId,
        type,
        slug,
        accessGranted,
        credentialType || null,
        credentialValue || null,
        ipAddress || null,
        userAgent || null
      ).run()
    } catch (error) {
      console.error('Error logging access attempt:', error)
      // Don't throw - logging failures shouldn't break the main flow
    }
  }

  /**
   * Verify password for content
   */
  async verifyPassword(type: string, slug: string, password: string): Promise<boolean> {
    try {
      const rule = await this.getAccessRule(type, slug)
      
      if (!rule || rule.accessMode !== 'password' || !rule.passwordHash) {
        return false
      }

      // Simple password verification (in production, use bcrypt)
      const providedHash = await this.hashPassword(password)
      return providedHash === rule.passwordHash
    } catch (error) {
      console.error(`Error verifying password for ${type}/${slug}:`, error)
      return false
    }
  }

  /**
   * Check if email is allowed for content
   */
  async isEmailAllowed(type: string, slug: string, email: string): Promise<boolean> {
    try {
      const rule = await this.getAccessRule(type, slug)
      
      if (!rule || rule.accessMode !== 'email-list') {
        return false
      }

      return rule.allowedEmails.includes(email.toLowerCase().trim())
    } catch (error) {
      console.error(`Error checking email access for ${type}/${slug}:`, error)
      return false
    }
  }

  /**
   * Simple password hashing (in production, use bcrypt)
   */
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Get access rules as a flat object for backward compatibility
   */
  async getAccessRulesAsObject(): Promise<Record<string, Record<string, any>> | null> {
    try {
      const rules = await this.getAllAccessRules()
      const result: Record<string, Record<string, any>> = {}

      for (const rule of rules) {
        if (!result[rule.type]) {
          result[rule.type] = {}
        }

        result[rule.type][rule.slug] = {
          mode: rule.accessMode,
          description: rule.description,
          allowedEmails: rule.allowedEmails
        }
      }

      return result
    } catch (error) {
      console.error('Error getting access rules as object:', error)
      return null
    }
  }
}

/**
 * Factory function to create AccessControlService instance
 */
export function createAccessControlService(db: Env['DB']): AccessControlService {
  return new AccessControlService({ DB: db } as Env)
}