#!/usr/bin/env node
/**
 * Test API Endpoints
 * 
 * Tests the new content catalog and internal admin endpoints
 */

const API_KEY = 'd458ab3fede5cfefb6f33b8aa21cc93988052c020e59075b8bdc6d95b9847246'
const BASE_URL = 'http://localhost:8787'

async function testEndpoint(name: string, method: string, path: string, body: any = null): Promise<{ success: boolean; data?: any; status?: number; error?: string }> {
  console.log(`\n🧪 Testing: ${name}`)
  console.log(`   ${method} ${path}`)
  
  try {
    const options: RequestInit = {
      method,
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    }
    
    if (body) {
      options.body = JSON.stringify(body)
      console.log(`   Body:`, JSON.stringify(body, null, 2))
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options)
    const data = await response.json()
    
    console.log(`   ✅ Status: ${response.status}`)
    console.log(`   Response:`, JSON.stringify(data, null, 2))
    
    return { success: response.ok, data, status: response.status }
  } catch (error) {
    const err = error as Error
    console.log(`   ❌ Error:`, err.message)
    return { success: false, error: err.message }
  }
}

async function runTests() {
  console.log('🚀 Starting API Endpoint Tests')
  console.log('=' .repeat(60))
  
  // Test 1: Create an open access rule
  await testEndpoint(
    'Create Open Access Rule',
    'POST',
    '/api/internal/access-rules',
    {
      type: 'notes',
      slug: 'test-note-open',
      accessMode: 'open',
      description: 'Test note with open access'
    }
  )
  
  // Test 2: Create a password-protected rule
  await testEndpoint(
    'Create Password-Protected Rule',
    'POST',
    '/api/internal/access-rules',
    {
      type: 'ideas',
      slug: 'test-idea-password',
      accessMode: 'password',
      password: 'secret123',
      description: 'Test idea with password protection'
    }
  )
  
  // Test 3: Create an email-list rule
  await testEndpoint(
    'Create Email-List Rule',
    'POST',
    '/api/internal/access-rules',
    {
      type: 'publications',
      slug: 'test-pub-email',
      accessMode: 'email-list',
      description: 'Test publication with email allowlist',
      allowedEmails: ['user1@example.com', 'user2@example.com']
    }
  )
  
  // Test 4: Get all access rules
  await testEndpoint(
    'Get All Access Rules',
    'GET',
    '/api/internal/access-rules'
  )
  
  // Test 5: Get specific access rule
  await testEndpoint(
    'Get Specific Rule',
    'GET',
    '/api/internal/access-rules/notes/test-note-open'
  )
  
  // Test 6: Update access rule
  await testEndpoint(
    'Update Access Rule',
    'PUT',
    '/api/internal/access-rules/notes/test-note-open',
    {
      accessMode: 'password',
      password: 'newpassword123',
      description: 'Updated to password protected'
    }
  )
  
  // Test 7: Add email to allowlist
  await testEndpoint(
    'Add Email to Allowlist',
    'POST',
    '/api/internal/access-rules/publications/test-pub-email/emails',
    {
      email: 'user3@example.com'
    }
  )
  
  // Test 8: Get content catalog (for build script)
  await testEndpoint(
    'Get Content Catalog',
    'GET',
    '/api/content-catalog'
  )
  
  // Test 9: Get catalog by type
  await testEndpoint(
    'Get Catalog by Type',
    'GET',
    '/api/content-catalog/notes'
  )
  
  // Test 10: Get access logs
  await testEndpoint(
    'Get Access Logs',
    'GET',
    '/api/internal/logs?limit=10'
  )
  
  // Test 11: Get access statistics
  await testEndpoint(
    'Get Access Statistics',
    'GET',
    '/api/internal/stats'
  )
  
  // Test 12: Remove email from allowlist
  await testEndpoint(
    'Remove Email from Allowlist',
    'DELETE',
    '/api/internal/access-rules/publications/test-pub-email/emails/user1@example.com'
  )
  
  // Test 13: Delete access rule
  await testEndpoint(
    'Delete Access Rule',
    'DELETE',
    '/api/internal/access-rules/ideas/test-idea-password'
  )
  
  // Test 14: Test without API key (should fail)
  console.log(`\n🧪 Testing: Unauthorized Access (No API Key)`)
  console.log(`   GET /api/content-catalog`)
  try {
    const response = await fetch(`${BASE_URL}/api/content-catalog`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    console.log(`   ✅ Status: ${response.status} (Expected 401)`)
    console.log(`   Response:`, JSON.stringify(data, null, 2))
  } catch (error) {
    const err = error as Error
    console.log(`   ❌ Error:`, err.message)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ All tests completed!')
}

// Run tests
runTests().catch(console.error)
