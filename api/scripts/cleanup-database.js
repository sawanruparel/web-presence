#!/usr/bin/env node
/**
 * Database Cleanup Script
 * 
 * Removes all test/development rules and keeps only rules for actual content files.
 * This ensures database rules align with actual content files.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8787'
const API_KEY = process.env.API_KEY || (() => {
  // Try to read from .dev.vars file
  try {
    const fs = require('fs')
    const path = require('path')
    const devVarsPath = path.join(__dirname, '..', '.dev.vars')
    if (fs.existsSync(devVarsPath)) {
      const content = fs.readFileSync(devVarsPath, 'utf8')
      const match = content.match(/INTERNAL_API_KEY=(.+)/)
      if (match) {
        return match[1].trim()
      }
    }
  } catch (error) {
    // Ignore errors
  }
  throw new Error('API_KEY environment variable not set and .dev.vars file not found')
})()

// Content directory (relative to project root)
const CONTENT_DIR = path.join(__dirname, '..', '..', 'content')

/**
 * Get all actual content files
 */
function getActualContentFiles() {
  const contentFiles = []
  
  const contentTypes = ['notes', 'publications', 'ideas', 'pages']
  
  for (const type of contentTypes) {
    const typeDir = path.join(CONTENT_DIR, type)
    if (fs.existsSync(typeDir)) {
      const files = fs.readdirSync(typeDir)
        .filter(file => file.endsWith('.md'))
        .map(file => ({
          type,
          slug: file.replace('.md', ''),
          file: file
        }))
      contentFiles.push(...files)
    }
  }
  
  return contentFiles
}

/**
 * Get all rules from database
 */
async function getAllRules() {
  const response = await fetch(`${API_BASE_URL}/api/content-catalog`, {
    headers: {
      'X-API-Key': API_KEY
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch rules: ${response.status} ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.rules
}

/**
 * Delete a rule from database
 */
async function deleteRule(type, slug) {
  const response = await fetch(`${API_BASE_URL}/api/internal/access-rules/${type}/${slug}`, {
    method: 'DELETE',
    headers: {
      'X-API-Key': API_KEY
    }
  })
  
  if (!response.ok) {
    console.warn(`⚠️  Failed to delete ${type}/${slug}: ${response.status} ${response.statusText}`)
    return false
  }
  
  return true
}

/**
 * Main cleanup function
 */
async function cleanupDatabase() {
  console.log('🧹 Database Cleanup Script')
  console.log('=' .repeat(50))
  
  try {
    // Get actual content files
    console.log('\n📁 Analyzing actual content files...')
    const actualFiles = getActualContentFiles()
    console.log(`Found ${actualFiles.length} content files:`)
    actualFiles.forEach(file => {
      console.log(`  ${file.type}/${file.slug}`)
    })
    
    // Get all database rules
    console.log('\n📊 Fetching database rules...')
    const allRules = await getAllRules()
    console.log(`Found ${allRules.length} rules in database`)
    
    // Identify rules to keep (those that match actual content files)
    const actualFileKeys = new Set(actualFiles.map(f => `${f.type}/${f.slug}`))
    const rulesToKeep = allRules.filter(rule => 
      actualFileKeys.has(`${rule.type}/${rule.slug}`)
    )
    const rulesToDelete = allRules.filter(rule => 
      !actualFileKeys.has(`${rule.type}/${rule.slug}`)
    )
    
    console.log(`\n📋 Rules to keep (${rulesToKeep.length}):`)
    rulesToKeep.forEach(rule => {
      console.log(`  ✅ ${rule.type}/${rule.slug}: ${rule.accessMode}`)
    })
    
    console.log(`\n🗑️  Rules to delete (${rulesToDelete.length}):`)
    rulesToDelete.forEach(rule => {
      console.log(`  ❌ ${rule.type}/${rule.slug}: ${rule.accessMode}`)
    })
    
    if (rulesToDelete.length === 0) {
      console.log('\n✅ Database is already clean! No rules to delete.')
      return
    }
    
    // Confirm deletion
    console.log(`\n⚠️  About to delete ${rulesToDelete.length} rules.`)
    console.log('This will remove all test/development rules from the database.')
    
    // Delete rules
    console.log('\n🗑️  Deleting rules...')
    let deletedCount = 0
    let failedCount = 0
    
    for (const rule of rulesToDelete) {
      const success = await deleteRule(rule.type, rule.slug)
      if (success) {
        deletedCount++
        console.log(`  ✅ Deleted ${rule.type}/${rule.slug}`)
      } else {
        failedCount++
      }
    }
    
    console.log(`\n📊 Cleanup Summary:`)
    console.log(`  ✅ Successfully deleted: ${deletedCount}`)
    console.log(`  ❌ Failed to delete: ${failedCount}`)
    console.log(`  📁 Rules remaining: ${rulesToKeep.length}`)
    
    // Verify final state
    console.log('\n🔍 Verifying final state...')
    const finalRules = await getAllRules()
    console.log(`Final rule count: ${finalRules.length}`)
    
    if (finalRules.length === actualFiles.length) {
      console.log('✅ Database is now aligned with content files!')
    } else {
      console.log('⚠️  Warning: Rule count does not match content file count')
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
    process.exit(1)
  }
}

// Run cleanup
cleanupDatabase()
