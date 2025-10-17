#!/usr/bin/env node
/**
 * Generate Seed Configuration Script
 * 
 * Analyzes actual content files and generates a configuration file
 * that defines access rules for each content file.
 * This ensures the seed script is always aligned with actual content.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Content directory (relative to project root)
const CONTENT_DIR = path.join(__dirname, '..', '..', 'content')
const CONFIG_FILE = path.join(__dirname, 'content-config.json')

/**
 * Generate a human-readable password
 * Format: {adjective}-{noun}-{4-digit-number}
 * Example: "swift-tiger-7392"
 */
function generateHumanReadablePassword() {
  const adjectives = [
    'swift', 'bright', 'calm', 'bold', 'wise', 'keen', 'pure', 'wild', 'free', 'true',
    'deep', 'high', 'wide', 'long', 'short', 'fast', 'slow', 'warm', 'cool', 'dark',
    'light', 'soft', 'hard', 'smooth', 'rough', 'sharp', 'round', 'square', 'clear', 'foggy',
    'happy', 'sad', 'brave', 'shy', 'proud', 'humble', 'strong', 'gentle', 'fierce', 'mild',
    'ancient', 'modern', 'young', 'old', 'fresh', 'stale', 'new', 'used', 'clean', 'dirty'
  ]
  
  const nouns = [
    'tiger', 'eagle', 'ocean', 'mountain', 'forest', 'river', 'valley', 'desert', 'island', 'cave',
    'castle', 'tower', 'bridge', 'path', 'road', 'field', 'garden', 'flower', 'tree', 'leaf',
    'stone', 'crystal', 'diamond', 'pearl', 'gold', 'silver', 'copper', 'iron', 'steel', 'wood',
    'fire', 'water', 'earth', 'wind', 'storm', 'rain', 'snow', 'ice', 'cloud', 'star',
    'moon', 'sun', 'planet', 'galaxy', 'comet', 'meteor', 'lightning', 'thunder', 'rainbow', 'dawn'
  ]
  
  // Get random adjective and noun
  const randomValues = new Uint8Array(3)
  crypto.getRandomValues(randomValues)
  
  const adjective = adjectives[randomValues[0] % adjectives.length]
  const noun = nouns[randomValues[1] % nouns.length]
  const number = Math.floor(1000 + (randomValues[2] % 9000)) // 4-digit number 1000-9999
  
  return `${adjective}-${noun}-${number}`
}

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  
  if (!frontmatterMatch) {
    return { frontmatter: null, body: content }
  }
  
  const frontmatterYaml = frontmatterMatch[1]
  const body = frontmatterMatch[2]
  
  try {
    // Simple YAML parsing for basic frontmatter
    const frontmatter = {}
    const lines = frontmatterYaml.split('\n')
    
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.*)$/)
      if (match) {
        const [, key, value] = match
        frontmatter[key] = value.replace(/^["']|["']$/g, '') // Remove quotes
      }
    }
    
    return { frontmatter, body }
  } catch (error) {
    console.warn('Warning: Could not parse frontmatter YAML:', error)
    return { frontmatter: null, body: content }
  }
}

/**
 * Get all actual content files with their metadata
 */
function getContentFiles() {
  const contentFiles = []
  
  const contentTypes = ['notes', 'publications', 'ideas', 'pages']
  
  for (const type of contentTypes) {
    const typeDir = path.join(CONTENT_DIR, type)
    if (fs.existsSync(typeDir)) {
      const files = fs.readdirSync(typeDir)
        .filter(file => file.endsWith('.md'))
        .map(file => {
          const filePath = path.join(typeDir, file)
          const content = fs.readFileSync(filePath, 'utf8')
          const { frontmatter, body } = parseFrontmatter(content)
          const slug = file.replace('.md', '')
          
          return {
            type,
            slug,
            file,
            frontmatter: frontmatter || {},
            body: body.substring(0, 200) + '...' // First 200 chars for description
          }
        })
      contentFiles.push(...files)
    }
  }
  
  return contentFiles
}

/**
 * Generate access rule configuration based on content files
 */
function generateAccessRules(contentFiles) {
  const rules = []
  
  for (const file of contentFiles) {
    // Default access mode based on type
    let accessMode = 'open'
    let description = file.frontmatter.title || file.slug
    let password = null
    let allowedEmails = []
    
    // Check frontmatter for access control hints
    if (file.frontmatter.access_mode) {
      accessMode = file.frontmatter.access_mode
    } else if (file.frontmatter.protected === 'true' || file.frontmatter.protected === true) {
      accessMode = 'password'
    } else if (file.frontmatter.email_list === 'true' || file.frontmatter.email_list === true) {
      accessMode = 'email-list'
    }
    
    // Type-specific defaults
    if (file.type === 'ideas') {
      // Ideas are password-protected by default unless specified otherwise
      if (!file.frontmatter.access_mode && !file.frontmatter.public) {
        accessMode = 'password'
      }
    } else if (file.type === 'publications') {
      // Publications are email-list by default unless specified otherwise
      if (!file.frontmatter.access_mode && !file.frontmatter.public) {
        accessMode = 'email-list'
      }
    }
    
    // Generate description
    if (file.frontmatter.description) {
      description = file.frontmatter.description
    } else if (file.frontmatter.title) {
      description = file.frontmatter.title
    } else {
      description = `${file.type} - ${file.slug}`
    }
    
    // Generate password for password-protected content
    if (accessMode === 'password') {
      password = generateHumanReadablePassword()
    }
    
    // Generate allowed emails for email-list content
    if (accessMode === 'email-list') {
      allowedEmails = ['admin@example.com', 'subscriber@example.com']
    }
    
    rules.push({
      type: file.type,
      slug: file.slug,
      accessMode,
      description,
      password,
      allowedEmails: allowedEmails.length > 0 ? allowedEmails : undefined
    })
  }
  
  return rules
}

/**
 * Main function
 */
function generateSeedConfig() {
  console.log('🌱 Generating seed configuration from content files...')
  console.log('=' .repeat(60))
  
  try {
    // Get content files
    console.log('\n📁 Analyzing content files...')
    const contentFiles = getContentFiles()
    console.log(`Found ${contentFiles.length} content files:`)
    contentFiles.forEach(file => {
      console.log(`  ${file.type}/${file.slug}`)
    })
    
    // Generate access rules
    console.log('\n⚙️  Generating access rules...')
    const rules = generateAccessRules(contentFiles)
    
    // Display generated rules
    console.log('\n📋 Generated access rules:')
    rules.forEach(rule => {
      console.log(`  ${rule.type}/${rule.slug}: ${rule.accessMode}`)
      if (rule.password) {
        console.log(`    🔐 Password: ${rule.password}`)
      }
      if (rule.allowedEmails) {
        console.log(`    📧 Allowed emails: ${rule.allowedEmails.join(', ')}`)
      }
    })
    
    // Show password summary
    const passwordRules = rules.filter(r => r.password)
    if (passwordRules.length > 0) {
      console.log('\n🔐 Generated Passwords:')
      passwordRules.forEach(rule => {
        console.log(`  ${rule.type}/${rule.slug}: ${rule.password}`)
      })
      console.log('\n⚠️  IMPORTANT: Save these passwords securely!')
      console.log('   They are stored in content-config.json for reference.')
    }
    
    // Write configuration file
    const config = {
      generatedAt: new Date().toISOString(),
      contentFiles: contentFiles.length,
      rules: rules
    }
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
    console.log(`\n✅ Configuration written to: ${CONFIG_FILE}`)
    
    // Summary
    const openCount = rules.filter(r => r.accessMode === 'open').length
    const passwordCount = rules.filter(r => r.accessMode === 'password').length
    const emailListCount = rules.filter(r => r.accessMode === 'email-list').length
    
    console.log('\n📊 Summary:')
    console.log(`  Total rules: ${rules.length}`)
    console.log(`  Open: ${openCount}`)
    console.log(`  Password: ${passwordCount}`)
    console.log(`  Email-list: ${emailListCount}`)
    
  } catch (error) {
    console.error('❌ Failed to generate seed configuration:', error.message)
    process.exit(1)
  }
}

// Run the script
generateSeedConfig()
