#!/usr/bin/env node
/**
 * Sync Local Environment Variables to Cloudflare Pages
 * 
 * Reads environment variables from .env.local and uploads them to Cloudflare Pages
 * as build-time environment variables using the Cloudflare API.
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env.production (preferred) or .env.local
const envProductionPath = path.join(__dirname, '..', '.env.production')
const envLocalPath = path.join(__dirname, '..', '.env.local')

// Try to load .env.production first, fallback to .env.local
if (fs.existsSync(envProductionPath)) {
  console.log('📖 Loading production environment variables from .env.production')
  config({ path: envProductionPath })
} else {
  console.log('📖 Loading environment variables from .env.local')
  config({ path: envLocalPath })
}

// Configuration
const PROJECT_NAME = 'web-presence'
const CLOUDFLARE_ACCOUNT_ID = '61d3245b7e3224d49a9553bdb4d1a70e' // Quoppo account

// Variables to sync from .env.local to Pages
const VARIABLES_TO_SYNC = [
  'BUILD_API_KEY',
  'BUILD_API_URL', 
  'VITE_API_BASE_URL',
  'VITE_DEV_MODE'
]

// Cloudflare API configuration
const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4'
const PAGES_API_URL = `${CLOUDFLARE_API_BASE}/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PROJECT_NAME}`

async function syncEnvironmentVariables() {
  console.log('🔄 Syncing environment variables to Cloudflare Pages...')
  console.log('=' .repeat(60))
  
  // Check if environment file exists
  const envFile = fs.existsSync(envProductionPath) ? envProductionPath : envLocalPath
  if (!fs.existsSync(envFile)) {
    console.error(`❌ Environment file not found at: ${envFile}`)
    console.error('   Create .env.local by copying from .env.example')
    process.exit(1)
  }
  
  console.log(`📖 Reading variables from: ${envFile}`)
  
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
    console.log('   These will not be synced to Cloudflare Pages')
  }
  
  if (Object.keys(variablesToSync).length === 0) {
    console.log('\n❌ No variables to sync. Check your environment file.')
    process.exit(1)
  }
  
  console.log(`\n📡 Syncing ${Object.keys(variablesToSync).length} variables to Cloudflare Pages...`)
  
  try {
    // Get API token from Wrangler
    console.log('   🔍 Getting API token from Wrangler...')
    let apiToken
    try {
      // Try to get token from Wrangler's config
      const wranglerConfigPath = path.join(os.homedir(), 'Library', 'Preferences', '.wrangler', 'config', 'default.toml')
      if (fs.existsSync(wranglerConfigPath)) {
        const configContent = fs.readFileSync(wranglerConfigPath, 'utf8')
        const tokenMatch = configContent.match(/oauth_token = "([^"]+)"/)
        if (tokenMatch) {
          apiToken = tokenMatch[1]
        }
      }
      
      if (!apiToken) {
        throw new Error('Could not get API token from Wrangler config')
      }
    } catch (error) {
      throw new Error('Not logged in to Wrangler. Please run: npx wrangler login')
    }
    
    // Get current project configuration
    console.log('   📥 Fetching current project configuration...')
    const getResponse = await fetch(PAGES_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!getResponse.ok) {
      const error = await getResponse.json()
      throw new Error(`Failed to fetch project: ${error.errors?.[0]?.message || getResponse.statusText}`)
    }
    
    const project = await getResponse.json()
    const currentEnvVars = project.result?.deployment_configs?.production?.env_vars || {}
    
    // Merge with new variables
    const updatedEnvVars = {
      ...currentEnvVars,
      ...variablesToSync
    }
    
    // Update project with new environment variables
    console.log('   📤 Updating project with new environment variables...')
    const updateResponse = await fetch(PAGES_API_URL, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deployment_configs: {
          production: {
            env_vars: Object.fromEntries(
              Object.entries(updatedEnvVars).map(([key, value]) => [
                key, 
                { type: "plain_text", value: value }
              ])
            )
          },
          preview: {
            env_vars: Object.fromEntries(
              Object.entries(updatedEnvVars).map(([key, value]) => [
                key, 
                { type: "plain_text", value: value }
              ])
            )
          }
        }
      })
    })
    
    if (!updateResponse.ok) {
      const error = await updateResponse.json()
      throw new Error(`Failed to update project: ${error.errors?.[0]?.message || updateResponse.statusText}`)
    }
    
    const result = await updateResponse.json()
    
    console.log('\n✅ Successfully synced environment variables!')
    console.log('=' .repeat(60))
    console.log('📊 Summary:')
    console.log(`   Project: ${result.result?.name}`)
    console.log(`   Variables synced: ${Object.keys(variablesToSync).length}`)
    console.log(`   Total variables in project: ${Object.keys(updatedEnvVars).length}`)
    
    console.log('\n🔗 Next steps:')
    console.log('   1. Trigger a new deployment in Cloudflare Pages')
    console.log('   2. Or push a new commit to trigger automatic deployment')
    console.log('   3. Check the build logs to verify variables are available')
    
  } catch (error) {
    console.error('\n❌ Failed to sync environment variables:')
    console.error(`   ${error.message}`)
    
    if (error.message.includes('401')) {
      console.error('\n💡 Troubleshooting:')
      console.error('   - Check your CLOUDFLARE_API_TOKEN is valid')
      console.error('   - Ensure token has Pages:Edit permissions')
    } else if (error.message.includes('404')) {
      console.error('\n💡 Troubleshooting:')
      console.error('   - Check your CLOUDFLARE_ACCOUNT_ID is correct')
      console.error('   - Verify the project name "web-presence" exists')
    }
    
    process.exit(1)
  }
}

// Run the sync
syncEnvironmentVariables().catch(error => {
  console.error('\n❌ Unexpected error:', error)
  process.exit(1)
})
