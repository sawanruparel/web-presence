import { Hono } from 'hono'
import type { Context } from 'hono'
import type { Env } from '../types/env'
import { GitHubService } from '../services/github-service'
import { ContentProcessingService } from '../services/content-processing-service'
import { parseFrontmatter } from 'mdtohtml'
import { stringify as yamlStringify } from 'yaml'

const contentManagementRouter = new Hono<{ Bindings: Env }>()

/**
 * List all content files by type
 */
contentManagementRouter.get('/list/:type', async (c: Context) => {
  try {
    const env = c.env
    const type = c.req.param('type')

    // Validate API key
    const apiKey = c.req.header('X-API-Key')
    if (apiKey !== env.INTERNAL_API_KEY) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

    const githubService = new GitHubService(env)
    const files = await githubService.getDirectory(`content/${type}`)

    // Filter for .md files and extract metadata
    const contentFiles = files
      .filter(file => file.name.endsWith('.md'))
      .map(file => {
        const slug = file.name.replace(/\.md$/, '')
        return {
          path: file.path,
          slug,
          name: file.name,
          size: file.size,
          sha: file.sha,
          url: file.html_url,
          lastModified: new Date().toISOString() // GitHub doesn't provide this easily
        }
      })

    return c.json({
      type,
      count: contentFiles.length,
      files: contentFiles
    }, 200)

  } catch (error) {
    console.error('❌ Failed to list content:', error)
    return c.json({ 
      error: 'Failed to list content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * Get file content for editing
 */
contentManagementRouter.get('/file/:type/:slug', async (c: Context) => {
  try {
    const env = c.env
    const type = c.req.param('type')
    const slug = c.req.param('slug')

    // Validate API key
    const apiKey = c.req.header('X-API-Key')
    if (apiKey !== env.INTERNAL_API_KEY) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

    const githubService = new GitHubService(env)
    const filePath = `content/${type}/${slug}.md`
    
    // Get file from GitHub
    const file = await githubService.getFile(filePath)
    if (!file) {
      return c.json({ error: 'File not found' }, 404)
    }

    // Get file content
    const content = await githubService.getFileContent(filePath)
    if (!content) {
      return c.json({ error: 'Could not read file content' }, 500)
    }

    // Parse frontmatter
    const contentProcessor = new ContentProcessingService()
    const { frontmatter, body } = parseFrontmatter(content)

    return c.json({
      path: filePath,
      slug,
      markdown: content,
      frontmatter,
      body,
      sha: file.sha,
      size: file.size,
      url: file.html_url
    }, 200)

  } catch (error) {
    console.error('❌ Failed to get file content:', error)
    return c.json({ 
      error: 'Failed to get file content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * Create new file
 */
contentManagementRouter.post('/file', async (c: Context) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const { type, slug, markdown, frontmatter = {}, commitMessage } = body

    // Validate API key
    const apiKey = c.req.header('X-API-Key')
    if (apiKey !== env.INTERNAL_API_KEY) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

    // Validate required fields
    if (!type || !slug || !markdown) {
      return c.json({ error: 'Missing required fields: type, slug, markdown' }, 400)
    }

    const githubService = new GitHubService(env)
    const filePath = `content/${type}/${slug}.md`

    // Check if file already exists
    const existingFile = await githubService.getFile(filePath)
    if (existingFile) {
      return c.json({ error: 'File already exists' }, 409)
    }

    // Create markdown content with frontmatter
    const frontmatterString = Object.keys(frontmatter).length > 0 
      ? `---\n${yamlStringify(frontmatter)}---\n\n`
      : ''
    
    const fullContent = frontmatterString + markdown

    // Create file in GitHub
    const result = await githubService.createOrUpdateFile(filePath, {
      message: commitMessage || `Create ${type}/${slug}.md`,
      content: fullContent
    })

    if (!result) {
      return c.json({ error: 'Failed to create file' }, 500)
    }

    return c.json({
      message: 'File created successfully',
      path: filePath,
      slug,
      sha: result.sha,
      url: result.html_url
    }, 201)

  } catch (error) {
    console.error('❌ Failed to create file:', error)
    return c.json({ 
      error: 'Failed to create file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * Update existing file
 */
contentManagementRouter.put('/file/:type/:slug', async (c: Context) => {
  try {
    const env = c.env
    const type = c.req.param('type')
    const slug = c.req.param('slug')
    const body = await c.req.json()
    const { markdown, frontmatter = {}, sha, commitMessage } = body

    // Validate API key
    const apiKey = c.req.header('X-API-Key')
    if (apiKey !== env.INTERNAL_API_KEY) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

    // Validate required fields
    if (!markdown || !sha) {
      return c.json({ error: 'Missing required fields: markdown, sha' }, 400)
    }

    const githubService = new GitHubService(env)
    const filePath = `content/${type}/${slug}.md`

    // Check if file exists
    const existingFile = await githubService.getFile(filePath)
    if (!existingFile) {
      return c.json({ error: 'File not found' }, 404)
    }

    // Create markdown content with frontmatter
    const frontmatterString = Object.keys(frontmatter).length > 0 
      ? `---\n${yamlStringify(frontmatter)}---\n\n`
      : ''
    
    const fullContent = frontmatterString + markdown

    // Update file in GitHub
    const result = await githubService.createOrUpdateFile(filePath, {
      message: commitMessage || `Update ${type}/${slug}.md`,
      content: fullContent,
      sha
    })

    if (!result) {
      return c.json({ error: 'Failed to update file' }, 500)
    }

    return c.json({
      message: 'File updated successfully',
      path: filePath,
      slug,
      sha: result.sha,
      url: result.html_url
    }, 200)

  } catch (error) {
    console.error('❌ Failed to update file:', error)
    return c.json({ 
      error: 'Failed to update file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * Delete file
 */
contentManagementRouter.delete('/file/:type/:slug', async (c: Context) => {
  try {
    const env = c.env
    const type = c.req.param('type')
    const slug = c.req.param('slug')
    const body = await c.req.json()
    const { sha, commitMessage } = body

    // Validate API key
    const apiKey = c.req.header('X-API-Key')
    if (apiKey !== env.INTERNAL_API_KEY) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

    // Validate required fields
    if (!sha) {
      return c.json({ error: 'Missing required field: sha' }, 400)
    }

    const githubService = new GitHubService(env)
    const filePath = `content/${type}/${slug}.md`

    // Check if file exists
    const existingFile = await githubService.getFile(filePath)
    if (!existingFile) {
      return c.json({ error: 'File not found' }, 404)
    }

    // Delete file from GitHub
    const success = await githubService.deleteFile(
      filePath,
      sha,
      commitMessage || `Delete ${type}/${slug}.md`
    )

    if (!success) {
      return c.json({ error: 'Failed to delete file' }, 500)
    }

    return c.json({
      message: 'File deleted successfully',
      path: filePath,
      slug
    }, 200)

  } catch (error) {
    console.error('❌ Failed to delete file:', error)
    return c.json({ 
      error: 'Failed to delete file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * Get content types
 */
contentManagementRouter.get('/types', async (c: Context) => {
  try {
    const env = c.env

    // Validate API key
    const apiKey = c.req.header('X-API-Key')
    if (apiKey !== env.INTERNAL_API_KEY) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

    const contentTypes = ['notes', 'ideas', 'publications', 'pages']
    
    return c.json({
      types: contentTypes.map(type => ({
        name: type,
        displayName: type.charAt(0).toUpperCase() + type.slice(1),
        path: `content/${type}`
      }))
    }, 200)

  } catch (error) {
    console.error('❌ Failed to get content types:', error)
    return c.json({ 
      error: 'Failed to get content types',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export { contentManagementRouter }
