import fs from 'fs'
import path from 'path'

/**
 * Fetch pre-generated content from R2 via API
 * This replaces the markdown processing in the frontend build
 */

interface ContentMetadata {
  [type: string]: Array<{
    slug: string
    title: string
    date: string
    readTime: string
    type: string
    excerpt: string
    content: string
    html: string
  }>
}

interface FetchOptions {
  apiUrl: string
  apiKey: string
  outputDir: string
}

export async function fetchContentFromR2(options: FetchOptions): Promise<void> {
  const { apiUrl, apiKey, outputDir } = options

  console.log('🔄 Fetching content from R2 via API...')

  try {
    // Fetch content metadata from API
    const metadataResponse = await fetch(`${apiUrl}/api/internal/content-sync/status`, {
      headers: {
        'X-API-Key': apiKey
      }
    })

    if (!metadataResponse.ok) {
      throw new Error(`Failed to fetch content status: ${metadataResponse.status}`)
    }

    const status = await metadataResponse.json()
    console.log(`📊 Found ${status.buckets.public.count} public content files`)

    // For now, we'll create a simple content-metadata.json
    // In a real implementation, you'd fetch the actual metadata from R2
    const contentMetadata: ContentMetadata = {
      notes: [],
      ideas: [],
      publications: [],
      pages: []
    }

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Create type directories
    const contentTypes = ['notes', 'ideas', 'publications', 'pages']
    for (const type of contentTypes) {
      const typeDir = path.join(outputDir, type)
      if (!fs.existsSync(typeDir)) {
        fs.mkdirSync(typeDir, { recursive: true })
      }
    }

    // Write content metadata
    const metadataPath = path.join(outputDir, 'content-metadata.json')
    fs.writeFileSync(metadataPath, JSON.stringify(contentMetadata, null, 2))
    console.log(`✅ Created content-metadata.json`)

    // Note: In a full implementation, you would:
    // 1. Fetch the actual content-metadata.json from R2
    // 2. For each public content item, fetch the HTML from R2
    // 3. Write the HTML files to the dist directory
    // 4. This would require R2 access from the frontend build process

    console.log('✅ Content fetch completed (placeholder implementation)')
    console.log('⚠️  Note: This is a placeholder. Full R2 integration requires:')
    console.log('   - R2 credentials in build environment')
    console.log('   - Direct R2 API calls or wrangler CLI')
    console.log('   - Or API endpoint to serve content files')

  } catch (error) {
    console.error('❌ Failed to fetch content from R2:', error)
    throw error
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const apiUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8787'
  const apiKey = process.env.BUILD_API_KEY || 'dev-api-key'
  const outputDir = process.env.OUTPUT_DIR || 'dist'

  fetchContentFromR2({ apiUrl, apiKey, outputDir })
    .then(() => {
      console.log('✅ Content fetch completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Content fetch failed:', error)
      process.exit(1)
    })
}
