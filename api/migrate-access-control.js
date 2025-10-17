#!/usr/bin/env node
/**
 * Migration Script: access-control.json → Database
 * 
 * Migrates access control rules from the old JSON config file
 * to the new database-backed system.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_KEY = process.env.INTERNAL_API_KEY || 'd458ab3fede5cfefb6f33b8aa21cc93988052c020e59075b8bdc6d95b9847246'
const API_URL = process.env.API_URL || 'http://localhost:8787'
const CONFIG_FILE = path.join(__dirname, 'config', 'access-control.json')

async function migrateAccessControl() {
  console.log('🔄 Migrating access-control.json to database...')
  console.log('=' .repeat(60))
  
  // Check if config file exists
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log(`\n⚠️  Config file not found: ${CONFIG_FILE}`)
    console.log('   Nothing to migrate.')
    return
  }
  
  // Read config file
  console.log(`\n📖 Reading config file: ${CONFIG_FILE}`)
  const configContent = fs.readFileSync(CONFIG_FILE, 'utf8')
  const config = JSON.parse(configContent)
  
  if (!config.contentAccessRules) {
    console.log('\n❌ Invalid config file: missing contentAccessRules')
    process.exit(1)
  }
  
  // Count rules to migrate
  let totalRules = 0
  let successCount = 0
  let failCount = 0
  const errors = []
  
  for (const [type, rules] of Object.entries(config.contentAccessRules)) {
    totalRules += Object.keys(rules).length
  }
  
  console.log(`\n📊 Found ${totalRules} rules to migrate`)
  console.log('')
  
  // Migrate each rule
  for (const [type, rules] of Object.entries(config.contentAccessRules)) {
    console.log(`\n📝 Migrating ${type}...`)
    
    for (const [slug, rule] of Object.entries(rules)) {
      try {
        const ruleData = {
          type,
          slug,
          accessMode: rule.mode,
          description: rule.description
        }
        
        // Add password if mode is password
        if (rule.mode === 'password') {
          // Generate content-specific password (same logic as old system)
          ruleData.password = generateLegacyPassword(type, slug)
        }
        
        // Add emails if mode is email-list
        if (rule.mode === 'email-list' && rule.allowedEmails) {
          ruleData.allowedEmails = rule.allowedEmails
        }
        
        // Create rule via API
        const response = await fetch(`${API_URL}/api/internal/access-rules`, {
          method: 'POST',
          headers: {
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(ruleData)
        })
        
        if (response.ok) {
          console.log(`   ✅ ${slug} (${rule.mode})`)
          successCount++
        } else if (response.status === 409) {
          console.log(`   ⚠️  ${slug} (already exists, skipping)`)
          successCount++
        } else {
          const error = await response.json()
          console.log(`   ❌ ${slug} - ${error.message}`)
          failCount++
          errors.push({ type, slug, error: error.message })
        }
      } catch (error) {
        console.log(`   ❌ ${slug} - ${error.message}`)
        failCount++
        errors.push({ type, slug, error: error.message })
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Migration Summary:')
  console.log(`   Total rules: ${totalRules}`)
  console.log(`   Successfully migrated: ${successCount}`)
  console.log(`   Failed: ${failCount}`)
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:')
    errors.forEach(({ type, slug, error }) => {
      console.log(`   - ${type}/${slug}: ${error}`)
    })
  }
  
  // Create backup
  if (successCount > 0) {
    const backupFile = CONFIG_FILE + '.backup'
    fs.copyFileSync(CONFIG_FILE, backupFile)
    console.log(`\n💾 Original config backed up to: ${backupFile}`)
  }
  
  console.log('\n✅ Migration complete!')
  console.log('=' .repeat(60))
}

/**
 * Generate legacy password (same as old access-control-service)
 */
function generateLegacyPassword(type, slug) {
  const baseString = `${type}-${slug}`
  const hash = simpleHash(baseString)
  return `${type}-${slug}-${hash}`
}

/**
 * Simple hash function (same as old access-control-service)
 */
function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 6)
}

// Run migration
migrateAccessControl().catch(error => {
  console.error('\n❌ Migration failed:', error)
  process.exit(1)
})
