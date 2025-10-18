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

  console.log('🔄 Fetching content metadata from API...')

  try {
    // Fetch content metadata from catalog endpoint
    const catalogResponse = await fetch(`${apiUrl}/api/content/catalog`, {
      headers: {
        'X-API-Key': apiKey
      }
    })

    if (!catalogResponse.ok) {
      throw new Error(`Failed to fetch content catalog: ${catalogResponse.status}`)
    }

    const catalogData = await catalogResponse.json()
    console.log(`📊 Found content metadata with ${Object.keys(catalogData.metadata || {}).length} content types`)

    // Transform metadata to match ContentList interface
    // Note: API returns singular forms (note, idea, page) but we need plural forms
    const notes = transformContentItems(catalogData.metadata?.note || [], 'note')
    const publications = transformContentItems(catalogData.metadata?.publications || [], 'publication')
    const ideas = transformContentItems(catalogData.metadata?.idea || [], 'idea')
    const pages = transformContentItems(catalogData.metadata?.page || [], 'page')
    
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

  } catch (error) {
    console.warn('⚠️  Failed to fetch content from API, creating fallback:', error.message)
    
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
