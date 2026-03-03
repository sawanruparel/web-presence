#!/usr/bin/env tsx
/**
 * preview-content.ts
 *
 * Renders a single markdown file through the mdtohtml pipeline and opens the
 * result in the browser (or prints to stdout with --stdout flag).
 *
 * Usage:
 *   npx tsx scripts/preview-content.ts content/notes/my-note.md
 *   npx tsx scripts/preview-content.ts content/ideas/some-idea.md --stdout
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'
import {
  parseFrontmatter,
  convertMarkdownToHtml,
  removeTitleFromHtml,
  generateExcerpt,
  generateHtmlTemplate
} from '../mdtohtml/src/index.ts'

async function main() {
  const args = process.argv.slice(2)
  const filePath = args.find(a => !a.startsWith('--'))
  const toStdout = args.includes('--stdout')

  if (!filePath) {
    console.error('Usage: tsx scripts/preview-content.ts <path-to-markdown> [--stdout]')
    process.exit(1)
  }

  const absPath = path.resolve(filePath)
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`)
    process.exit(1)
  }

  const raw = fs.readFileSync(absPath, 'utf8')
  const { frontmatter, body } = parseFrontmatter(raw)

  if (frontmatter?.draft === true) {
    console.warn('⚠️  This file is marked draft: true')
  }

  const html = convertMarkdownToHtml(body)
  const title = (frontmatter?.title as string) || path.basename(absPath, '.md')
  const bodyHtml = removeTitleFromHtml(html, title)
  const excerpt = (frontmatter?.description as string) || generateExcerpt(body, 160)

  const fullHtml = generateHtmlTemplate({
    frontmatter: {
      ...frontmatter,
      title,
      description: excerpt
    },
    htmlContent: bodyHtml,
    baseUrl: 'http://localhost:3000',
    publisherName: 'Preview'
  })

  if (toStdout) {
    process.stdout.write(fullHtml)
    return
  }

  // Write to temp file and open
  const tmpFile = path.join(os.tmpdir(), `preview-${Date.now()}.html`)
  fs.writeFileSync(tmpFile, fullHtml)
  console.log(`✅ Rendered: ${absPath}`)
  console.log(`📄 Preview: ${tmpFile}`)
  console.log(`   Title: ${title}`)
  console.log(`   Draft: ${frontmatter?.draft ?? false}`)
  console.log(`   Date:  ${frontmatter?.date ?? 'not set'}`)

  // Open in browser
  const open = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  try {
    execSync(`${open} "${tmpFile}"`)
  } catch {
    console.log(`   (Could not auto-open browser — open the file manually)`)
  }
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
