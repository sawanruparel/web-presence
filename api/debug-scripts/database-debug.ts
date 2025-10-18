#!/usr/bin/env npx tsx
/**
 * Database Debug Script
 * 
 * Test database connections and queries
 */

const API_KEY = 'API_KEY_tu1ylu2nm7wnebxz05vfe'
const BASE_URL = 'http://localhost:8787'

interface AccessRule {
  id: number
  type: string
  slug: string
  access_mode: string
  description: string
  password_hash?: string
  created_at: string
  updated_at: string
  allowed_emails?: string[]
}

interface DatabaseResponse {
  rules: AccessRule[]
  count: number
}

/**
 * Test database service directly via API
 */
async function testDatabaseService() {
  console.log('🧪 Testing DatabaseService directly...')
  
  try {
    // Test the API endpoint that works
    console.log('\n1. Testing API endpoint (should work):')
    const apiResponse = await fetch(`${BASE_URL}/api/internal/access-rules/ideas/local-first-ai`, {
      headers: {
        'X-API-Key': API_KEY
      }
    })
    
    if (apiResponse.ok) {
      const apiRule = await apiResponse.json()
      console.log('✅ API endpoint result:')
      console.log('  Type:', apiRule.type)
      console.log('  Slug:', apiRule.slug)
      console.log('  Access Mode:', apiRule.access_mode)
      console.log('  Should be protected:', apiRule.access_mode !== 'open')
    } else {
      console.log('❌ API endpoint failed:', apiResponse.status)
    }
    
    // Test a simple database query
    console.log('\n2. Testing simple database query:')
    const queryResponse = await fetch(`${BASE_URL}/api/internal/access-rules`, {
      headers: {
        'X-API-Key': API_KEY
      }
    })
    
    if (queryResponse.ok) {
      const allRules = await queryResponse.json() as DatabaseResponse
      const localFirstRule = allRules.rules.find(rule => rule.slug === 'local-first-ai')
      console.log('✅ All rules query result:')
      console.log('  Found local-first-ai rule:', !!localFirstRule)
      if (localFirstRule) {
        console.log('  Type:', localFirstRule.type)
        console.log('  Slug:', localFirstRule.slug)
        console.log('  Access Mode:', localFirstRule.access_mode)
        console.log('  Should be protected:', localFirstRule.access_mode !== 'open')
      }
    } else {
      console.log('❌ All rules query failed:', queryResponse.status)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  console.log('\n🧪 Testing database connection...')
  
  try {
    // Test the API endpoint directly
    const response = await fetch(`${BASE_URL}/api/internal/access-rules/ideas/local-first-ai`, {
      headers: {
        'X-API-Key': API_KEY
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const rule = await response.json() as AccessRule
    console.log('✅ Database query successful:')
    console.log('  Type:', rule.type)
    console.log('  Slug:', rule.slug)
    console.log('  Access Mode:', rule.access_mode)
    console.log('  Is Protected:', rule.access_mode !== 'open')
    
    if (rule.access_mode === 'password') {
      console.log('✅ local-first-ai should be PROTECTED')
    } else {
      console.log('❌ local-first-ai should be PROTECTED but is:', rule.access_mode)
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error instanceof Error ? error.message : 'Unknown error')
  }
}


/**
 * Test database service in context
 */
async function testDatabaseInContext() {
  console.log('\n🧪 Testing database service in ContentProcessingService context...')
  
  try {
    // Test the exact same database query that ContentProcessingService uses
    const response = await fetch(`${BASE_URL}/api/internal/access-rules/ideas/local-first-ai`, {
      headers: {
        'X-API-Key': API_KEY
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json() as AccessRule
    console.log('🔍 API response:', data)
    
    // Simulate the exact logic that ContentProcessingService uses
    if (data.access_mode) {
      const result = {
        isProtected: data.access_mode !== 'open',
        accessMode: data.access_mode
      }
      console.log('✅ ContentProcessingService logic result:', result)
    } else {
      console.log('❌ No access_mode found')
    }
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test real database service
 */
async function testRealDatabase() {
  console.log('\n🧪 Testing real database service via API...')
  
  try {
    // Test the exact same query that ContentProcessingService should use
    const response = await fetch(`${BASE_URL}/api/internal/access-rules/ideas/local-first-ai`, {
      headers: {
        'X-API-Key': API_KEY
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json() as AccessRule
    console.log('🔍 API response:', data)
    
    if (data) {
      const accessMode = data.access_mode
      const isProtected = accessMode !== 'open'
      console.log('✅ Access mode:', accessMode)
      console.log('✅ Is protected:', isProtected)
    } else {
      console.log('❌ No rule found')
    }
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test database service direct API calls
 */
async function testDatabaseServiceDirect() {
  console.log('\n🧪 Testing database service direct API calls...')
  
  try {
    // Test the exact same query that DatabaseService.getAccessRule uses
    const response = await fetch(`${BASE_URL}/api/internal/access-rules/ideas/local-first-ai`, {
      headers: {
        'X-API-Key': API_KEY
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json() as AccessRule
    console.log('🔍 API response data:', data)
    
    // The API returns the rule directly, not wrapped in a 'rule' property
    if (data.access_mode) {
      const accessMode = data.access_mode
      const isProtected = accessMode !== 'open'
      console.log('✅ Access mode:', accessMode)
      console.log('✅ Is protected:', isProtected)
      console.log('✅ This should work in ContentProcessingService')
    } else {
      console.log('❌ No access_mode found in response')
    }
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test database queries by type
 */
async function testDatabaseQueriesByType() {
  console.log('\n🧪 Testing database queries by type...')
  
  try {
    // Test ideas type
    console.log('\n1. Testing ideas type:')
    const ideasResponse = await fetch(`${BASE_URL}/api/internal/access-rules?type=ideas`, {
      headers: {
        'X-API-Key': API_KEY
      }
    })
    
    if (ideasResponse.ok) {
      const ideas = await ideasResponse.json() as DatabaseResponse
      console.log('✅ Ideas rules:', ideas.count)
      ideas.rules.forEach(rule => {
        console.log(`  - ${rule.slug}: ${rule.access_mode} (protected: ${rule.access_mode !== 'open'})`)
      })
    } else {
      console.log('❌ Ideas query failed:', ideasResponse.status)
    }
    
    // Test publications type
    console.log('\n2. Testing publications type:')
    const publicationsResponse = await fetch(`${BASE_URL}/api/internal/access-rules?type=publications`, {
      headers: {
        'X-API-Key': API_KEY
      }
    })
    
    if (publicationsResponse.ok) {
      const publications = await publicationsResponse.json() as DatabaseResponse
      console.log('✅ Publications rules:', publications.count)
      publications.rules.forEach(rule => {
        console.log(`  - ${rule.slug}: ${rule.access_mode} (protected: ${rule.access_mode !== 'open'})`)
      })
    } else {
      console.log('❌ Publications query failed:', publicationsResponse.status)
    }
    
    // Test notes type
    console.log('\n3. Testing notes type:')
    const notesResponse = await fetch(`${BASE_URL}/api/internal/access-rules?type=notes`, {
      headers: {
        'X-API-Key': API_KEY
      }
    })
    
    if (notesResponse.ok) {
      const notes = await notesResponse.json() as DatabaseResponse
      console.log('✅ Notes rules:', notes.count)
      notes.rules.forEach(rule => {
        console.log(`  - ${rule.slug}: ${rule.access_mode} (protected: ${rule.access_mode !== 'open'})`)
      })
    } else {
      console.log('❌ Notes query failed:', notesResponse.status)
    }
    
  } catch (error) {
    console.error('❌ Database queries by type failed:', error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Database Debug Tests')
  console.log('=================================')
  
  await testDatabaseService()
  await testDatabaseConnection()
  await testDatabaseInContext()
  await testRealDatabase()
  await testDatabaseServiceDirect()
  await testDatabaseQueriesByType()
  
  console.log('\n✅ All Database Debug Tests Complete')
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error)
}
