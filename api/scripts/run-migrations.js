#!/usr/bin/env node

/**
 * Migration Runner Script
 * 
 * Applies database migrations in order, tracking which ones have been applied.
 * 
 * Usage:
 *   node scripts/run-migrations.js [--local|--remote] [--dry-run]
 * 
 * Examples:
 *   node scripts/run-migrations.js --local          # Apply to local database
 *   node scripts/run-migrations.js --remote         # Apply to production database
 *   node scripts/run-migrations.js --local --dry-run # Show what would be applied
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
const isDryRun = args.includes('--dry-run')

if (!isLocal && !isRemote) {
  console.error('Error: Must specify --local or --remote')
  console.error('Usage: node scripts/run-migrations.js [--local|--remote] [--dry-run]')
  process.exit(1)
}

const databaseName = isLocal ? 'web-presence-db-local' : 'web-presence-db'
const environment = isLocal ? 'local' : 'production'

console.log(`\n🚀 Running migrations for ${environment} database: ${databaseName}`)
if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n')
}

// Get migrations directory
const migrationsDir = path.join(__dirname, '..', 'migrations')

// Get all migration files, sorted
function getMigrationFiles() {
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort() // Sort alphabetically (0000, 0001, 0002, etc.)
  
  return files.map(file => ({
    name: file.replace('.sql', ''),
    file: file,
    path: path.join(migrationsDir, file)
  }))
}

// Check if migration has been applied
async function isMigrationApplied(migrationName) {
  try {
    const result = execSync(
      `npx wrangler d1 execute ${databaseName} ${isLocal ? '--local' : '--remote'} --command="SELECT migration_name FROM schema_migrations WHERE migration_name = '${migrationName}'"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    )
    
    // Parse JSON output from wrangler - find the JSON array in the output
    // Wrangler outputs: [{"results": [...], "success": true, ...}]
    const jsonMatch = result.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0])
        // Wrangler returns array of result objects, each with a "results" array
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
    // If table doesn't exist or query fails, assume migration not applied
    if (error.message.includes('no such table') || error.message.includes('Unexpected')) {
      return false
    }
    throw error
  }
}

// Apply a single migration
async function applyMigration(migration) {
  const startTime = Date.now()
  
  console.log(`\n📝 Applying migration: ${migration.name}`)
  
  if (isDryRun) {
    console.log(`   Would execute: ${migration.file}`)
    return { success: true, duration: 0 }
  }
  
  try {
    // Read migration file
    const sql = fs.readFileSync(migration.path, 'utf-8')
    
    // Extract description from comments if available
    const descriptionMatch = sql.match(/--\s*Description:\s*(.+)/i)
    const description = descriptionMatch ? descriptionMatch[1].trim() : null
    
    // Execute migration
    execSync(
      `npx wrangler d1 execute ${databaseName} ${isLocal ? '--local' : '--remote'} --file=${migration.path}`,
      { stdio: 'inherit' }
    )
    
    const duration = Date.now() - startTime
    
    // Record migration in tracking table
    const recordSql = `
      INSERT INTO schema_migrations (migration_name, migration_file, description, execution_time_ms, applied_by)
      VALUES ('${migration.name}', '${migration.file}', ${description ? `'${description.replace(/'/g, "''")}'` : 'NULL'}, ${duration}, '${process.env.USER || 'system'}')
    `
    
    execSync(
      `npx wrangler d1 execute ${databaseName} ${isLocal ? '--local' : '--remote'} --command="${recordSql.replace(/"/g, '\\"')}"`,
      { stdio: 'pipe' }
    )
    
    console.log(`   ✅ Applied successfully (${duration}ms)`)
    return { success: true, duration }
  } catch (error) {
    console.error(`   ❌ Failed to apply migration: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// Ensure migrations table exists
async function ensureMigrationsTable() {
  console.log('\n🔍 Checking migrations tracking table...')
  
  try {
    // Check if table exists
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
            if (firstResult.results.length > 0) {
              console.log('   ✅ Migrations table exists')
              return true
            }
          }
        }
      } catch (e) {
        // JSON parse failed
      }
    }
  } catch (error) {
    // Table doesn't exist, continue to create it
  }
  
  // Create migrations table
  console.log('   📦 Creating migrations tracking table...')
  const migrationsTablePath = path.join(migrationsDir, '0000_migrations_table.sql')
  
  if (!fs.existsSync(migrationsTablePath)) {
    console.error('   ❌ Error: 0000_migrations_table.sql not found!')
    console.error('   This file must exist to track migrations.')
    process.exit(1)
  }
  
  if (isDryRun) {
    console.log('   Would create migrations table')
    return false
  }
  
  try {
    execSync(
      `npx wrangler d1 execute ${databaseName} ${isLocal ? '--local' : '--remote'} --file=${migrationsTablePath}`,
      { stdio: 'inherit' }
    )
    console.log('   ✅ Migrations table created')
    return true
  } catch (error) {
    console.error(`   ❌ Failed to create migrations table: ${error.message}`)
    process.exit(1)
  }
}

// Main execution
async function main() {
  try {
    // Ensure migrations table exists
    await ensureMigrationsTable()
    
    // Get all migration files
    const migrations = getMigrationFiles()
    console.log(`\n📋 Found ${migrations.length} migration files`)
    
    // Check which migrations need to be applied
    const pendingMigrations = []
    
    for (const migration of migrations) {
      // Skip the migrations table migration itself if it was just created
      if (migration.name === '0000_migrations_table') {
        continue
      }
      
      const isApplied = await isMigrationApplied(migration.name)
      if (!isApplied) {
        pendingMigrations.push(migration)
      } else {
        console.log(`   ✓ ${migration.name} (already applied)`)
      }
    }
    
    if (pendingMigrations.length === 0) {
      console.log('\n✅ All migrations are up to date!')
      return
    }
    
    console.log(`\n📦 ${pendingMigrations.length} migration(s) to apply:`)
    pendingMigrations.forEach(m => console.log(`   - ${m.name}`))
    
    if (isDryRun) {
      console.log('\n🔍 Dry run complete - no changes made')
      return
    }
    
    // Apply pending migrations
    let successCount = 0
    let failCount = 0
    
    for (const migration of pendingMigrations) {
      const result = await applyMigration(migration)
      if (result.success) {
        successCount++
      } else {
        failCount++
        console.error(`\n❌ Migration ${migration.name} failed. Stopping.`)
        break
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50))
    console.log(`📊 Migration Summary:`)
    console.log(`   ✅ Applied: ${successCount}`)
    if (failCount > 0) {
      console.log(`   ❌ Failed: ${failCount}`)
    }
    console.log('='.repeat(50) + '\n')
    
    if (failCount > 0) {
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Error running migrations:', error.message)
    process.exit(1)
  }
}

main()
