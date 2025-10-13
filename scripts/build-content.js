import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const contentDir = path.join(__dirname, '..', 'content')
const distDir = path.join(__dirname, '..', 'dist', 'content')

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

function processMarkdownFiles() {
  const types = ['notes', 'teachings', 'ideas']
  const allContent = {}

  types.forEach(type => {
    const typeDir = path.join(contentDir, type)
    const distTypeDir = path.join(distDir, type)
    
    if (!fs.existsSync(typeDir)) {
      allContent[type] = []
      return
    }

    // Ensure dist type directory exists
    if (!fs.existsSync(distTypeDir)) {
      fs.mkdirSync(distTypeDir, { recursive: true })
    }

    const files = fs.readdirSync(typeDir).filter(file => file.endsWith('.md'))
    const typeContent = []

    files.forEach(file => {
      const slug = file.replace('.md', '')
      const filePath = path.join(typeDir, file)
      const fileContents = fs.readFileSync(filePath, 'utf8')
      const { data, content } = matter(fileContents)
      
      // Generate excerpt
      const excerpt = content.split('\n\n')[0]?.replace(/[#*]/g, '').trim().substring(0, 150) + '...'
      
      // Convert markdown to HTML
      const html = marked(content)
      
      const contentItem = {
        slug,
        title: data.title || slug,
        date: data.date || new Date().toISOString().split('T')[0],
        readTime: data.readTime || '1 min',
        type: data.type || type.slice(0, -1),
        content,
        html,
        excerpt
      }

      typeContent.push(contentItem)

      // Write individual HTML file
      const htmlFile = path.join(distTypeDir, `${slug}.html`)
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${contentItem.title}</title>
  <link rel="stylesheet" href="/src/style.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`
      
      fs.writeFileSync(htmlFile, htmlContent)
    })

    allContent[type] = typeContent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  // Write content index
  const contentIndex = {
    notes: allContent.notes,
    teachings: allContent.teachings,
    ideas: allContent.ideas,
    latest: [...allContent.notes, ...allContent.teachings, ...allContent.ideas]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)
  }

  // Write to both dist and src for runtime access
  fs.writeFileSync(
    path.join(distDir, 'index.json'),
    JSON.stringify(contentIndex, null, 2)
  )
  
  // Also write to src for runtime import
  fs.writeFileSync(
    path.join(__dirname, '..', 'src', 'data', 'content.json'),
    JSON.stringify(contentIndex, null, 2)
  )

  console.log('Content processed successfully!')
  console.log(`- Notes: ${allContent.notes.length}`)
  console.log(`- Teachings: ${allContent.teachings.length}`)
  console.log(`- Ideas: ${allContent.ideas.length}`)
}

processMarkdownFiles()
