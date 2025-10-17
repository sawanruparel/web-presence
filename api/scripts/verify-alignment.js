#!/usr/bin/env node
/**
 * Verify Database-Content Alignment Script
 * 
 * Verifies that database rules exactly match actual content files.
 * This ensures no discrepancies between what's in the database
 * and what content files actually exist.
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
 * Get all database rules
 */
async function getDatabaseRules() {
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
 * Main verification function
 */
async function verifyAlignment() {
  console.log('🔍 Database-Content Alignment Verification')
  console.log('=' .repeat(50))
  
  try {
    // Get actual content files
    console.log('\n📁 Analyzing content files...')
    const contentFiles = getActualContentFiles()
    const contentFileKeys = new Set(contentFiles.map(f => `${f.type}/${f.slug}`))
    
    console.log(`Found ${contentFiles.length} content files:`)
    contentFiles.forEach(file => {
      console.log(`  ${file.type}/${file.slug}`)
    })
    
    // Get database rules
    console.log('\n📊 Fetching database rules...')
    const databaseRules = await getDatabaseRules()
    const databaseRuleKeys = new Set(databaseRules.map(r => `${r.type}/${r.slug}`))
    
    console.log(`Found ${databaseRules.length} database rules:`)
    databaseRules.forEach(rule => {
      console.log(`  ${rule.type}/${rule.slug}: ${rule.accessMode}`)
    })
    
    // Check for alignment
    console.log('\n🔍 Checking alignment...')
    
    // Find rules in database but not in content files
    const orphanedRules = databaseRules.filter(rule => 
      !contentFileKeys.has(`${rule.type}/${rule.slug}`)
    )
    
    // Find content files without database rules
    const missingRules = contentFiles.filter(file => 
      !databaseRuleKeys.has(`${file.type}/${file.slug}`)
    )
    
    // Report results
    console.log('\n📋 Alignment Report:')
    
    if (orphanedRules.length === 0 && missingRules.length === 0) {
      console.log('✅ Perfect alignment! Database rules exactly match content files.')
      console.log(`   Content files: ${contentFiles.length}`)
      console.log(`   Database rules: ${databaseRules.length}`)
    } else {
      if (orphanedRules.length > 0) {
        console.log(`❌ Found ${orphanedRules.length} orphaned database rules (no corresponding content files):`)
        orphanedRules.forEach(rule => {
          console.log(`   - ${rule.type}/${rule.slug}: ${rule.accessMode}`)
        })
      }
      
      if (missingRules.length > 0) {
        console.log(`❌ Found ${missingRules.length} content files without database rules:`)
        missingRules.forEach(file => {
          console.log(`   - ${file.type}/${file.slug}`)
        })
      }
    }
    
    // Show access mode breakdown
    console.log('\n📊 Access Mode Breakdown:')
    const openCount = databaseRules.filter(r => r.accessMode === 'open').length
    const passwordCount = databaseRules.filter(r => r.accessMode === 'password').length
    const emailListCount = databaseRules.filter(r => r.accessMode === 'email-list').length
    
    console.log(`  Open: ${openCount}`)
    console.log(`  Password: ${passwordCount}`)
    console.log(`  Email-list: ${emailListCount}`)
    
    // Final status
    const isAligned = orphanedRules.length === 0 && missingRules.length === 0
    console.log(`\n${isAligned ? '✅' : '❌'} Alignment Status: ${isAligned ? 'PERFECT' : 'MISMATCH'}`)
    
    if (!isAligned) {
      console.log('\n💡 To fix alignment issues:')
      if (orphanedRules.length > 0) {
        console.log('   - Run cleanup script to remove orphaned rules')
      }
      if (missingRules.length > 0) {
        console.log('   - Run dynamic seed script to create missing rules')
      }
    }
    
    return isAligned
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    return false
  }
}

// Run verification
verifyAlignment().then(success => {
  process.exit(success ? 0 : 1)
})
