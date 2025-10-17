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
const CONFIG_FILE = path.join(__dirname, 'scripts', 'content-config.json')

async function migrateAccessControl() {
  console.log('🔄 Migrating content-config.json to database...')
  console.log('=' .repeat(60))
  
  // Check if config file exists
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log(`\n⚠️  Config file not found: ${CONFIG_FILE}`)
    console.log('   Run "node scripts/generate-seed-config.js" first to generate the configuration.')
    return
  }
  
  // Read config file
  console.log(`\n📖 Reading config file: ${CONFIG_FILE}`)
  const configContent = fs.readFileSync(CONFIG_FILE, 'utf8')
  const config = JSON.parse(configContent)
  
  if (!config.rules) {
    console.log('\n❌ Invalid config file: missing rules array')
    process.exit(1)
  }
  
  // Count rules to migrate
  const totalRules = config.rules.length
  let successCount = 0
  let failCount = 0
  const errors = []
  
  console.log(`\n📊 Found ${totalRules} rules to migrate`)
  console.log('')
  
  // Migrate each rule
  for (const rule of config.rules) {
    console.log(`\n📝 Migrating ${rule.type}/${rule.slug}...`)
    
    try {
      const ruleData = {
        type: rule.type,
        slug: rule.slug,
        accessMode: rule.accessMode,
        description: rule.description
      }
      
      // Add password if mode is password
      if (rule.accessMode === 'password') {
        if (!rule.password) {
          console.log(`   ❌ No password found for ${rule.type}/${rule.slug}`)
          failCount++
          errors.push({ type: rule.type, slug: rule.slug, error: 'No password in config' })
          continue
        }
        ruleData.password = rule.password
      }
      
      // Add emails if mode is email-list
      if (rule.accessMode === 'email-list' && rule.allowedEmails) {
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
        console.log(`   ✅ ${rule.slug} (${rule.accessMode})`)
        successCount++
      } else if (response.status === 409) {
        console.log(`   ⚠️  ${rule.slug} (already exists, skipping)`)
        successCount++
      } else {
        const error = await response.json()
        console.log(`   ❌ ${rule.slug} - ${error.message}`)
        failCount++
        errors.push({ type: rule.type, slug: rule.slug, error: error.message })
      }
    } catch (error) {
      console.log(`   ❌ ${rule.slug} - ${error.message}`)
      failCount++
      errors.push({ type: rule.type, slug: rule.slug, error: error.message })
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


// Run migration
migrateAccessControl().catch(error => {
  console.error('\n❌ Migration failed:', error)
  process.exit(1)
})
