import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Fetch pre-generated content from R2 via API
 * This replaces the markdown processing in the frontend build
 */

interface ContentItem {
  slug: string
  title: string
  date: string
  readTime: string
  type: 'note' | 'publication' | 'idea' | 'page'
  excerpt: string
  content: string
  html: string
}

interface ContentMetadata {
  notes: ContentItem[]
  publications: ContentItem[]
  ideas: ContentItem[]
  pages: ContentItem[]
  latest: ContentItem[]
}

interface FetchOptions {
  apiUrl: string
  apiKey: string
  outputDir: string
}

/**
 * Transform raw content items to match ContentItem interface
 */
function transformContentItems(items: any[], type: 'note' | 'publication' | 'idea' | 'page'): ContentItem[] {
  return items.map(item => ({
    slug: item.slug,
    title: item.title,
    date: item.date,
    readTime: item.readTime,
    type: type,
    excerpt: item.excerpt,
    content: item.content || '',
    html: item.html || ''
  }))
}

export async function fetchContentFromR2(options: FetchOptions): Promise<void> {
  const { apiUrl, apiKey, outputDir } = options

  // Check if sync is requested
  const shouldSync = process.argv.includes('--sync')

  if (shouldSync) {
    console.log('🔄 Triggering content sync before fetch...')
    try {
      const syncResponse = await fetch(`${apiUrl}/api/internal/content-sync/manual`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_sync: true
        })
      })

      if (!syncResponse.ok) {
        throw new Error(`Sync failed with status: ${syncResponse.status} ${syncResponse.statusText}`)
      }

      const syncResult = await syncResponse.json()
      console.log('✅ Content sync completed successfully')
      console.log('📊 Sync result:', JSON.stringify(syncResult, null, 2))
    } catch (error) {
      console.error('❌ Failed to sync content:', error)
      // We decide here if sync failure should stop the build. 
      // Usually yes, if explicit sync was requested.
      throw error
    }
  }

  console.log('🔄 Fetching content metadata from API...')

  // Create build log entry at start
  let buildLogId: number | null = null
  const buildStartTime = new Date().toISOString()
  const logOutput: string[] = []

  // Store original console methods
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn

  // Capture console output
  console.log = (...args: any[]) => {
    const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
    logOutput.push(`[LOG] ${message}`)
    originalLog(...args)
  }

  console.error = (...args: any[]) => {
    const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
    logOutput.push(`[ERROR] ${message}`)
    originalError(...args)
  }

  console.warn = (...args: any[]) => {
    const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
    logOutput.push(`[WARN] ${message}`)
    originalWarn(...args)
  }

  console.log(`🔗 Connecting to API at ${apiUrl}...`)

  // Create build log entry
  try {
    const buildLogResponse = await fetch(`${apiUrl}/api/admin/build-logs`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buildType: 'web',
        status: 'in_progress',
        startedAt: buildStartTime,
        triggeredBy: process.env.CI ? 'ci' : (process.env.GITHUB_ACTIONS ? 'ci' : 'manual'),
        gitCommitSha: process.env.GITHUB_SHA || process.env.GIT_COMMIT_SHA,
        gitBranch: process.env.GITHUB_REF?.replace('refs/heads/', '') || process.env.GIT_BRANCH
      }),
    })

    if (buildLogResponse.ok) {
      const buildLogData = await buildLogResponse.json()
      buildLogId = buildLogData.id
      console.log(`📝 Created build log entry #${buildLogId}`)
    } else {
      console.warn(`⚠️  Failed to create build log entry (non-fatal): HTTP ${buildLogResponse.status}`)
    }
  } catch (logError) {
    const logErrMsg = logError instanceof Error ? logError.message : 'Unknown error'
    const logErrCause = logError instanceof Error && logError.cause ? ` (${logError.cause})` : ''
    console.warn(`⚠️  Failed to create build log entry (non-fatal): ${logErrMsg}${logErrCause}`)
    console.warn(`   This usually means the API server is not running at ${apiUrl}`)
  }

  try {
    // Fetch content metadata from catalog endpoint
    console.log(`📡 Fetching content catalog from ${apiUrl}/api/content/catalog...`)
    const catalogResponse = await fetch(`${apiUrl}/api/content/catalog`, {
      headers: {
        'X-API-Key': apiKey
      }
    })

    if (!catalogResponse.ok) {
      throw new Error(`HTTP ${catalogResponse.status}: ${catalogResponse.statusText}`)
    }

    const catalogData = await catalogResponse.json()
    console.log(`📊 Found ${catalogData.content?.length || 0} access rules from database`)
    console.log(`📊 Found content metadata with ${Object.keys(catalogData.metadata || {}).length} content types`)

    // Debug: Log the actual structure of metadata
    if (catalogData.metadata) {
      console.log(`🔍 Metadata keys: ${Object.keys(catalogData.metadata).join(', ')}`)
      Object.keys(catalogData.metadata).forEach(key => {
        const items = catalogData.metadata[key]
        if (Array.isArray(items)) {
          console.log(`   ${key}: ${items.length} items`)
        } else {
          console.log(`   ${key}: ${typeof items} (not an array)`)
        }
      })
    } else {
      console.warn('⚠️  No metadata found in API response')
    }

    // Create a map of type/slug -> accessMode from database rules (single source of truth)
    const accessRules = new Map<string, string>()
    if (catalogData.content && Array.isArray(catalogData.content)) {
      catalogData.content.forEach((rule: { type: string; slug: string; accessMode: string }) => {
        const key = `${rule.type}/${rule.slug}`
        accessRules.set(key, rule.accessMode)
        console.log(`🔐 Access rule: ${key} -> ${rule.accessMode}`)
      })
    }

    // Filter metadata to only include public content (accessMode === 'open')
    // Database is the single source of truth for access control
    const filterPublicContent = (items: any[], type: string): any[] => {
      return items.filter(item => {
        const key = `${type}/${item.slug}`
        const accessMode = accessRules.get(key)
        // Only include if accessMode is 'open' or not in database (default to open for backwards compatibility)
        const isPublic = !accessMode || accessMode === 'open'
        if (!isPublic) {
          console.log(`🔒 Filtering out protected content: ${key} (accessMode: ${accessMode})`)
        }
        return isPublic
      })
    }

    // Transform metadata to match ContentList interface
    // Metadata uses plural keys: notes, ideas, pages, publications
    // Access rules also use plural types, so we need to match them
    // Only include content that is marked as 'open' in the database
    const notes = transformContentItems(
      filterPublicContent(catalogData.metadata?.notes || [], 'notes'),
      'note'
    )
    const publications = transformContentItems(
      filterPublicContent(catalogData.metadata?.publications || [], 'publications'),
      'publication'
    )
    const ideas = transformContentItems(
      filterPublicContent(catalogData.metadata?.ideas || [], 'ideas'),
      'idea'
    )
    // Include pages (about, contact) from catalog; sync pipeline already includes content/pages/*.md
    const pages = transformContentItems(
      filterPublicContent(catalogData.metadata?.pages || [], 'pages'),
      'page'
    )

    // Create latest array by combining all content and sorting by date
    const allContent = [...notes, ...publications, ...ideas, ...pages]
    const latest = allContent
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10) // Get latest 10 items

    const contentMetadata: ContentMetadata = {
      notes,
      publications,
      ideas,
      pages,
      latest
    }

    console.log(`📝 Transformed content: ${contentMetadata.notes.length} notes, ${contentMetadata.ideas.length} ideas, ${contentMetadata.publications.length} publications, ${contentMetadata.pages.length} pages`)

    // Create output directories
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Create src/data directory for TypeScript imports
    const srcDataDir = path.join(__dirname, '..', 'src', 'data')
    if (!fs.existsSync(srcDataDir)) {
      fs.mkdirSync(srcDataDir, { recursive: true })
    }

    // Create type directories in dist
    const contentTypes = ['notes', 'ideas', 'publications', 'pages']
    for (const type of contentTypes) {
      const typeDir = path.join(outputDir, type)
      if (!fs.existsSync(typeDir)) {
        fs.mkdirSync(typeDir, { recursive: true })
      }
    }

    // Write content metadata to both locations
    const distMetadataPath = path.join(outputDir, 'content-metadata.json')
    const srcMetadataPath = path.join(srcDataDir, 'content-metadata.json')

    const metadataJson = JSON.stringify(contentMetadata, null, 2)

    fs.writeFileSync(distMetadataPath, metadataJson)
    fs.writeFileSync(srcMetadataPath, metadataJson)

    console.log(`✅ Created content-metadata.json in dist and src/data`)

    // Note: In a full implementation, you would:
    // 1. Fetch the actual content-metadata.json from R2
    // 2. For each public content item, fetch the HTML from R2
    // 3. Write the HTML files to the dist directory
    // 4. This would require R2 access from the frontend build process

    console.log('✅ Content fetch completed successfully')

    // Update build log on success
    if (buildLogId) {
      try {
        const buildEndTime = new Date().toISOString()
        await fetch(`${apiUrl}/api/admin/build-logs/${buildLogId}`, {
          method: 'PUT',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'success',
            completedAt: buildEndTime,
            logOutput: logOutput.join('\n')
          }),
        })
        console.log(`📝 Updated build log entry #${buildLogId} (success)`)
      } catch (logError) {
        console.warn('⚠️  Failed to update build log entry (non-fatal):', logError instanceof Error ? logError.message : 'Unknown error')
      }
    }

    // Restore original console methods
    console.log = originalLog
    console.error = originalError
    console.warn = originalWarn

  } catch (error) {
    // Restore original console methods
    console.log = originalLog
    console.error = originalError
    console.warn = originalWarn

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error && error.cause ? ` (${error.cause})` : ''

    console.error('❌ Failed to fetch content from API:', errorMessage + errorDetails)
    console.error(`   API URL: ${apiUrl}`)
    console.error(`   Make sure the API server is running at ${apiUrl}`)
    console.warn('⚠️  Creating fallback with empty content metadata...')

    // Create fallback content metadata
    const fallbackMetadata: ContentMetadata = {
      notes: [],
      ideas: [],
      publications: [],
      pages: [],
      latest: []
    }

    // Ensure directories exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const srcDataDir = path.join(__dirname, '..', 'src', 'data')
    if (!fs.existsSync(srcDataDir)) {
      fs.mkdirSync(srcDataDir, { recursive: true })
    }

    // Write fallback metadata
    const metadataJson = JSON.stringify(fallbackMetadata, null, 2)
    const distMetadataPath = path.join(outputDir, 'content-metadata.json')
    const srcMetadataPath = path.join(srcDataDir, 'content-metadata.json')

    fs.writeFileSync(distMetadataPath, metadataJson)
    fs.writeFileSync(srcMetadataPath, metadataJson)

    console.log('✅ Created fallback content-metadata.json')
    console.log('⚠️  Note: Using empty content metadata. API may not be accessible during build.')

    // Update build log on failure
    if (buildLogId) {
      try {
        const buildEndTime = new Date().toISOString()
        await fetch(`${apiUrl}/api/admin/build-logs/${buildLogId}`, {
          method: 'PUT',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'failed',
            completedAt: buildEndTime,
            logOutput: logOutput.join('\n'),
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }),
        })
        console.log(`📝 Updated build log entry #${buildLogId} (failed)`)
      } catch (logError) {
        console.warn('⚠️  Failed to update build log entry (non-fatal):', logError instanceof Error ? logError.message : 'Unknown error')
      }
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  // API URL: Use BUILD_API_URL if set (for cases where build-time API differs from runtime)
  // Otherwise fall back to VITE_API_BASE_URL (safe to expose to client - just a URL)
  // Use BUILD_API_KEY (NOT VITE_ prefix - sensitive, build-only, should NOT be exposed to client)
  // Build scripts have access to ALL env vars via process.env, not just VITE_ prefixed ones
  const apiUrl = process.env.BUILD_API_URL || process.env.VITE_API_BASE_URL || 'http://localhost:8787'
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
