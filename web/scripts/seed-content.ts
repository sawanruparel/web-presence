/**
 * seed-content.ts
 *
 * Reads local content/ markdown files and writes a populated content-metadata.json
 * to src/data/ — bypassing the API entirely for local development.
 *
 * Usage:
 *   npm run seed:content
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { convertMarkdownToHtml, parseFrontmatter } from '../../mdtohtml/src/index.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CONTENT_DIR = path.resolve(__dirname, '..', '..', 'content')
const OUTPUT_DIR = path.resolve(__dirname, '..', 'src', 'data')

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

type ContentType = 'notes' | 'publications' | 'ideas' | 'pages'
type SingleType = 'note' | 'publication' | 'idea' | 'page'

const TYPE_MAP: Record<ContentType, SingleType> = {
  notes: 'note',
  publications: 'publication',
  ideas: 'idea',
  pages: 'page'
}

function readType(type: ContentType): ContentItem[] {
  const dir = path.join(CONTENT_DIR, type)
  if (!fs.existsSync(dir)) return []

  const items: ContentItem[] = []

  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const slug = file.replace('.md', '')
    const raw = fs.readFileSync(path.join(dir, file), 'utf8')
    const { frontmatter, body } = parseFrontmatter(raw)

    // Skip drafts
    if (frontmatter?.draft === true) {
      console.log(`⏭️  Skipping draft: ${type}/${slug}`)
      continue
    }

    const html = convertMarkdownToHtml(body)
    const htmlWithoutTitle = html.replace(/<h1[^>]*>.*?<\/h1>\s*/i, '')
    const excerpt = body.split('\n\n')[0]?.replace(/[#*]/g, '').trim().substring(0, 150) + '...'

    let title = (frontmatter?.title as string) || slug
    for (const prefix of ['Idea: ', 'Publication: ', 'Note: ']) {
      if (title.startsWith(prefix)) { title = title.slice(prefix.length); break }
    }

    const readingTime = frontmatter?.reading_time as number | undefined
    items.push({
      slug,
      title,
      date: (frontmatter?.date as string) || new Date().toISOString().split('T')[0],
      readTime: readingTime ? `${readingTime} min` : '1 min',
      type: TYPE_MAP[type],
      excerpt,
      content: body,
      html: htmlWithoutTitle
    })
  }

  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function seed() {
  console.log(`📂 Reading content from ${CONTENT_DIR}`)

  const notes = readType('notes')
  const publications = readType('publications')
  const ideas = readType('ideas')
  const pages = readType('pages')

  const latest = [...notes, ...publications, ...ideas]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  const metadata = { notes, publications, ideas, pages, latest }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const outPath = path.join(OUTPUT_DIR, 'content-metadata.json')
  fs.writeFileSync(outPath, JSON.stringify(metadata, null, 2))

  console.log(`✅ Wrote content-metadata.json`)
  console.log(`   notes: ${notes.length}, ideas: ${ideas.length}, publications: ${publications.length}, pages: ${pages.length}`)
}

seed()
