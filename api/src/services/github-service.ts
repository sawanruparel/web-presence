import type { Env } from '../types/env'

export interface GitHubFile {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string
  type: 'file' | 'dir'
  content?: string
  encoding?: string
}

export interface GitHubCommit {
  message: string
  content: string
  sha?: string
  branch?: string
}

export interface GitHubWebhookPayload {
  ref: string
  repository: {
    full_name: string
    default_branch: string
  }
  commits: Array<{
    id: string
    message: string
    added: string[]
    removed: string[]
    modified: string[]
  }>
}

export class GitHubService {
  private token: string
  private repo: string
  private branch: string

  constructor(env: Env) {
    this.token = env.GITHUB_TOKEN
    this.repo = env.GITHUB_REPO
    this.branch = env.GITHUB_BRANCH || 'main'
  }

  /**
   * Get file contents from GitHub
   */
  async getFile(path: string): Promise<GitHubFile | null> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'web-presence-api'
          }
        }
      )

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }

      return await response.json() as GitHubFile
    } catch (error) {
      console.error(`Error fetching file ${path}:`, error)
      return null
    }
  }

  /**
   * Get directory contents from GitHub
   */
  async getDirectory(path: string): Promise<GitHubFile[]> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'web-presence-api'
          }
        }
      )

      if (response.status === 404) {
        return []
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }

      return await response.json() as GitHubFile[]
    } catch (error) {
      console.error(`Error fetching directory ${path}:`, error)
      return []
    }
  }

  /**
   * Get file content as text (decoded from base64)
   */
  async getFileContent(path: string): Promise<string | null> {
    const file = await this.getFile(path)
    if (!file || !file.content) {
      return null
    }

    try {
      // GitHub returns content as base64 encoded
      const binaryString = atob(file.content)
      const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0))
      const decoded = new TextDecoder('utf-8').decode(bytes)
      return decoded
    } catch (error) {
      console.error(`Error decoding file content ${path}:`, error)
      return null
    }
  }

  /**
   * Create or update a file in GitHub
   */
  async createOrUpdateFile(path: string, commit: GitHubCommit): Promise<GitHubFile | null> {
    try {
      // Encode content as base64
      const content = btoa(commit.content)

      const response = await fetch(
        `https://api.github.com/repos/${this.repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'web-presence-api',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: commit.message,
            content: content,
            sha: commit.sha, // Only for updates
            branch: commit.branch || this.branch
          })
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${error}`)
      }

      return await response.json() as GitHubFile
    } catch (error) {
      console.error(`Error creating/updating file ${path}:`, error)
      return null
    }
  }

  /**
   * Delete a file from GitHub
   */
  async deleteFile(path: string, sha: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.repo}/contents/${path}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'web-presence-api',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: message,
            sha: sha,
            branch: this.branch
          })
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${error}`)
      }

      return true
    } catch (error) {
      console.error(`Error deleting file ${path}:`, error)
      return false
    }
  }

  /**
   * Get all content files from the content directory.
   * Includes pages (e.g. content/pages/about.md, content/pages/contact.md) so
   * about and contact stay in sync when running admin content-sync or full sync.
   */
  async getAllContentFiles(): Promise<GitHubFile[]> {
    const contentTypes = ['notes', 'ideas', 'publications', 'pages']
    const allFiles: GitHubFile[] = []

    for (const type of contentTypes) {
      const files = await this.getDirectory(`content/${type}`)
      // Filter for .md files
      const mdFiles = files.filter(file => file.name.endsWith('.md'))
      allFiles.push(...mdFiles)
    }

    return allFiles
  }

  /**
   * Get files that changed in a webhook payload.
   * Includes any content/*.md, so content/pages/about.md and content/pages/contact.md
   * trigger sync on push.
   */
  getChangedFiles(payload: GitHubWebhookPayload): string[] {
    const changedFiles: string[] = []

    for (const commit of payload.commits) {
      // Any .md under content/ (includes content/pages/about.md, content/pages/contact.md)
      const contentFiles = [
        ...commit.added,
        ...commit.modified,
        ...commit.removed
      ].filter(path => path.startsWith('content/') && path.endsWith('.md'))

      changedFiles.push(...contentFiles)
    }

    return [...new Set(changedFiles)] // Remove duplicates
  }


  /**
   * Validate webhook signature
   */
  async validateWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
    try {
      // GitHub uses HMAC-SHA256 for webhook signatures
      const encoder = new TextEncoder()
      const key = encoder.encode(secret)
      const data = encoder.encode(payload)

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )

      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data)
      const expectedSignature = 'sha256=' + Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      return signature === expectedSignature
    } catch (error) {
      console.error('Error validating webhook signature:', error)
      return false
    }
  }
}
