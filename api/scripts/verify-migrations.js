#!/usr/bin/env node

/**
 * Migration Verification Script
 * 
 * Checks the status of database migrations and shows which have been applied.
 * 
 * Usage:
 *   node scripts/verify-migrations.js [--local|--remote]
 * 
 * Examples:
 *   node scripts/verify-migrations.js --local   # Check local database
 *   node scripts/verify-migrations.js --remote  # Check production database
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

if (!isLocal && !isRemote) {
  console.error('Error: Must specify --local or --remote')
  console.error('Usage: node scripts/verify-migrations.js [--local|--remote]')
  process.exit(1)
}

const databaseName = isLocal ? 'web-presence-db-local' : 'web-presence-db'
const environment = isLocal ? 'local' : 'production'

console.log(`\n🔍 Verifying migrations for ${environment} database: ${databaseName}\n`)

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

// Get applied migrations from database
async function getAppliedMigrations() {
  try {
    const result = execSync(
      `npx wrangler d1 execute ${databaseName} ${isLocal ? '--local' : '--remote'} --command="SELECT migration_name, applied_at, execution_time_ms, description FROM schema_migrations ORDER BY migration_name"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    )
    
    // Parse JSON output from wrangler - find the JSON array in the output
    const jsonMatch = result.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0])
        // Wrangler returns array of result objects, each with a "results" array
        if (Array.isArray(data) && data.length > 0) {
          const firstResult = data[0]
          if (firstResult.results && Array.isArray(firstResult.results)) {
            return firstResult.results
          }
        }
      } catch (e) {
        // JSON parse failed
      }
    }
    return []
  } catch (error) {
    if (error.message.includes('no such table') || error.message.includes('Unexpected')) {
      console.log('⚠️  Migrations table does not exist. Run migrations first.')
      return []
    }
    throw error
  }
}

// Check if migrations table exists
async function checkMigrationsTable() {
  try {
    const result = execSync(
      `npx wrangler d1 execute ${databaseName} ${isLocal ? '--local' : '--remote'} --command="SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    )
    
    // Parse JSON output from wrangler - find the JSON array in the output
    const jsonMatch = result.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0])
        // Wrangler returns array of result objects
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
    // Check if migrations table exists
    const tableExists = await checkMigrationsTable()
    if (!tableExists) {
      console.log('❌ Migrations tracking table does not exist')
      console.log('   Run: node scripts/run-migrations.js --local (or --remote)')
      process.exit(1)
    }
    
    // Get all migration files
    const allMigrations = getMigrationFiles()
    
    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations()
    const appliedNames = new Set(appliedMigrations.map(m => m.migration_name))
    
    // Build status report
    console.log('='.repeat(70))
    console.log('Migration Status Report')
    console.log('='.repeat(70))
    console.log()
    
    let appliedCount = 0
    let pendingCount = 0
    
    for (const migration of allMigrations) {
      if (migration.name === '0000_migrations_table') {
        // Always show migrations table as applied if we got here
        console.log(`✅ ${migration.name.padEnd(30)} Applied (migrations tracking table)`)
        appliedCount++
        continue
      }
      
      const applied = appliedMigrations.find(m => m.migration_name === migration.name)
      
      if (applied) {
        const appliedAt = applied.applied_at ? new Date(applied.applied_at).toLocaleString() : 'Unknown'
        const duration = applied.execution_time_ms ? `${applied.execution_time_ms}ms` : 'N/A'
        const desc = applied.description || 'No description'
        console.log(`✅ ${migration.name.padEnd(30)} Applied at ${appliedAt} (${duration})`)
        if (desc !== 'No description') {
          console.log(`   ${' '.repeat(32)}${desc}`)
        }
        appliedCount++
      } else {
        console.log(`⏳ ${migration.name.padEnd(30)} PENDING`)
        // Try to read description from file
        try {
          const content = fs.readFileSync(migration.path, 'utf-8')
          const descMatch = content.match(/--\s*Description:\s*(.+)/i)
          if (descMatch) {
            console.log(`   ${' '.repeat(32)}${descMatch[1].trim()}`)
          }
        } catch (e) {
          // Ignore
        }
        pendingCount++
      }
    }
    
    console.log()
    console.log('='.repeat(70))
    console.log(`Summary: ${appliedCount} applied, ${pendingCount} pending`)
    console.log('='.repeat(70))
    console.log()
    
    if (pendingCount > 0) {
      console.log('💡 To apply pending migrations, run:')
      console.log(`   node scripts/run-migrations.js ${isLocal ? '--local' : '--remote'}`)
      console.log()
      process.exit(1)
    } else {
      console.log('✅ All migrations are up to date!')
      console.log()
    }
  } catch (error) {
    console.error('\n❌ Error verifying migrations:', error.message)
    process.exit(1)
  }
}

main()
