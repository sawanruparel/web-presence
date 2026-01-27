#!/usr/bin/env node

/**
 * Build-Time Migration Check Script
 * 
 * Checks if database migrations are up to date before build.
 * This should be run as part of the build process to ensure
 * the database schema matches what the code expects.
 * 
 * Usage:
 *   node scripts/check-migrations-at-build.js [--local|--remote] [--warn-only]
 * 
 * Examples:
 *   node scripts/check-migrations-at-build.js --remote        # Check production (fail on mismatch)
 *   node scripts/check-migrations-at-build.js --remote --warn-only  # Check production (warn only)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Parse command line arguments
const args = process.argv.slice(2)
const isLocal = args.includes('--local')
const isRemote = args.includes('--remote')
const warnOnly = args.includes('--warn-only')

if (!isLocal && !isRemote) {
  // Default to remote for production builds
  const isRemoteDefault = process.env.CI || process.env.NODE_ENV === 'production'
  if (isRemoteDefault) {
    console.log('⚠️  No environment specified, defaulting to --remote for production build')
  } else {
    console.log('⚠️  No environment specified, defaulting to --local for development')
  }
}

const databaseName = isRemote ? 'web-presence-db' : 'web-presence-db-local'
const environment = isRemote ? 'production' : 'local'
const isRemoteFlag = isRemote ? '--remote' : '--local'

console.log(`\n🔍 Checking migrations for ${environment} database: ${databaseName}`)
if (warnOnly) {
  console.log('⚠️  WARN-ONLY MODE - Build will continue even if migrations are missing\n')
}

// Get migrations directory
const migrationsDir = path.join(__dirname, '..', 'migrations')

// Get all migration files
function getMigrationFiles() {
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
  
  return files.map(file => ({
    name: file.replace('.sql', ''),
    file: file,
    path: path.join(migrationsDir, file)
  }))
}

// Check if migrations table exists
async function checkMigrationsTable() {
  try {
    const result = execSync(
      `npx wrangler d1 execute ${databaseName} ${isRemoteFlag} --command="SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    )
    
    const jsonMatch = result.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0])
        if (Array.isArray(data) && data.length > 0) {
          const firstResult = data[0]
          if (firstResult.results && Array.isArray(firstResult.results)) {
            return firstResult.results.length > 0
          }
        }
      } catch (e) {
        // JSON parse failed - log for debugging in warn-only mode
        if (warnOnly) {
          console.warn(`⚠️  Failed to parse wrangler output: ${e.message}`)
        }
      }
    }
    return false
  } catch (error) {
    // If wrangler command fails (e.g., not authenticated in CI), provide helpful error
    if (warnOnly) {
      console.warn(`⚠️  Could not check migrations table (wrangler command failed): ${error.message}`)
      console.warn(`   This is expected in CI/build environments where wrangler may not be authenticated.`)
      console.warn(`   To verify migrations manually, run: npm run diagnose:db:remote`)
    }
    return false
  }
}

// Get applied migrations
async function getAppliedMigrations() {
  try {
    const result = execSync(
      `npx wrangler d1 execute ${databaseName} ${isRemoteFlag} --command="SELECT migration_name FROM schema_migrations ORDER BY migration_name"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    )
    
    const jsonMatch = result.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0])
        if (Array.isArray(data) && data.length > 0) {
          const firstResult = data[0]
          if (firstResult.results && Array.isArray(firstResult.results)) {
            return firstResult.results.map((r) => r.migration_name)
          }
        }
      } catch (e) {
        // JSON parse failed
      }
    }
    return []
  } catch (error) {
    return []
  }
}

// Check if specific table exists
async function checkTableExists(tableName) {
  try {
    const result = execSync(
      `npx wrangler d1 execute ${databaseName} ${isRemoteFlag} --command="SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    )
    
    const jsonMatch = result.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0])
        if (Array.isArray(data) && data.length > 0) {
          const firstResult = data[0]
          if (firstResult.results && Array.isArray(firstResult.results)) {
            return firstResult.results.length > 0
          }
        }
      } catch (e) {
        // JSON parse failed
      }
    }
    return false
  } catch (error) {
    return false
  }
}

// Main execution
async function main() {
  try {
    const allMigrations = getMigrationFiles()
    const tableExists = await checkMigrationsTable()
    
    if (!tableExists) {
      const message = `❌ Migrations tracking table does not exist in ${environment} database.\n   Run: npm run migrate:${isRemote ? 'remote' : 'local'}\n   Or verify manually: npm run diagnose:db:${isRemote ? 'remote' : 'local'}`
      if (warnOnly) {
        console.warn(`\n⚠️  ${message}\n`)
        console.warn(`   Note: If this is a CI/build environment, wrangler may not be authenticated.`)
        console.warn(`   The build will continue, but verify migrations manually if needed.\n`)
        return
      } else {
        console.error(`\n${message}\n`)
        process.exit(1)
      }
    }
    
    const appliedMigrations = await getAppliedMigrations()
    const appliedSet = new Set(appliedMigrations)
    
    // Check for missing migrations
    const missingMigrations = allMigrations.filter(m => {
      // Skip migrations table migration itself
      if (m.name === '0000_migrations_table') {
        return false
      }
      return !appliedSet.has(m.name)
    })
    
    if (missingMigrations.length > 0) {
      const message = `❌ ${missingMigrations.length} migration(s) not applied in ${environment} database:\n${missingMigrations.map(m => `   - ${m.name}`).join('\n')}\n\n   Run: npm run migrate:${isRemote ? 'remote' : 'local'}`
      
      if (warnOnly) {
        console.warn(`\n⚠️  ${message}\n`)
        return
      } else {
        console.error(`\n${message}\n`)
        process.exit(1)
      }
    }
    
    // Check for critical tables that should exist
    const criticalTables = ['build_logs', 'content_access_rules']
    const missingTables = []
    
    for (const table of criticalTables) {
      const exists = await checkTableExists(table)
      if (!exists) {
        missingTables.push(table)
      }
    }
    
    if (missingTables.length > 0) {
      const message = `❌ Critical table(s) missing in ${environment} database:\n${missingTables.map(t => `   - ${t}`).join('\n')}\n\n   This indicates migrations may not be fully applied.\n   Run: npm run migrate:${isRemote ? 'remote' : 'local'}`
      
      if (warnOnly) {
        console.warn(`\n⚠️  ${message}\n`)
        return
      } else {
        console.error(`\n${message}\n`)
        process.exit(1)
      }
    }
    
    console.log(`✅ All migrations are up to date in ${environment} database`)
    console.log(`   Applied: ${appliedMigrations.length} migration(s)`)
    
  } catch (error) {
    const message = `❌ Error checking migrations: ${error instanceof Error ? error.message : 'Unknown error'}`
    
    if (warnOnly) {
      console.warn(`\n⚠️  ${message}\n`)
      return
    } else {
      console.error(`\n${message}\n`)
      process.exit(1)
    }
  }
}

main()
