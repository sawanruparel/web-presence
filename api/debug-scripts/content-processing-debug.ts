#!/usr/bin/env npx tsx
/**
 * Content Processing Debug Script
 * 
 * Test content processing and sync functionality
 */

const API_KEY = 'API_KEY_tu1ylu2nm7wnebxz05vfe'
const BASE_URL = 'https://web-presence-api.quoppo.workers.dev'

interface ContentSyncResult {
  filesProcessed: number
  result: {
    success: boolean
    metadata: {
      public: number
      protected: number
    }
  }
}

interface BucketStatus {
  buckets: {
    protected: {
      count: number
    }
    public: {
      count: number
      objects: Array<{ key: string }>
    }
  }
}

/**
 * Test content processing service directly
 */
async function testContentProcessing() {
  console.log('🧪 Testing content processing service...')
  
  try {
    // Test the content sync with just one file
    const response = await fetch(`${BASE_URL}/api/internal/content-sync/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        files: ['content/ideas/local-first-ai.md']
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json() as ContentSyncResult
    console.log('✅ Content sync result:')
    console.log('  Files processed:', result.filesProcessed)
    console.log('  Success:', result.result.success)
    console.log('  Public metadata:', result.result.metadata.public)
    console.log('  Protected metadata:', result.result.metadata.protected)
    
    if (result.result.metadata.protected > 0) {
      console.log('✅ Content processing correctly identified protected content')
    } else {
      console.log('❌ Content processing failed to identify protected content')
      console.log('  Expected: local-first-ai should be protected (password mode)')
      console.log('  Actual: All content treated as public')
    }
    
  } catch (error) {
    console.error('❌ Content processing test failed:', error instanceof Error ? error.message : 'Unknown error')
  }
}


/**
 * Test bucket status and content distribution
 */
async function testBucketStatus() {
  console.log('\n🧪 Testing bucket status...')
  
  try {
    // Check bucket status
    const statusResponse = await fetch(`${BASE_URL}/api/internal/content-sync/status`, {
      headers: {
        'X-API-Key': API_KEY
      }
    })
    
    if (statusResponse.ok) {
      const status = await statusResponse.json() as BucketStatus
      console.log('✅ Bucket status:')
      console.log('  Protected bucket count:', status.buckets.protected.count)
      console.log('  Public bucket count:', status.buckets.public.count)
      console.log('  Public bucket objects:', status.buckets.public.objects.map(obj => obj.key))
    } else {
      console.log('❌ Status check failed:', statusResponse.status)
    }
    
  } catch (error) {
    console.error('❌ Bucket status test failed:', error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test full content sync
 */
async function testFullContentSync() {
  console.log('\n🧪 Testing full content sync...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/internal/content-sync/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        full_sync: true
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('✅ Full sync result:')
    console.log('  Files processed:', result.filesProcessed)
    console.log('  Success:', result.result.success)
    console.log('  Public metadata:', result.result.metadata.public)
    console.log('  Protected metadata:', result.result.metadata.protected)
    
  } catch (error) {
    console.error('❌ Full sync test failed:', error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Test content catalog endpoint
 */
async function testContentCatalog() {
  console.log('\n🧪 Testing content catalog...')
  
  try {
    // Test content catalog endpoint
    const catalogResponse = await fetch(`${BASE_URL}/api/content-catalog`, {
      headers: {
        'X-API-Key': API_KEY
      }
    })
    
    if (catalogResponse.ok) {
      const catalog = await catalogResponse.json()
      console.log('✅ Content catalog:')
      console.log('  Total rules:', catalog.totalCount)
      console.log('  Rules:', catalog.rules.map((rule: any) => ({
        type: rule.type,
        slug: rule.slug,
        accessMode: rule.accessMode,
        isProtected: rule.accessMode !== 'open'
      })))
    } else {
      console.log('❌ Content catalog failed:', catalogResponse.status)
    }
    
  } catch (error) {
    console.error('❌ Content catalog test failed:', error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Content Processing Debug Tests')
  console.log('==========================================')
  
  await testContentProcessing()
  await testBucketStatus()
  await testFullContentSync()
  await testContentCatalog()
  
  console.log('\n✅ All Content Processing Debug Tests Complete')
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error)
}
