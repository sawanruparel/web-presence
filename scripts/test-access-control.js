#!/usr/bin/env node

/**
 * Access Control System Examples
 * 
 * This file demonstrates how to use the new access control system with all three modes.
 * Run with: node scripts/test-access-control.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_BASE = process.env.API_BASE || 'http://localhost:8787'
const CONFIG_FILE = path.join(__dirname, '..', 'api', 'scripts', 'content-config.json')

// Load passwords from content-config.json
function loadPasswords() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log('❌ content-config.json not found')
    console.log('   Run "node api/scripts/generate-seed-config.js" first to generate the configuration.')
    process.exit(1)
  }
  
  const configContent = fs.readFileSync(CONFIG_FILE, 'utf8')
  const config = JSON.parse(configContent)
  
  const passwords = {}
  config.rules.forEach(rule => {
    if (rule.password) {
      passwords[`${rule.type}/${rule.slug}`] = rule.password
    }
  })
  
  return passwords
}

const passwords = loadPasswords()

// Test cases
const testCases = [
  {
    name: 'Test 1: Open Access - No authentication required',
    type: 'ideas',
    slug: 'extending-carplay',
    accessMode: 'open',
    shouldWork: true,
    payload: {}
  },
  {
    name: 'Test 2: Password Protected - Valid password',
    type: 'ideas',
    slug: 'sample-protected-idea',
    accessMode: 'password',
    shouldWork: true,
    payload: {
      password: passwords['ideas/sample-protected-idea'] || 'calm-ocean-1567'
    }
  },
  {
    name: 'Test 3: Password Protected - Invalid password',
    type: 'ideas',
    slug: 'sample-protected-idea',
    accessMode: 'password',
    shouldWork: false,
    payload: {
      password: 'wrong-password'
    }
  },
  {
    name: 'Test 4: Email List - Authorized email',
    type: 'publications',
    slug: 'decisionrecord-io',
    accessMode: 'email-list',
    shouldWork: true,
    payload: {
      email: 'admin@example.com'
    }
  },
  {
    name: 'Test 5: Email List - Unauthorized email',
    type: 'publications',
    slug: 'decisionrecord-io',
    accessMode: 'email-list',
    shouldWork: false,
    payload: {
      email: 'unauthorized@example.com'
    }
  },
  {
    name: 'Test 6: Email List - Case insensitive match',
    type: 'publications',
    slug: 'decisionrecord-io',
    accessMode: 'email-list',
    shouldWork: true,
    payload: {
      email: 'ADMIN@EXAMPLE.COM'
    }
  }
]

console.log('🧪 Access Control System Test Suite\n')
console.log(`API Base: ${API_BASE}\n`)

// Example: Check access requirements
async function checkAccess(type, slug) {
  console.log(`\n📋 Checking access requirements for ${type}/${slug}...`)
  
  try {
    const response = await fetch(`${API_BASE}/auth/access/${type}/${slug}`)
    const data = await response.json()
    
    console.log('Response:', JSON.stringify(data, null, 2))
    return data
  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Example: Verify access (all modes)
async function verifyAccess(type, slug, payload) {
  console.log(`\n🔐 Verifying access for ${type}/${slug}...`)
  console.log('Payload:', JSON.stringify(payload, null, 2))
  
  try {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        slug,
        ...payload
      })
    })
    
    const data = await response.json()
    console.log('Response:', {
      status: response.status,
      success: data.success,
      accessMode: data.accessMode,
      message: data.message,
      token: data.token ? `${data.token.substring(0, 20)}...` : undefined
    })
    
    return { response, data }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Example: Get protected content with token
async function getProtectedContent(type, slug, token) {
  console.log(`\n📄 Fetching protected content for ${type}/${slug}...`)
  
  try {
    const response = await fetch(`${API_BASE}/auth/content/${type}/${slug}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    console.log('Response:', {
      status: response.status,
      title: data.title,
      slug: data.slug,
      type: data.type,
      contentPreview: data.content ? `${data.content.substring(0, 50)}...` : undefined
    })
    
    return data
  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Usage examples for documentation
const usageExamples = {
  frontend: `
// Frontend Example: Using the AccessModal component
import { AccessModal } from './components/access-modal'
import { useEffect, useState } from 'react'

function ProtectedContent({ type, slug }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [accessMode, setAccessMode] = useState('open')
  const [token, setToken] = useState(null)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    // Check access requirements
    fetch(\`/auth/access/\${type}/\${slug}\`)
      .then(r => r.json())
      .then(data => {
        setAccessMode(data.accessMode)
        if (data.accessMode !== 'open') {
          setIsModalOpen(true)
        } else {
          loadContent()
        }
      })
  }, [type, slug])
  
  const handleAccessSubmit = async (payload) => {
    try {
      const response = await fetch('/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, slug, ...payload })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setToken(data.token)
        setIsModalOpen(false)
        loadContent()
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Verification failed')
    }
  }
  
  const loadContent = async () => {
    const headers = token ? { 'Authorization': \`Bearer \${token}\` } : {}
    const response = await fetch(\`/auth/content/\${type}/\${slug}\`, { headers })
    const content = await response.json()
    // Render content...
  }
  
  return (
    <>
      <AccessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAccessSubmit}
        title="My Protected Content"
        accessMode={accessMode}
        error={error}
      />
      {/* Content rendering... */}
    </>
  )
}
`,
  
  curl: `
# Example 1: Check access requirements
curl http://localhost:8787/auth/access/notes/sample-protected-idea

# Example 2: Verify password-protected content
curl -X POST http://localhost:8787/auth/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "ideas",
    "slug": "sample-protected-idea",
    "password": "calm-ocean-1567"
  }'

# Example 3: Verify email-list protected content
curl -X POST http://localhost:8787/auth/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "publications",
    "slug": "decisionrecord-io",
    "email": "admin@example.com"
  }'

# Example 4: Get protected content with token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl http://localhost:8787/auth/content/ideas/sample-protected-idea \\
  -H "Authorization: Bearer \${TOKEN}"
`
}

console.log('\n📚 Usage Examples:\n')
console.log('Frontend (React):', usageExamples.frontend)
console.log('\nCURL Commands:', usageExamples.curl)

console.log('\n✅ Test suite defined. Run the tests manually with API calls.')
console.log('Example:')
console.log('  node scripts/test-access-control.js check ideas sample-protected-idea')
console.log('  node scripts/test-access-control.js verify ideas sample-protected-idea password')
console.log('\n🔐 Available passwords from content-config.json:')
Object.entries(passwords).forEach(([key, password]) => {
  console.log(`  ${key}: ${password}`)
})
