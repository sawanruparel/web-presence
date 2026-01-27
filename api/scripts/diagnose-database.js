#!/usr/bin/env node

/**
 * Database Diagnostic Script
 * 
 * Checks the current state of the database to help diagnose migration issues.
 * 
 * Usage:
 *   node scripts/diagnose-database.js [--local|--remote]
 * 
 * Examples:
 *   node scripts/diagnose-database.js --local   # Check local database
 *   node scripts/diagnose-database.js --remote  # Check production database
 */

import { execSync } from 'child_process'

// Parse command line arguments
const args = process.argv.slice(2)
const isLocal = args.includes('--local')
const isRemote = args.includes('--remote')

if (!isLocal && !isRemote) {
  console.error('Error: Must specify --local or --remote')
  console.error('Usage: node scripts/diagnose-database.js [--local|--remote]')
  process.exit(1)
}

const databaseName = isLocal ? 'web-presence-db-local' : 'web-presence-db'
const environment = isLocal ? 'local' : 'production'
const remoteFlag = isRemote ? '--remote' : '--local'

console.log(`\n🔍 Diagnosing ${environment} database: ${databaseName}\n`)

// Helper to execute SQL and parse results
function executeQuery(command, description) {
  try {
    const result = execSync(
      `npx wrangler d1 execute ${databaseName} ${remoteFlag} --command="${command.replace(/"/g, '\\"')}"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    )
    
    // Parse JSON output from wrangler
    const jsonMatch = result.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0])
        if (Array.isArray(data) && data.length > 0) {
          const firstResult = data[0]
          if (firstResult.results && Array.isArray(firstResult.results)) {
            return firstResult.results
          }
        }
      } catch (e) {
        console.error(`   ⚠️  Failed to parse JSON: ${e.message}`)
        console.error(`   Raw output: ${result.substring(0, 200)}...`)
      }
    }
    return []
  } catch (error) {
    console.error(`   ❌ Error executing query: ${error.message}`)
    if (error.stdout) {
      console.error(`   stdout: ${error.stdout}`)
    }
    if (error.stderr) {
      console.error(`   stderr: ${error.stderr}`)
    }
    return null
  }
}

// Check 1: List all tables
console.log('='.repeat(70))
console.log('1. Checking all tables in database')
console.log('='.repeat(70))
const allTables = executeQuery(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
  'List all tables'
)

if (allTables === null) {
  console.log('   ❌ Failed to query database. Check your connection and permissions.')
  process.exit(1)
}

if (allTables.length === 0) {
  console.log('   ⚠️  No tables found in database!')
} else {
  console.log(`   ✅ Found ${allTables.length} table(s):`)
  allTables.forEach(table => {
    console.log(`      - ${table.name}`)
  })
}

// Check 2: Check for schema_migrations table specifically
console.log('\n' + '='.repeat(70))
console.log('2. Checking for schema_migrations table')
console.log('='.repeat(70))
const migrationsTable = executeQuery(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'",
  'Check migrations table'
)

if (migrationsTable && migrationsTable.length > 0) {
  console.log('   ✅ schema_migrations table EXISTS')
  
  // Check what's in it
  const migrations = executeQuery(
    'SELECT migration_name, applied_at, applied_by, description FROM schema_migrations ORDER BY migration_name',
    'List applied migrations'
  )
  
  if (migrations && migrations.length > 0) {
    console.log(`   📋 Found ${migrations.length} migration record(s):`)
    migrations.forEach(m => {
      const date = m.applied_at ? new Date(m.applied_at).toLocaleString() : 'Unknown'
      const desc = m.description || 'No description'
      console.log(`      - ${m.migration_name} (applied: ${date}, by: ${m.applied_by || 'unknown'})`)
      if (desc !== 'No description') {
        console.log(`        ${desc}`)
      }
    })
  } else {
    console.log('   ⚠️  schema_migrations table exists but is EMPTY')
  }
} else {
  console.log('   ❌ schema_migrations table does NOT exist')
  console.log('   💡 This is why the migration check is failing!')
  console.log('   💡 Run: npm run migrate:remote (or migrate:local) to create it')
}

// Check 3: Check for critical tables
console.log('\n' + '='.repeat(70))
console.log('3. Checking for critical application tables')
console.log('='.repeat(70))
const criticalTables = ['content_access_rules', 'access_logs', 'email_allowlist', 'build_logs']
const tableNames = allTables.map(t => t.name)

criticalTables.forEach(tableName => {
  if (tableNames.includes(tableName)) {
    // Check row count
    const countResult = executeQuery(
      `SELECT COUNT(*) as count FROM ${tableName}`,
      `Count rows in ${tableName}`
    )
    const count = countResult && countResult.length > 0 ? countResult[0].count : 'unknown'
    console.log(`   ✅ ${tableName} EXISTS (${count} rows)`)
  } else {
    console.log(`   ❌ ${tableName} MISSING`)
  }
})

// Check 4: Check table structures
console.log('\n' + '='.repeat(70))
console.log('4. Checking table structures')
console.log('='.repeat(70))

if (tableNames.includes('content_access_rules')) {
  const columns = executeQuery(
    "PRAGMA table_info(content_access_rules)",
    'Get content_access_rules structure'
  )
  if (columns && columns.length > 0) {
    console.log('   📋 content_access_rules columns:')
    columns.forEach(col => {
      console.log(`      - ${col.name} (${col.type})`)
    })
  }
}

if (tableNames.includes('build_logs')) {
  const columns = executeQuery(
    "PRAGMA table_info(build_logs)",
    'Get build_logs structure'
  )
  if (columns && columns.length > 0) {
    console.log('   📋 build_logs columns:')
    columns.forEach(col => {
      console.log(`      - ${col.name} (${col.type})`)
    })
  }
}

// Summary
console.log('\n' + '='.repeat(70))
console.log('Summary')
console.log('='.repeat(70))

const hasMigrationsTable = tableNames.includes('schema_migrations')
const hasContentRules = tableNames.includes('content_access_rules')
const hasBuildLogs = tableNames.includes('build_logs')

console.log(`   Migrations table: ${hasMigrationsTable ? '✅ EXISTS' : '❌ MISSING'}`)
console.log(`   Content access rules: ${hasContentRules ? '✅ EXISTS' : '❌ MISSING'}`)
console.log(`   Build logs: ${hasBuildLogs ? '✅ EXISTS' : '❌ MISSING'}`)

if (!hasMigrationsTable) {
  console.log('\n💡 RECOMMENDED ACTION:')
  console.log(`   Run: cd api && npm run migrate:${isRemote ? 'remote' : 'local'}`)
  console.log('   This will create the migrations table and apply any pending migrations.')
}

console.log('\n')
