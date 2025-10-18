#!/usr/bin/env npx tsx
/**
 * Access Control Debug Script
 * 
 * Test access control service and authentication flows
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

interface VerifyResponse {
  success: boolean
  token?: string
  accessMode?: string
  message?: string
}

interface AccessCheckResponse {
  accessMode: string
  requiresPassword: boolean
  requiresEmail: boolean
  message: string
}

/**
 * Test access control service directly with mock environment
 */
async function testAccessControlService() {
  console.log('🧪 Testing AccessControlService directly...')
  
  // Mock environment for direct service testing
  const mockEnv = {
    DB: {
      prepare: (query: string) => ({
        bind: (...params: any[]) => ({
          first: async () => {
            console.log('Query:', query)
            console.log('Params:', params)
            
            // Mock database response for local-first-ai
            if (params[0] === 'ideas' && params[1] === 'local-first-ai') {
              return {
                id: 23,
                type: 'ideas',
                slug: 'local-first-ai',
                accessMode: 'password',
                description: 'Idea: local-first AI systems',
                passwordHash: 'ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae',
                createdAt: '2025-10-17T17:06:01.491Z',
                updatedAt: '2025-10-18T04:14:47.487Z',
                allowedEmails: ''
              }
            }
            
            // Mock database response for sample-protected-idea
            if (params[0] === 'ideas' && params[1] === 'sample-protected-idea') {
              return {
                id: 24,
                type: 'ideas',
                slug: 'sample-protected-idea',
                accessMode: 'password',
                description: 'Sample protected idea',
                passwordHash: 'eb0c0d2b0b2a03f0fc6a569d4cf5ef0d28ed3d65290bb975a1d0d7263bff328b',
                createdAt: '2025-10-17T17:06:01.502Z',
                updatedAt: '2025-10-17T19:38:25.070Z',
                allowedEmails: ''
              }
            }
            
            // Mock database response for decisionrecord-io
            if (params[0] === 'publications' && params[1] === 'decisionrecord-io') {
              return {
                id: 25,
                type: 'publications',
                slug: 'decisionrecord-io',
                accessMode: 'email-list',
                description: 'Email-restricted publication',
                passwordHash: null,
                createdAt: '2025-10-17T17:06:01.516Z',
                updatedAt: '2025-10-17T17:06:01.516Z',
                allowedEmails: 'admin@example.com,subscriber@example.com'
              }
            }
            
            return null
          }
        })
      })
    }
  }

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
    
    // Test content sync to see what happens
    console.log('\n2. Testing content sync:')
    const syncResponse = await fetch(`${BASE_URL}/api/internal/content-sync/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        files: ['content/ideas/local-first-ai.md']
      })
    })
    
    if (syncResponse.ok) {
      const syncResult = await syncResponse.json()
      console.log('✅ Content sync result:')
      console.log('  Files processed:', syncResult.filesProcessed)
      console.log('  Public metadata:', syncResult.result.metadata.public)
      console.log('  Protected metadata:', syncResult.result.metadata.protected)
    } else {
      console.log('❌ Content sync failed:', syncResponse.status)
    }
    
    // Check bucket status
    console.log('\n3. Checking bucket status:')
    const statusResponse = await fetch(`${BASE_URL}/api/internal/content-sync/status`, {
      headers: {
        'X-API-Key': API_KEY
      }
    })
    
    if (statusResponse.ok) {
      const status = await statusResponse.json()
      console.log('✅ Bucket status:')
      console.log('  Protected bucket count:', status.buckets.protected.count)
      console.log('  Public bucket count:', status.buckets.public.count)
      console.log('  Public bucket objects:', status.buckets.public.objects.map((obj: any) => obj.key))
    } else {
      console.log('❌ Status check failed:', statusResponse.status)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test access control verification flows
 */
async function testAccessControlVerification() {
  console.log('\n🧪 Testing Access Control Verification...')
  
  try {
    // Test local-first-ai (should be password)
    console.log('\n📝 Testing local-first-ai:')
    const localFirstRule = await fetch(`${BASE_URL}/api/internal/access-rules/ideas/local-first-ai`, {
      headers: { 'X-API-Key': API_KEY }
    })
    
    if (localFirstRule.ok) {
      const rule = await localFirstRule.json()
      console.log('✅ Result:', rule)
      console.log('✅ Is protected:', rule?.access_mode !== 'open')
    } else {
      console.log('❌ Failed to fetch rule:', localFirstRule.status)
    }
    
    // Test sample-protected-idea (should be password)
    console.log('\n📝 Testing sample-protected-idea:')
    const sampleRule = await fetch(`${BASE_URL}/api/internal/access-rules/ideas/sample-protected-idea`, {
      headers: { 'X-API-Key': API_KEY }
    })
    
    if (sampleRule.ok) {
      const rule = await sampleRule.json()
      console.log('✅ Result:', rule)
      console.log('✅ Is protected:', rule?.access_mode !== 'open')
    } else {
      console.log('❌ Failed to fetch rule:', sampleRule.status)
    }
    
    // Test decisionrecord-io (should be email-list)
    console.log('\n📝 Testing decisionrecord-io:')
    const decisionRule = await fetch(`${BASE_URL}/api/internal/access-rules/publications/decisionrecord-io`, {
      headers: { 'X-API-Key': API_KEY }
    })
    
    if (decisionRule.ok) {
      const rule = await decisionRule.json()
      console.log('✅ Result:', rule)
      console.log('✅ Is protected:', rule?.access_mode !== 'open')
    } else {
      console.log('❌ Failed to fetch rule:', decisionRule.status)
    }
    
    // Test extending-carplay (should be open)
    console.log('\n📝 Testing extending-carplay:')
    const extendingRule = await fetch(`${BASE_URL}/api/internal/access-rules/ideas/extending-carplay`, {
      headers: { 'X-API-Key': API_KEY }
    })
    
    if (extendingRule.ok) {
      const rule = await extendingRule.json()
      console.log('✅ Result:', rule)
      console.log('✅ Is protected:', rule?.access_mode !== 'open')
    } else {
      console.log('❌ Failed to fetch rule:', extendingRule.status)
    }
    
  } catch (error) {
    console.error('❌ Verification test failed:', error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test authentication endpoints
 */
async function testAuthenticationEndpoints() {
  console.log('\n🧪 Testing Authentication Endpoints...')
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint:')
    const healthResponse = await fetch(`${BASE_URL}/health`)
    if (healthResponse.ok) {
      const health = await healthResponse.json()
      console.log('✅ Health check:', health)
    } else {
      console.log('❌ Health check failed:', healthResponse.status)
    }
    
    // Test access requirements
    console.log('\n2. Testing access requirements:')
    const accessResponse = await fetch(`${BASE_URL}/auth/access/ideas/local-first-ai`)
    if (accessResponse.ok) {
      const access = await accessResponse.json() as AccessCheckResponse
      console.log('✅ Access requirements:', access)
    } else {
      console.log('❌ Access requirements failed:', accessResponse.status)
    }
    
    // Test password verification
    console.log('\n3. Testing password verification:')
    const verifyResponse = await fetch(`${BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ideas',
        slug: 'local-first-ai',
        password: 'test-password'
      })
    })
    
    if (verifyResponse.ok) {
      const verify = await verifyResponse.json() as VerifyResponse
      console.log('✅ Password verification:', verify)
    } else {
      console.log('❌ Password verification failed:', verifyResponse.status)
    }
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Access Control Debug Tests')
  console.log('=====================================')
  
  await testAccessControlService()
  await testAccessControlVerification()
  await testAuthenticationEndpoints()
  
  console.log('\n✅ All Access Control Debug Tests Complete')
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error)
}
