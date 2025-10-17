#!/usr/bin/env node
/**
 * API Key Synchronization Script
 * 
 * Ensures INTERNAL_API_KEY and BUILD_API_KEY are synchronized across environments.
 * This script validates that both keys match and can sync them to their respective services.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Environment file paths
const API_DEV_VARS = path.join(__dirname, '..', 'api', '.dev.vars')
const WEB_ENV_LOCAL = path.join(__dirname, '..', 'web', '.env.local')
const WEB_ENV_PRODUCTION = path.join(__dirname, '..', 'web', '.env.production')

// Load environment variables
function loadEnvironmentFiles() {
  const envVars = {}
  
  // Load API environment
  if (fs.existsSync(API_DEV_VARS)) {
    config({ path: API_DEV_VARS })
    envVars.api = {
      file: API_DEV_VARS,
      INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
      FRONTEND_URL: process.env.FRONTEND_URL,
      CORS_ORIGINS: process.env.CORS_ORIGINS
    }
  }
  
  // Load Web environment (prefer production, fallback to local)
  const webEnvFile = fs.existsSync(WEB_ENV_PRODUCTION) ? WEB_ENV_PRODUCTION : WEB_ENV_LOCAL
  if (fs.existsSync(webEnvFile)) {
    // Clear previous env vars and load web env
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('BUILD_') || key.startsWith('VITE_')) {
        delete process.env[key]
      }
    })
    config({ path: webEnvFile })
    envVars.web = {
      file: webEnvFile,
      BUILD_API_KEY: process.env.BUILD_API_KEY,
      BUILD_API_URL: process.env.BUILD_API_URL,
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
      VITE_DEV_MODE: process.env.VITE_DEV_MODE
    }
  }
  
  return envVars
}

function validateApiKeys(envVars) {
  console.log('🔍 Validating API key synchronization...')
  console.log('=' .repeat(60))
  
  const issues = []
  
  // Check if both environments have API keys
  if (!envVars.api?.INTERNAL_API_KEY) {
    issues.push('❌ INTERNAL_API_KEY not found in api/.dev.vars')
  }
  
  if (!envVars.web?.BUILD_API_KEY) {
    issues.push('❌ BUILD_API_KEY not found in web environment file')
  }
  
  // Check if keys match
  if (envVars.api?.INTERNAL_API_KEY && envVars.web?.BUILD_API_KEY) {
    if (envVars.api.INTERNAL_API_KEY !== envVars.web.BUILD_API_KEY) {
      issues.push('❌ API keys do not match!')
      console.log('   API Key (INTERNAL_API_KEY):', envVars.api.INTERNAL_API_KEY.substring(0, 8) + '...')
      console.log('   Web Key (BUILD_API_KEY):   ', envVars.web.BUILD_API_KEY.substring(0, 8) + '...')
    } else {
      console.log('   ✅ API keys match')
    }
  }
  
  // Check API URLs match
  if (envVars.api?.FRONTEND_URL && envVars.web?.VITE_API_BASE_URL) {
    // Convert frontend URL to API URL for comparison
    const apiUrlFromFrontend = envVars.api.FRONTEND_URL.replace('localhost:5173', 'localhost:8787')
    if (apiUrlFromFrontend !== envVars.web.VITE_API_BASE_URL) {
      issues.push('⚠️  API URLs may not be aligned (this might be intentional)')
      console.log('   Expected API URL: ', apiUrlFromFrontend)
      console.log('   Actual API URL:   ', envVars.web.VITE_API_BASE_URL)
    } else {
      console.log('   ✅ API URLs are aligned')
    }
  }
  
  return issues
}

function displayEnvironmentStatus(envVars) {
  console.log('\n📊 Environment Status:')
  console.log('=' .repeat(60))
  
  // API Environment
  console.log('🔧 API Environment (api/.dev.vars):')
  if (envVars.api) {
    console.log(`   ✅ File exists: ${envVars.api.file}`)
    console.log(`   ${envVars.api.INTERNAL_API_KEY ? '✅' : '❌'} INTERNAL_API_KEY: ${envVars.api.INTERNAL_API_KEY ? 'Set' : 'Missing'}`)
    console.log(`   ${envVars.api.FRONTEND_URL ? '✅' : '❌'} FRONTEND_URL: ${envVars.api.FRONTEND_URL || 'Missing'}`)
    console.log(`   ${envVars.api.CORS_ORIGINS ? '✅' : '❌'} CORS_ORIGINS: ${envVars.api.CORS_ORIGINS || 'Missing'}`)
  } else {
    console.log('   ❌ File not found')
  }
  
  // Web Environment
  console.log('\n🌐 Web Environment:')
  if (envVars.web) {
    console.log(`   ✅ File exists: ${envVars.web.file}`)
    console.log(`   ${envVars.web.BUILD_API_KEY ? '✅' : '❌'} BUILD_API_KEY: ${envVars.web.BUILD_API_KEY ? 'Set' : 'Missing'}`)
    console.log(`   ${envVars.web.BUILD_API_URL ? '✅' : '❌'} BUILD_API_URL: ${envVars.web.BUILD_API_URL || 'Missing'}`)
    console.log(`   ${envVars.web.VITE_API_BASE_URL ? '✅' : '❌'} VITE_API_BASE_URL: ${envVars.web.VITE_API_BASE_URL || 'Missing'}`)
    console.log(`   ${envVars.web.VITE_DEV_MODE ? '✅' : '❌'} VITE_DEV_MODE: ${envVars.web.VITE_DEV_MODE || 'Missing'}`)
  } else {
    console.log('   ❌ No environment file found')
  }
}

async function syncToServices(envVars, options = {}) {
  if (!options.sync) {
    console.log('\n💡 To sync to services, use: --sync')
    return
  }
  
  console.log('\n🚀 Syncing to services...')
  console.log('=' .repeat(60))
  
  try {
    // Sync to Cloudflare Workers
    if (envVars.api) {
      console.log('📤 Syncing API environment to Cloudflare Workers...')
      try {
        process.chdir(path.join(__dirname, '..', 'api'))
        execSync('node scripts/sync-env-to-workers.js', { stdio: 'inherit' })
        console.log('✅ API environment synced to Workers')
      } catch (error) {
        console.error('❌ Failed to sync API environment:', error.message)
      }
    }
    
    // Sync to Cloudflare Pages
    if (envVars.web) {
      console.log('📤 Syncing Web environment to Cloudflare Pages...')
      try {
        process.chdir(path.join(__dirname, '..', 'web'))
        execSync('node scripts/sync-env-to-pages.js', { stdio: 'inherit' })
        console.log('✅ Web environment synced to Pages')
      } catch (error) {
        console.error('❌ Failed to sync Web environment:', error.message)
      }
    }
    
  } finally {
    // Return to original directory
    process.chdir(__dirname)
  }
}

function generateApiKey() {
  const crypto = require('crypto')
  return 'API_KEY_' + crypto.randomBytes(32).toString('hex')
}

function fixApiKeys(envVars) {
  console.log('\n🔧 Fixing API key synchronization...')
  console.log('=' .repeat(60))
  
  if (!envVars.api?.INTERNAL_API_KEY && !envVars.web?.BUILD_API_KEY) {
    // Generate new API key
    const newApiKey = generateApiKey()
    console.log(`🔑 Generated new API key: ${newApiKey}`)
    
    // Update API environment
    if (envVars.api) {
      const apiContent = fs.readFileSync(envVars.api.file, 'utf8')
      const updatedApiContent = apiContent.replace(
        /INTERNAL_API_KEY=.*/,
        `INTERNAL_API_KEY=${newApiKey}`
      )
      fs.writeFileSync(envVars.api.file, updatedApiContent)
      console.log('✅ Updated api/.dev.vars with new API key')
    }
    
    // Update Web environment
    if (envVars.web) {
      const webContent = fs.readFileSync(envVars.web.file, 'utf8')
      const updatedWebContent = webContent.replace(
        /BUILD_API_KEY=.*/,
        `BUILD_API_KEY=${newApiKey}`
      )
      fs.writeFileSync(envVars.web.file, updatedWebContent)
      console.log('✅ Updated web environment file with new API key')
    }
    
  } else if (envVars.api?.INTERNAL_API_KEY && !envVars.web?.BUILD_API_KEY) {
    // Copy API key to Web
    const webContent = fs.readFileSync(envVars.web.file, 'utf8')
    const updatedWebContent = webContent.replace(
      /BUILD_API_KEY=.*/,
      `BUILD_API_KEY=${envVars.api.INTERNAL_API_KEY}`
    )
    fs.writeFileSync(envVars.web.file, updatedWebContent)
    console.log('✅ Copied INTERNAL_API_KEY to BUILD_API_KEY')
    
  } else if (!envVars.api?.INTERNAL_API_KEY && envVars.web?.BUILD_API_KEY) {
    // Copy Web key to API
    const apiContent = fs.readFileSync(envVars.api.file, 'utf8')
    const updatedApiContent = apiContent.replace(
      /INTERNAL_API_KEY=.*/,
      `INTERNAL_API_KEY=${envVars.web.BUILD_API_KEY}`
    )
    fs.writeFileSync(envVars.api.file, updatedApiContent)
    console.log('✅ Copied BUILD_API_KEY to INTERNAL_API_KEY')
    
  } else if (envVars.api?.INTERNAL_API_KEY !== envVars.web?.BUILD_API_KEY) {
    // Use API key as source of truth
    const webContent = fs.readFileSync(envVars.web.file, 'utf8')
    const updatedWebContent = webContent.replace(
      /BUILD_API_KEY=.*/,
      `BUILD_API_KEY=${envVars.api.INTERNAL_API_KEY}`
    )
    fs.writeFileSync(envVars.web.file, updatedWebContent)
    console.log('✅ Synchronized BUILD_API_KEY to match INTERNAL_API_KEY')
  }
}

async function main() {
  const args = process.argv.slice(2)
  const options = {
    sync: args.includes('--sync'),
    fix: args.includes('--fix'),
    help: args.includes('--help') || args.includes('-h')
  }
  
  if (options.help) {
    console.log('API Key Synchronization Script')
    console.log('')
    console.log('Usage: node scripts/sync-api-keys.js [options]')
    console.log('')
    console.log('Options:')
    console.log('  --sync    Sync environment variables to Cloudflare services')
    console.log('  --fix     Fix API key mismatches automatically')
    console.log('  --help    Show this help message')
    console.log('')
    console.log('Examples:')
    console.log('  node scripts/sync-api-keys.js              # Check status only')
    console.log('  node scripts/sync-api-keys.js --fix        # Fix mismatches')
    console.log('  node scripts/sync-api-keys.js --sync       # Sync to services')
    console.log('  node scripts/sync-api-keys.js --fix --sync # Fix and sync')
    return
  }
  
  console.log('🔑 API Key Synchronization Script')
  console.log('=' .repeat(60))
  
  // Load environment files
  const envVars = loadEnvironmentFiles()
  
  // Display current status
  displayEnvironmentStatus(envVars)
  
  // Validate API keys
  const issues = validateApiKeys(envVars)
  
  if (issues.length > 0) {
    console.log('\n⚠️  Issues found:')
    issues.forEach(issue => console.log(`   ${issue}`))
    
    if (options.fix) {
      fixApiKeys(envVars)
      console.log('\n✅ API keys have been synchronized')
    } else {
      console.log('\n💡 To fix issues automatically, use: --fix')
    }
  } else {
    console.log('\n✅ All API keys are properly synchronized!')
  }
  
  // Sync to services if requested
  if (options.sync) {
    await syncToServices(envVars, options)
  }
  
  console.log('\n🎉 Done!')
}

// Run the script
main().catch(error => {
  console.error('\n❌ Unexpected error:', error)
  process.exit(1)
})
