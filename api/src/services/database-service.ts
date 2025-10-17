/**
 * Database Service Layer
 * 
 * Provides CRUD operations for:
 * - Content access rules
 * - Email allowlists
 * - Access logs
 * 
 * This service abstracts all database interactions and provides
 * a clean API for the rest of the application.
 */

import type { D1Database } from './types/env'
import type { AccessMode } from '../../types/api'

// ============================================================
// Types
// ============================================================

export interface AccessRule {
  id: number
  type: string
  slug: string
  access_mode: AccessMode
  description: string | null
  password_hash: string | null
  created_at: string
  updated_at: string
}

export interface EmailAllowlistEntry {
  id: number
  access_rule_id: number
  email: string
  added_at: string
}

export interface AccessLog {
  id: number
  access_rule_id: number | null
  type: string
  slug: string
  access_granted: boolean
  credential_type: string | null
  credential_value: string | null
  ip_address: string | null
  user_agent: string | null
  timestamp: string
}

export interface CreateAccessRuleInput {
  type: string
  slug: string
  access_mode: AccessMode
  description?: string
  password_hash?: string
}

export interface UpdateAccessRuleInput {
  access_mode?: AccessMode
  description?: string
  password_hash?: string
}

export interface CreateAccessLogInput {
  access_rule_id?: number
  type: string
  slug: string
  access_granted: boolean
  credential_type?: string
  credential_value?: string
  ip_address?: string
  user_agent?: string
}

// ============================================================
// Database Service Class
// ============================================================

export class DatabaseService {
  constructor(private db: D1Database) {}

  // ============================================================
  // Content Access Rules
  // ============================================================

  /**
   * Get all access rules
   */
  async getAllAccessRules(): Promise<AccessRule[]> {
    const result = await this.db
      .prepare('SELECT * FROM content_access_rules ORDER BY type, slug')
      .all<AccessRule>()
    
    return result.results || []
  }

  /**
   * Get access rule by type and slug
   */
  async getAccessRule(type: string, slug: string): Promise<AccessRule | null> {
    const result = await this.db
      .prepare('SELECT * FROM content_access_rules WHERE type = ? AND slug = ?')
      .bind(type, slug)
      .first<AccessRule>()
    
    return result
  }

  /**
   * Get access rules by type
   */
  async getAccessRulesByType(type: string): Promise<AccessRule[]> {
    const result = await this.db
      .prepare('SELECT * FROM content_access_rules WHERE type = ? ORDER BY slug')
      .bind(type)
      .all<AccessRule>()
    
    return result.results || []
  }

  /**
   * Get access rules by mode
   */
  async getAccessRulesByMode(mode: AccessMode): Promise<AccessRule[]> {
    const result = await this.db
      .prepare('SELECT * FROM content_access_rules WHERE access_mode = ? ORDER BY type, slug')
      .bind(mode)
      .all<AccessRule>()
    
    return result.results || []
  }

  /**
   * Create new access rule
   */
  async createAccessRule(input: CreateAccessRuleInput): Promise<AccessRule> {
    const now = new Date().toISOString()
    
    const result = await this.db
      .prepare(`
        INSERT INTO content_access_rules (type, slug, access_mode, description, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        input.type,
        input.slug,
        input.access_mode,
        input.description || null,
        input.password_hash || null,
        now,
        now
      )
      .first<AccessRule>()
    
    if (!result) {
      throw new Error('Failed to create access rule')
    }
    
    return result
  }

  /**
   * Update existing access rule
   */
  async updateAccessRule(
    type: string,
    slug: string,
    input: UpdateAccessRuleInput
  ): Promise<AccessRule> {
    const now = new Date().toISOString()
    
    // Build dynamic update query
    const updates: string[] = []
    const values: any[] = []
    
    if (input.access_mode !== undefined) {
      updates.push('access_mode = ?')
      values.push(input.access_mode)
    }
    
    if (input.description !== undefined) {
      updates.push('description = ?')
      values.push(input.description)
    }
    
    if (input.password_hash !== undefined) {
      updates.push('password_hash = ?')
      values.push(input.password_hash)
    }
    
    updates.push('updated_at = ?')
    values.push(now)
    
    // Add WHERE clause values
    values.push(type, slug)
    
    const result = await this.db
      .prepare(`
        UPDATE content_access_rules
        SET ${updates.join(', ')}
        WHERE type = ? AND slug = ?
        RETURNING *
      `)
      .bind(...values)
      .first<AccessRule>()
    
    if (!result) {
      throw new Error('Access rule not found or update failed')
    }
    
    return result
  }

  /**
   * Delete access rule
   */
  async deleteAccessRule(type: string, slug: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM content_access_rules WHERE type = ? AND slug = ?')
      .bind(type, slug)
      .run()
    
    return result.meta.changes > 0
  }

  // ============================================================
  // Email Allowlist
  // ============================================================

  /**
   * Get all emails for an access rule
   */
  async getEmailsForRule(accessRuleId: number): Promise<string[]> {
    const result = await this.db
      .prepare('SELECT email FROM email_allowlist WHERE access_rule_id = ? ORDER BY email')
      .bind(accessRuleId)
      .all<{ email: string }>()
    
    return (result.results || []).map(row => row.email)
  }

  /**
   * Check if email is in allowlist for a rule
   */
  async isEmailAllowed(accessRuleId: number, email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim()
    
    const result = await this.db
      .prepare('SELECT COUNT(*) as count FROM email_allowlist WHERE access_rule_id = ? AND email = ?')
      .bind(accessRuleId, normalizedEmail)
      .first<{ count: number }>()
    
    return (result?.count || 0) > 0
  }

  /**
   * Add email to allowlist
   */
  async addEmailToAllowlist(accessRuleId: number, email: string): Promise<EmailAllowlistEntry> {
    const normalizedEmail = email.toLowerCase().trim()
    const now = new Date().toISOString()
    
    const result = await this.db
      .prepare(`
        INSERT INTO email_allowlist (access_rule_id, email, added_at)
        VALUES (?, ?, ?)
        RETURNING *
      `)
      .bind(accessRuleId, normalizedEmail, now)
      .first<EmailAllowlistEntry>()
    
    if (!result) {
      throw new Error('Failed to add email to allowlist')
    }
    
    return result
  }

  /**
   * Remove email from allowlist
   */
  async removeEmailFromAllowlist(accessRuleId: number, email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim()
    
    const result = await this.db
      .prepare('DELETE FROM email_allowlist WHERE access_rule_id = ? AND email = ?')
      .bind(accessRuleId, normalizedEmail)
      .run()
    
    return result.meta.changes > 0
  }

  /**
   * Replace all emails for a rule (batch operation)
   */
  async replaceEmailsForRule(accessRuleId: number, emails: string[]): Promise<void> {
    // Delete all existing emails
    await this.db
      .prepare('DELETE FROM email_allowlist WHERE access_rule_id = ?')
      .bind(accessRuleId)
      .run()
    
    // Add new emails
    if (emails.length > 0) {
      const now = new Date().toISOString()
      const normalizedEmails = emails.map(e => e.toLowerCase().trim())
      
      // Batch insert
      const statements = normalizedEmails.map(email =>
        this.db
          .prepare('INSERT INTO email_allowlist (access_rule_id, email, added_at) VALUES (?, ?, ?)')
          .bind(accessRuleId, email, now)
      )
      
      await this.db.batch(statements)
    }
  }

  // ============================================================
  // Access Logs
  // ============================================================

  /**
   * Log an access attempt
   */
  async logAccess(input: CreateAccessLogInput): Promise<AccessLog> {
    const now = new Date().toISOString()
    
    const result = await this.db
      .prepare(`
        INSERT INTO access_logs (
          access_rule_id, type, slug, access_granted,
          credential_type, credential_value, ip_address, user_agent, timestamp
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .bind(
        input.access_rule_id || null,
        input.type,
        input.slug,
        input.access_granted ? 1 : 0,
        input.credential_type || null,
        input.credential_value || null,
        input.ip_address || null,
        input.user_agent || null,
        now
      )
      .first<AccessLog>()
    
    if (!result) {
      throw new Error('Failed to log access')
    }
    
    return result
  }

  /**
   * Get recent access logs
   */
  async getRecentAccessLogs(limit: number = 100): Promise<AccessLog[]> {
    const result = await this.db
      .prepare('SELECT * FROM access_logs ORDER BY timestamp DESC LIMIT ?')
      .bind(limit)
      .all<AccessLog>()
    
    return result.results || []
  }

  /**
   * Get access logs for specific content
   */
  async getAccessLogsForContent(type: string, slug: string, limit: number = 50): Promise<AccessLog[]> {
    const result = await this.db
      .prepare('SELECT * FROM access_logs WHERE type = ? AND slug = ? ORDER BY timestamp DESC LIMIT ?')
      .bind(type, slug, limit)
      .all<AccessLog>()
    
    return result.results || []
  }

  /**
   * Get failed access attempts
   */
  async getFailedAccessAttempts(limit: number = 100): Promise<AccessLog[]> {
    const result = await this.db
      .prepare('SELECT * FROM access_logs WHERE access_granted = 0 ORDER BY timestamp DESC LIMIT ?')
      .bind(limit)
      .all<AccessLog>()
    
    return result.results || []
  }

  /**
   * Get access logs by credential value (e.g., email)
   */
  async getAccessLogsByCredential(credentialValue: string, limit: number = 50): Promise<AccessLog[]> {
    const result = await this.db
      .prepare('SELECT * FROM access_logs WHERE credential_value = ? ORDER BY timestamp DESC LIMIT ?')
      .bind(credentialValue, limit)
      .all<AccessLog>()
    
    return result.results || []
  }

  /**
   * Get access statistics for a time period
   */
  async getAccessStats(startDate?: string, endDate?: string): Promise<{
    total: number
    granted: number
    denied: number
    byType: Record<string, number>
    byMode: Record<string, number>
  }> {
    let query = 'SELECT COUNT(*) as count, access_granted FROM access_logs'
    const params: any[] = []
    
    if (startDate && endDate) {
      query += ' WHERE timestamp BETWEEN ? AND ?'
      params.push(startDate, endDate)
    } else if (startDate) {
      query += ' WHERE timestamp >= ?'
      params.push(startDate)
    } else if (endDate) {
      query += ' WHERE timestamp <= ?'
      params.push(endDate)
    }
    
    query += ' GROUP BY access_granted'
    
    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all<{ count: number; access_granted: number }>()
    
    const stats = {
      total: 0,
      granted: 0,
      denied: 0,
      byType: {} as Record<string, number>,
      byMode: {} as Record<string, number>
    }
    
    result.results?.forEach(row => {
      stats.total += row.count
      if (row.access_granted) {
        stats.granted += row.count
      } else {
        stats.denied += row.count
      }
    })
    
    return stats
  }

  // ============================================================
  // Combined Queries
  // ============================================================

  /**
   * Get access rule with email allowlist
   */
  async getAccessRuleWithEmails(type: string, slug: string): Promise<{
    rule: AccessRule | null
    emails: string[]
  }> {
    const rule = await this.getAccessRule(type, slug)
    
    if (!rule) {
      return { rule: null, emails: [] }
    }
    
    const emails = await this.getEmailsForRule(rule.id)
    
    return { rule, emails }
  }

  /**
   * Get all access rules with their email allowlists (for content catalog)
   */
  async getAllAccessRulesWithEmails(): Promise<Array<{
    rule: AccessRule
    emails: string[]
  }>> {
    const rules = await this.getAllAccessRules()
    
    const rulesWithEmails = await Promise.all(
      rules.map(async rule => ({
        rule,
        emails: await this.getEmailsForRule(rule.id)
      }))
    )
    
    return rulesWithEmails
  }
}

// ============================================================
// Factory Function
// ============================================================

/**
 * Create a new database service instance
 */
export function createDatabaseService(db: D1Database): DatabaseService {
  return new DatabaseService(db)
}
