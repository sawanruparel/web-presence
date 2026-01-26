#!/usr/bin/env node
/**
 * Sync Local Environment Variables to Cloudflare Workers
 * 
 * Reads environment variables from .dev.vars and syncs them to Cloudflare Workers:
 * - Sensitive variables (API keys, tokens, passwords) → stored as secrets (encrypted)
 * - Non-sensitive variables (URLs, config) → should be set in wrangler.toml [vars] section
 * 
 * Secrets are synced immediately via Wrangler CLI.
 * Plain text variables are shown for manual addition to wrangler.toml.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .dev.vars
const devVarsPath = path.join(__dirname, '..', '.dev.vars')

if (fs.existsSync(devVarsPath)) {
  console.log('📖 Loading environment variables from .dev.vars')
  config({ path: devVarsPath })
} else {
  console.error(`❌ Environment file not found at: ${devVarsPath}`)
  console.error('   Create .dev.vars by copying from .dev.vars.example')
  process.exit(1)
}

// Configuration
const PROJECT_NAME = 'web-presence-api'

// Sensitive variables that should be stored as secrets (encrypted)
const SECRET_VARIABLES = [
  'INTERNAL_API_KEY',
  'GITHUB_TOKEN',
  'GITHUB_WEBHOOK_SECRET',
  'ADMIN_PASSWORD'
]

// Non-sensitive variables that can be stored as plain text
// Note: CORS_ORIGINS is set in wrangler.toml [vars] section for production
const PLAIN_TEXT_VARIABLES = [
  'FRONTEND_URL',
  'CORS_ORIGINS',
  'GITHUB_REPO',
  'GITHUB_BRANCH',
  'PROTECTED_CONTENT_BUCKET_NAME',
  'PUBLIC_CONTENT_BUCKET_NAME'
]

// All variables to sync
const VARIABLES_TO_SYNC = [...SECRET_VARIABLES, ...PLAIN_TEXT_VARIABLES]

async function syncEnvironmentVariables() {
  console.log('🔄 Syncing environment variables to Cloudflare Workers...')
  console.log('=' .repeat(60))
  
  console.log(`📖 Reading variables from: ${devVarsPath}`)
  
  // Collect variables to sync
  const variablesToSync = {}
  const missingVariables = []
  
  for (const varName of VARIABLES_TO_SYNC) {
    const value = process.env[varName]
    if (value) {
      variablesToSync[varName] = value
      console.log(`   ✅ ${varName}: ${varName.includes('KEY') ? '***' : value}`)
    } else {
      missingVariables.push(varName)
      console.log(`   ⚠️  ${varName}: not found in environment file`)
    }
  }
  
  if (missingVariables.length > 0) {
    console.log(`\n⚠️  Warning: ${missingVariables.length} variables not found in environment file`)
    console.log('   These will not be synced to Cloudflare Workers')
  }
  
  if (Object.keys(variablesToSync).length === 0) {
    console.log('\n❌ No variables to sync. Check your .dev.vars file.')
    process.exit(1)
  }
  
  // Separate variables into secrets and plain text
  const secretsToSync = {}
  const plainTextToSync = {}
  
  for (const [varName, varValue] of Object.entries(variablesToSync)) {
    if (SECRET_VARIABLES.includes(varName)) {
      secretsToSync[varName] = varValue
    } else if (PLAIN_TEXT_VARIABLES.includes(varName)) {
      plainTextToSync[varName] = varValue
    }
  }
  
  console.log(`\n📡 Syncing ${Object.keys(variablesToSync).length} variables to Cloudflare Workers...`)
  console.log(`   🔐 Secrets: ${Object.keys(secretsToSync).length}`)
  console.log(`   📝 Plain text: ${Object.keys(plainTextToSync).length}`)
  
  try {
    // Check if wrangler is logged in
    console.log('\n   🔍 Checking Wrangler authentication...')
    try {
      execSync('npx wrangler whoami', { stdio: 'pipe' })
      console.log('   ✅ Wrangler is authenticated')
    } catch (error) {
      throw new Error('Not logged in to Wrangler. Please run: npx wrangler login')
    }
    
    // Sync secrets (encrypted)
    if (Object.keys(secretsToSync).length > 0) {
      console.log('\n   🔐 Syncing secrets (encrypted)...')
      for (const [varName, varValue] of Object.entries(secretsToSync)) {
        console.log(`   📤 Setting secret ${varName}...`)
        
        try {
          // Use wrangler secret put command with production environment
          const command = `echo "${varValue}" | npx wrangler secret put ${varName} --env production`
          execSync(command, { 
            stdio: 'pipe',
            shell: true
          })
          console.log(`   ✅ ${varName} set as secret`)
        } catch (error) {
          // Check if the error is because the binding already exists
          if (error.message.includes('already in use') || error.message.includes('10053')) {
            console.log(`   ⚠️  ${varName} is already set (as variable or secret). Skipping...`)
            console.log(`   💡 To update it, delete the existing binding first or update wrangler.toml`)
          } else {
            console.error(`   ❌ Failed to set ${varName}:`, error.message)
            throw new Error(`Failed to set secret ${varName}`)
          }
        }
      }
    }
    
    // Sync plain text variables
    if (Object.keys(plainTextToSync).length > 0) {
      console.log('\n   📝 Syncing plain text variables...')
      console.log('   ⚠️  Note: Plain text variables should be set in wrangler.toml [vars] section')
      console.log('   ⚠️  For now, these are only available in .dev.vars for local development')
      console.log('   ⚠️  To set them in production, add them to wrangler.toml:')
      console.log('')
      console.log('   [vars]')
      for (const [varName, varValue] of Object.entries(plainTextToSync)) {
        console.log(`   ${varName} = "${varValue}"`)
      }
      console.log('')
      console.log('   Then deploy: npm run deploy')
    }
    
    console.log('\n✅ Successfully synced environment variables!')
    console.log('=' .repeat(60))
    console.log('📊 Summary:')
    console.log(`   Project: ${PROJECT_NAME}`)
    console.log(`   Secrets synced: ${Object.keys(secretsToSync).length}`)
    console.log(`   Plain text variables: ${Object.keys(plainTextToSync).length}`)
    
    console.log('\n🔗 Next steps:')
    if (Object.keys(secretsToSync).length > 0) {
      console.log('   1. Verify secrets are set: npx wrangler secret list --env production')
    }
    if (Object.keys(plainTextToSync).length > 0) {
      console.log('   2. Add plain text variables to wrangler.toml [vars] section (see above)')
      console.log('   3. Deploy the worker: npm run deploy')
    } else {
      console.log('   1. Deploy the worker: npm run deploy')
      console.log('   2. Test the API endpoints')
    }
    
  } catch (error) {
    console.error('\n❌ Failed to sync environment variables:')
    console.error(`   ${error.message}`)
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.error('\n💡 Troubleshooting:')
      console.error('   - Run: npx wrangler login')
      console.error('   - Check your Cloudflare account permissions')
    } else if (error.message.includes('404') || error.message.includes('Not Found')) {
      console.error('\n💡 Troubleshooting:')
      console.error('   - Check your wrangler.toml configuration')
      console.error('   - Verify the project exists in your account')
    }
    
    process.exit(1)
  }
}

// Run the sync
syncEnvironmentVariables().catch(error => {
  console.error('\n❌ Unexpected error:', error)
  process.exit(1)
})
