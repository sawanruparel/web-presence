#!/usr/bin/env node
/**
 * Populate Access Control Rules
 * 
 * Sets up the correct access control rules in the database based on the original
 * access-control.json configuration.
 */

const API_KEY = process.env.INTERNAL_API_KEY || 'API_KEY_tu1ylu2nm7wnebxz05vfe'
const API_URL = process.env.API_URL || 'http://localhost:8787'

// Access rules based on the original access-control.json
const accessRules = [
  {
    type: 'notes',
    slug: 'physical-interfaces',
    accessMode: 'open',
    description: 'Physical interfaces concepts'
  },
  {
    type: 'publications',
    slug: 'decisionrecord-io',
    accessMode: 'email-list',
    description: 'Decision Record IO publication',
    allowedEmails: ['admin@example.com', 'reviewer@example.com']
  },
  {
    type: 'ideas',
    slug: 'extending-carplay',
    accessMode: 'open',
    description: 'CarPlay extension concepts'
  },
  {
    type: 'ideas',
    slug: 'local-first-ai',
    accessMode: 'password',
    description: 'Local-first AI implementation',
    password: 'test123' // Default password for testing
  },
  {
    type: 'ideas',
    slug: 'sample-protected-idea',
    accessMode: 'password',
    description: 'Sample protected idea',
    password: 'test123' // Default password for testing
  },
  {
    type: 'pages',
    slug: 'about',
    accessMode: 'open',
    description: 'About page'
  },
  {
    type: 'pages',
    slug: 'contact',
    accessMode: 'open',
    description: 'Contact page'
  }
]

async function populateAccessRules() {
  console.log('🔄 Populating access control rules...')
  console.log('=' .repeat(60))
  
  let successCount = 0
  let failCount = 0
  const errors = []
  
  for (const rule of accessRules) {
    try {
      console.log(`\n📝 Setting rule: ${rule.type}/${rule.slug} (${rule.accessMode})`)
      
      const response = await fetch(`${API_URL}/api/internal/access-rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify(rule)
      })
      
      if (response.ok) {
        console.log(`✅ Success: ${rule.type}/${rule.slug}`)
        successCount++
      } else {
        const error = await response.text()
        console.log(`❌ Failed: ${rule.type}/${rule.slug} - ${error}`)
        errors.push(`${rule.type}/${rule.slug}: ${error}`)
        failCount++
      }
      
    } catch (error) {
      console.log(`❌ Error: ${rule.type}/${rule.slug} - ${error.message}`)
      errors.push(`${rule.type}/${rule.slug}: ${error.message}`)
      failCount++
    }
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log(`📊 Results: ${successCount} success, ${failCount} failed`)
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:')
    errors.forEach(error => console.log(`  - ${error}`))
  }
  
  if (failCount === 0) {
    console.log('\n🎉 All access control rules set successfully!')
    console.log('\nNext steps:')
    console.log('1. Run content sync: POST /api/content-sync/manual with {"full_sync": true}')
    console.log('2. Check R2 buckets to verify correct content placement')
  } else {
    console.log('\n⚠️  Some rules failed to set. Check errors above.')
    process.exit(1)
  }
}

// Run the script
populateAccessRules().catch(error => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})
