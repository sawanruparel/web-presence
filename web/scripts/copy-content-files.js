import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const distDir = path.join(__dirname, '..', 'dist')
const tempContentDir = path.join(__dirname, '..', 'temp-content')

// Copy content files to final dist directory
function copyContentFiles() {
  const contentTypes = ['notes', 'publications', 'ideas', 'pages']
  
  contentTypes.forEach(type => {
    const sourceDir = path.join(tempContentDir, type)
    const targetDir = path.join(distDir, type)
    
    if (fs.existsSync(sourceDir)) {
      // Ensure target directory exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }
      
      // Copy all HTML files
      const files = fs.readdirSync(sourceDir)
      files.forEach(file => {
        if (file.endsWith('.html')) {
          const sourcePath = path.join(sourceDir, file)
          const targetPath = path.join(targetDir, file)
          fs.copyFileSync(sourcePath, targetPath)
          console.log(`Copied ${type}/${file}`)
        }
      })
    }
  })
  
  // Copy metadata file
  const metadataSource = path.join(tempContentDir, 'content-metadata.json')
  const metadataTarget = path.join(distDir, 'content-metadata.json')
  
  if (fs.existsSync(metadataSource)) {
    fs.copyFileSync(metadataSource, metadataTarget)
    console.log('Copied content-metadata.json')
  }
  
  console.log('Content files copied to dist directory')
}

copyContentFiles()
