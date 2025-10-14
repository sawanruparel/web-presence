#!/usr/bin/env node

/**
 * Password Generator for Protected Content
 * 
 * This script helps you generate passwords for your protected content items.
 * Run it to get passwords for all your content or specific items.
 */

// Simple hash function (same as in the API)
function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 6)
}

function generateContentPassword(type, slug) {
  const baseString = `${type}-${slug}`
  const hash = simpleHash(baseString)
  return `${type}-${slug}-${hash}`
}

// Get command line arguments
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log('🔐 Content Password Generator\n')
  console.log('Usage:')
  console.log('  node scripts/generate-passwords.js <type> <slug>')
  console.log('  node scripts/generate-passwords.js all')
  console.log('')
  console.log('Examples:')
  console.log('  node scripts/generate-passwords.js notes my-secret-note')
  console.log('  node scripts/generate-passwords.js publications my-article')
  console.log('  node scripts/generate-passwords.js all')
  process.exit(0)
}

if (args[0] === 'all') {
  console.log('🔐 All Content Passwords\n')
  
  // You can add your actual content items here
  const contentItems = [
    { type: 'notes', slug: 'sample-protected-idea' },
    { type: 'publications', slug: 'decisionrecord-io' },
    { type: 'ideas', slug: 'extending-carplay' },
    { type: 'ideas', slug: 'local-first-ai' },
    { type: 'notes', slug: 'physical-interfaces' }
  ]
  
  contentItems.forEach(item => {
    const password = generateContentPassword(item.type, item.slug)
    console.log(`${item.type}/${item.slug}: ${password}`)
  })
} else if (args.length === 2) {
  const [type, slug] = args
  const password = generateContentPassword(type, slug)
  console.log(`🔐 Password for ${type}/${slug}:`)
  console.log(password)
} else {
  console.error('❌ Invalid arguments. Use: node scripts/generate-passwords.js <type> <slug>')
  process.exit(1)
}
