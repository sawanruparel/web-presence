#!/usr/bin/env node

/**
 * Migration script to sync access-control.json to D1 database
 * This script reads the existing JSON config and populates the database
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Simple password hashing (same as in the API)
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function migrateAccessControl() {
  try {
    console.log('🔄 Starting access control migration to database...')

    // Read existing access-control.json
    const configPath = path.join(__dirname, '..', 'config', 'access-control.json')
    
    if (!fs.existsSync(configPath)) {
      console.error('❌ access-control.json not found at:', configPath)
      process.exit(1)
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    console.log('📄 Loaded access control config')

    // Connect to D1 database
    const { execSync } = await import('child_process')
    
    // Get database info from wrangler.toml
    const wranglerPath = path.join(__dirname, '..', 'wrangler.toml')
    const wranglerConfig = fs.readFileSync(wranglerPath, 'utf8')
    
    // Extract database ID (simple regex, could be more robust)
    const dbIdMatch = wranglerConfig.match(/database_id = "([^"]+)"/)
    if (!dbIdMatch) {
      console.error('❌ Could not find database_id in wrangler.toml')
      process.exit(1)
    }
    
    const databaseId = dbIdMatch[1]
    console.log(`🗄️  Using database: ${databaseId}`)

    // Clear existing data
    console.log('🧹 Clearing existing access control data...')
    execSync(`npx wrangler d1 execute ${databaseId} --command="DELETE FROM email_allowlist"`, { stdio: 'inherit' })
    execSync(`npx wrangler d1 execute ${databaseId} --command="DELETE FROM content_access_rules"`, { stdio: 'inherit' })

    // Migrate content access rules
    const contentAccessRules = config.contentAccessRules || {}
    let ruleCount = 0
    let emailCount = 0

    for (const [type, rules] of Object.entries(contentAccessRules)) {
      for (const [slug, rule] of Object.entries(rules)) {
        console.log(`📝 Migrating ${type}/${slug}: ${rule.mode}`)

        // Insert access rule
        const insertRuleQuery = `
          INSERT INTO content_access_rules 
          (type, slug, access_mode, description, password_hash, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `

        let passwordHash = null
        if (rule.mode === 'password' && rule.password) {
          passwordHash = await hashPassword(rule.password)
        }

        const ruleResult = execSync(
          `npx wrangler d1 execute ${databaseId} --command="${insertRuleQuery.replace(/\?/g, (match, offset) => {
            const params = [type, slug, rule.mode, rule.description || null, passwordHash]
            return `'${params[offset].replace(/'/g, "''")}'`
          })}"`,
          { stdio: 'pipe', encoding: 'utf8' }
        )

        // Get the rule ID (this is tricky with wrangler CLI, so we'll use a workaround)
        const getRuleIdQuery = `SELECT id FROM content_access_rules WHERE type = '${type}' AND slug = '${slug}'`
        const ruleIdResult = execSync(
          `npx wrangler d1 execute ${databaseId} --command="${getRuleIdQuery}"`,
          { stdio: 'pipe', encoding: 'utf8' }
        )

        // Parse rule ID from result (this is a simplified approach)
        const ruleIdMatch = ruleIdResult.match(/id.*?(\d+)/)
        if (!ruleIdMatch) {
          console.warn(`⚠️  Could not get rule ID for ${type}/${slug}`)
          continue
        }

        const ruleId = parseInt(ruleIdMatch[1])
        ruleCount++

        // Insert email allowlist if provided
        if (rule.allowedEmails && Array.isArray(rule.allowedEmails)) {
          for (const email of rule.allowedEmails) {
            const insertEmailQuery = `
              INSERT INTO email_allowlist (access_rule_id, email, added_at)
              VALUES (${ruleId}, '${email.toLowerCase().trim()}', CURRENT_TIMESTAMP)
            `

            execSync(
              `npx wrangler d1 execute ${databaseId} --command="${insertEmailQuery}"`,
              { stdio: 'pipe' }
            )
            emailCount++
          }
        }
      }
    }

    console.log('✅ Migration completed!')
    console.log(`📊 Migrated ${ruleCount} access rules and ${emailCount} email allowlist entries`)

    // Verify migration
    console.log('🔍 Verifying migration...')
    const verifyQuery = `
      SELECT 
        car.type, 
        car.slug, 
        car.access_mode,
        COUNT(ea.email) as email_count
      FROM content_access_rules car
      LEFT JOIN email_allowlist ea ON car.id = ea.access_rule_id
      GROUP BY car.id, car.type, car.slug, car.access_mode
      ORDER BY car.type, car.slug
    `

    const verifyResult = execSync(
      `npx wrangler d1 execute ${databaseId} --command="${verifyQuery}"`,
      { stdio: 'pipe', encoding: 'utf8' }
    )

    console.log('📋 Migration verification:')
    console.log(verifyResult)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAccessControl()
    .then(() => {
      console.log('🎉 Migration script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error)
      process.exit(1)
    })
}

export { migrateAccessControl }
