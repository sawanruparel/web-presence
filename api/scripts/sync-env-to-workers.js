#!/usr/bin/env node
/**
 * Sync Local Environment Variables to Cloudflare Workers
 * 
 * Reads environment variables from .dev.vars and uploads them to Cloudflare Workers
 * as secrets using the Wrangler CLI.
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

// Variables to sync from .dev.vars to Workers
const VARIABLES_TO_SYNC = [
  'INTERNAL_API_KEY',
  'FRONTEND_URL',
  'CORS_ORIGINS',
  'GITHUB_TOKEN',
  'GITHUB_WEBHOOK_SECRET',
  'GITHUB_REPO',
  'GITHUB_BRANCH',
  'PROTECTED_CONTENT_BUCKET_NAME',
  'PUBLIC_CONTENT_BUCKET_NAME'
]

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
  
  console.log(`\n📡 Syncing ${Object.keys(variablesToSync).length} variables to Cloudflare Workers...`)
  
  try {
    // Check if wrangler is logged in
    console.log('   🔍 Checking Wrangler authentication...')
    try {
      execSync('npx wrangler whoami', { stdio: 'pipe' })
      console.log('   ✅ Wrangler is authenticated')
    } catch (error) {
      throw new Error('Not logged in to Wrangler. Please run: npx wrangler login')
    }
    
    // Sync each variable as a secret
    for (const [varName, varValue] of Object.entries(variablesToSync)) {
      console.log(`   📤 Setting ${varName}...`)
      
      try {
        // Use wrangler secret put command with production environment
        const command = `echo "${varValue}" | npx wrangler secret put ${varName} --env production`
        execSync(command, { 
          stdio: 'pipe',
          shell: true
        })
        console.log(`   ✅ ${varName} set successfully`)
      } catch (error) {
        console.error(`   ❌ Failed to set ${varName}:`, error.message)
        throw new Error(`Failed to set ${varName}`)
      }
    }
    
    console.log('\n✅ Successfully synced environment variables!')
    console.log('=' .repeat(60))
    console.log('📊 Summary:')
    console.log(`   Project: ${PROJECT_NAME}`)
    console.log(`   Variables synced: ${Object.keys(variablesToSync).length}`)
    
    console.log('\n🔗 Next steps:')
    console.log('   1. Deploy the worker: npm run deploy')
    console.log('   2. Verify secrets are set: npx wrangler secret list')
    console.log('   3. Test the API endpoints')
    
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
