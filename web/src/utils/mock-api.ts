/**
 * Mock API Server for Development
 * 
 * Provides mock responses for password verification and protected content
 * when running in development mode.
 */

import { config } from '../config/environment'

// Mock protected content data (in a real app, this would come from the backend)
const mockProtectedContent = {
  'ideas': {
    'sample-protected-idea': {
      slug: 'sample-protected-idea',
      title: 'Sample Protected Idea',
      date: '2025-01-15',
      readTime: '3 min',
      type: 'idea',
      excerpt: 'This is a sample protected idea that demonstrates the password protection feature.',
      content: `# Sample Protected Idea

This is a sample protected idea that demonstrates the password protection feature.

## What This Tests

This protected content will help you test:

1. **Password verification flow** - Users need to enter a password to access this content
2. **Session management** - Once verified, users stay logged in for the session
3. **Content fetching** - The full content is fetched from the backend API
4. **UI indicators** - Protected content shows a lock icon and "Protected" badge

## Technical Details

- This content is stored in \`content-protected/ideas/\`
- It has \`protected: true\` in the frontmatter
- The build process will generate it in \`protected-content.json\` for the backend
- The frontend will show it in the ideas list with a lock icon
- Clicking it will prompt for a password

## Backend Requirements

For this to work, you'll need to implement the backend API as described in \`docs/api-contract.md\`:

1. **Password verification endpoint** - \`POST /api/verify-password\`
2. **Content retrieval endpoint** - \`GET /api/protected-content/:type/:slug\`
3. **Password storage** - Store hashed passwords for each protected content item

## Testing Steps

1. Add this file to your \`content-protected/ideas/\` folder
2. Run the build process to generate \`protected-content.json\`
3. Set up your backend API with the password "test123" for this content
4. Start your frontend and navigate to the Ideas page
5. You should see this idea with a lock icon
6. Click it and enter the password to access the content

## Security Notes

- Passwords should be hashed with bcrypt on the backend
- Tokens should have reasonable expiration times
- Rate limiting should be implemented for password attempts
- All API communication should be over HTTPS in production

This is just a sample - replace with your actual protected content!`,
      html: `<p>This is a sample protected idea that demonstrates the password protection feature.</p>
<h2>What This Tests</h2>
<p>This protected content will help you test:</p>
<ol>
<li><strong>Password verification flow</strong> - Users need to enter a password to access this content</li>
<li><strong>Session management</strong> - Once verified, users stay logged in for the session</li>
<li><strong>Content fetching</strong> - The full content is fetched from the backend API</li>
<li><strong>UI indicators</strong> - Protected content shows a lock icon and "Protected" badge</li>
</ol>
<h2>Technical Details</h2>
<ul>
<li>This content is stored in <code>content-protected/ideas/</code></li>
<li>It has <code>protected: true</code> in the frontmatter</li>
<li>The build process will generate it in <code>protected-content.json</code> for the backend</li>
<li>The frontend will show it in the ideas list with a lock icon</li>
<li>Clicking it will prompt for a password</li>
</ul>
<h2>Backend Requirements</h2>
<p>For this to work, you'll need to implement the backend API as described in <code>docs/api-contract.md</code>:</p>
<ol>
<li><strong>Password verification endpoint</strong> - <code>POST /api/verify-password</code></li>
<li><strong>Content retrieval endpoint</strong> - <code>GET /api/protected-content/:type/:slug</code></li>
<li><strong>Password storage</strong> - Store hashed passwords for each protected content item</li>
</ol>
<h2>Testing Steps</h2>
<ol>
<li>Add this file to your <code>content-protected/ideas/</code> folder</li>
<li>Run the build process to generate <code>protected-content.json</code></li>
<li>Set up your backend API with the password "test123" for this content</li>
<li>Start your frontend and navigate to the Ideas page</li>
<li>You should see this idea with a lock icon</li>
<li>Click it and enter the password to access the content</li>
</ol>
<h2>Security Notes</h2>
<ul>
<li>Passwords should be hashed with bcrypt on the backend</li>
<li>Tokens should have reasonable expiration times</li>
<li>Rate limiting should be implemented for password attempts</li>
<li>All API communication should be over HTTPS in production</li>
</ul>
<p>This is just a sample - replace with your actual protected content!</p>`,
      isProtected: true
    }
  },
  'notes': {},
  'publications': {},
  'pages': {}
}

// Mock passwords (in a real app, these would be hashed)
const mockPasswords = {
  'ideas': {
    'sample-protected-idea': 'test123'
  },
  'notes': {},
  'publications': {},
  'pages': {}
}

// Generate a simple JWT-like token (not cryptographically secure, just for demo)
function generateMockToken(type: string, slug: string): string {
  const payload = {
    type,
    slug,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  }
  return btoa(JSON.stringify(payload))
}

// Verify a mock token
function verifyMockToken(token: string): { type: string; slug: string } | null {
  try {
    const payload = JSON.parse(atob(token))
    if (payload.exp && payload.exp > Date.now()) {
      return { type: payload.type, slug: payload.slug }
    }
    return null
  } catch {
    return null
  }
}

export class MockApiServer {
  private static instance: MockApiServer
  private isRunning = false

  static getInstance(): MockApiServer {
    if (!MockApiServer.instance) {
      MockApiServer.instance = new MockApiServer()
    }
    return MockApiServer.instance
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true

    if (config.isDev) {
      console.log('🔧 Mock API Server started for development')
      console.log('📝 Available protected content:')
      Object.entries(mockProtectedContent).forEach(([type, items]) => {
        Object.keys(items).forEach(slug => {
          console.log(`  - /${type}/${slug} (password: ${mockPasswords[type as keyof typeof mockPasswords][slug as keyof typeof mockPasswords[keyof typeof mockPasswords]] || 'not set'})`)
        })
      })
    }
  }

  stop() {
    this.isRunning = false
    if (config.isDev) {
      console.log('🔧 Mock API Server stopped')
    }
  }

  async handleRequest(url: string, options: RequestInit): Promise<Response> {
    if (!this.isRunning) {
      throw new Error('Mock API Server not running')
    }

    const { pathname } = new URL(url)
    
    // Handle password verification
    if (pathname === '/api/verify-password' && options.method === 'POST') {
      return this.handleVerifyPassword(options.body as string)
    }
    
    // Handle protected content retrieval
    if (pathname.startsWith('/api/protected-content/') && options.method === 'GET') {
      return this.handleGetProtectedContent(pathname, options.headers)
    }
    
    // Handle health check
    if (pathname === '/api/health' && options.method === 'GET') {
      return this.handleHealthCheck()
    }

    // Return 404 for unknown endpoints
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  private async handleVerifyPassword(body: string): Promise<Response> {
    try {
      const { type, slug, password } = JSON.parse(body)
      
      const expectedPassword = mockPasswords[type as keyof typeof mockPasswords]?.[slug as keyof typeof mockPasswords[keyof typeof mockPasswords]]
      
      if (!expectedPassword) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Content not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      if (password !== expectedPassword) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Invalid password'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      const token = generateMockToken(type, slug)
      
      return new Response(JSON.stringify({
        success: true,
        token,
        message: 'Password verified successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid request'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  private async handleGetProtectedContent(pathname: string, headers: any): Promise<Response> {
    try {
      const pathParts = pathname.split('/')
      const type = pathParts[3]
      const slug = pathParts[4]
      
      // Handle both Headers object and plain object
      let authHeader: string | null = null
      if (headers && typeof headers.get === 'function') {
        authHeader = headers.get('Authorization')
      } else if (headers && headers.Authorization) {
        authHeader = headers.Authorization
      }
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          error: 'Missing or invalid authorization header'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      const token = authHeader.substring(7)
      const tokenData = verifyMockToken(token)
      
      if (!tokenData || tokenData.type !== type || tokenData.slug !== slug) {
        return new Response(JSON.stringify({
          error: 'Invalid or expired token'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      const content = mockProtectedContent[type as keyof typeof mockProtectedContent]?.[slug as keyof typeof mockProtectedContent[keyof typeof mockProtectedContent]]
      
      if (!content) {
        return new Response(JSON.stringify({
          error: 'Content not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      return new Response(JSON.stringify(content), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      console.error('Mock API error in handleGetProtectedContent:', error)
      return new Response(JSON.stringify({
        error: 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  private async handleHealthCheck(): Promise<Response> {
    return new Response(JSON.stringify({
      status: 'ok',
      mode: 'mock',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Export singleton instance
export const mockApiServer = MockApiServer.getInstance()
